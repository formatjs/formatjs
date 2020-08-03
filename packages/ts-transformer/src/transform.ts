import * as ts from 'typescript';
import {MessageDescriptor} from './types';
import {interpolateName} from './interpolate-name';

export type Extractor = (filePath: string, msgs: MessageDescriptor[]) => void;
export type MetaExtractor = (
  filePath: string,
  meta: Record<string, string>
) => void;

export type InterpolateNameFn = (
  id?: string,
  defaultMessage?: string,
  description?: string,
  filePath?: string
) => string;

const MESSAGE_DESC_KEYS: Array<keyof MessageDescriptor> = [
  'id',
  'defaultMessage',
  'description',
];

export interface Opts {
  /**
   * Parse specific additional custom pragma.
   * This allows you to tag certain file with metadata such as `project`.
   * For example with this file:
   * ```tsx
   * // @intl-meta project:my-custom-project
   * import {FormattedMessage} from 'react-intl';
   * <FormattedMessage defaultMessage="foo" id="bar" />;
   * ```
   * and with option `{pragma: "@intl-meta"}`,
   * we'll parse out `// @intl-meta project:my-custom-project`
   * into `{project: 'my-custom-project'}` in the result file.
   */
  pragma?: string;
  /**
   * Whether the metadata about the location of the message in the source file
   * should be extracted. If `true`, then `file`, `start`, and `end`
   * fields will exist for each extracted message descriptors.
   * Defaults to `false`.
   */
  extractSourceLocation?: boolean;
  /**
   * Remove `defaultMessage` field in generated js after extraction.
   */
  removeDefaultMessage?: boolean;
  /**
   * Additional component names to extract messages from,
   * e.g: `['FormattedFooBarMessage']`.
   */
  additionalComponentNames?: string[];
  /**
   * Opt-in to extract from `intl.formatMessage` call with the same restrictions,
   * e.g: has to be called with object literal such as
   * `intl.formatMessage({ id: 'foo', defaultMessage: 'bar', description: 'baz'})`
   */
  extractFromFormatMessageCall?: boolean;
  /**
   * Callback function that gets called everytime we encountered something
   * that looks like a MessageDescriptor
   *
   * @type {Extractor}
   * @memberof Opts
   */
  onMsgExtracted?: Extractor;
  /**
   * Callback function that gets called when we successfully parsed meta
   * declared in pragma
   */
  onMetaExtracted?: MetaExtractor;
  /**
   * webpack-style name interpolation
   *
   * @type {(InterpolateNameFn | string)}
   * @memberof Opts
   */
  overrideIdFn?: InterpolateNameFn | string;
}

const DEFAULT_OPTS: Omit<Opts, 'program'> = {
  onMsgExtracted: () => undefined,
  onMetaExtracted: () => undefined,
};

function isMultipleMessageDecl(node: ts.CallExpression) {
  return (
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'defineMessages'
  );
}

function isSingularMessageDecl(
  node: ts.CallExpression | ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  additionalComponentNames: string[]
) {
  const compNames = new Set([
    'FormattedMessage',
    'defineMessage',
    ...additionalComponentNames,
  ]);
  let fnName = '';
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    fnName = node.expression.text;
  } else if (ts.isJsxOpeningElement(node) && ts.isIdentifier(node.tagName)) {
    fnName = node.tagName.text;
  } else if (
    ts.isJsxSelfClosingElement(node) &&
    ts.isIdentifier(node.tagName)
  ) {
    fnName = node.tagName.text;
  }
  return compNames.has(fnName);
}

function extractMessageDescriptor(
  node:
    | ts.ObjectLiteralExpression
    | ts.JsxOpeningElement
    | ts.JsxSelfClosingElement,
  {overrideIdFn, extractSourceLocation}: Opts,
  sf: ts.SourceFile
): MessageDescriptor | undefined {
  let properties: ts.NodeArray<ts.ObjectLiteralElement> | undefined = undefined;
  if (ts.isObjectLiteralExpression(node)) {
    properties = node.properties;
  } else if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    properties = node.attributes.properties;
  }
  const msg: MessageDescriptor = {id: ''};
  if (!properties) {
    return;
  }

  properties.forEach(prop => {
    const {name} = prop;
    const initializer =
      ts.isPropertyAssignment(prop) || ts.isJsxAttribute(prop)
        ? prop.initializer
        : undefined;
    if (
      !initializer ||
      !ts.isStringLiteral(initializer) ||
      !name ||
      !ts.isIdentifier(name)
    ) {
      return;
    }
    switch (name.text) {
      case 'id':
        msg.id = initializer.text;
        break;
      case 'defaultMessage':
        msg.defaultMessage = initializer.text;
        break;
      case 'description':
        msg.description = initializer.text;
        break;
    }
  });
  // We extracted nothing
  if (!msg.defaultMessage && !msg.id) {
    return;
  }
  if (msg.defaultMessage && overrideIdFn) {
    switch (typeof overrideIdFn) {
      case 'string':
        if (!msg.id) {
          msg.id = interpolateName(
            {sourcePath: sf.fileName} as any,
            overrideIdFn,
            {
              content: msg.description
                ? `${msg.defaultMessage}#${msg.description}`
                : msg.defaultMessage,
            }
          }
        );
        break;
      case 'function':
        msg.id = overrideIdFn(
          msg.id,
          msg.defaultMessage,
          msg.description,
          sf.fileName
        );
        break;
    }
  }
  if (extractSourceLocation) {
    return {
      ...msg,
      file: sf.fileName,
      start: node.pos,
      end: node.end,
    };
  }
  return msg;
}

/**
 * Check if node is `intl.formatMessage` node
 * @param node
 * @param sf
 */
function isIntlFormatMessageCall(node: ts.CallExpression) {
  const method = node.expression;

  // Handle intl.formatMessage()
  if (ts.isPropertyAccessExpression(method)) {
    return (
      (method.name.text === 'formatMessage' &&
        ts.isIdentifier(method.expression) &&
        method.expression.text === 'intl') ||
      (ts.isPropertyAccessExpression(method.expression) &&
        method.expression.name.text === 'intl')
    );
  }

  // Handle formatMessage()
  return ts.isIdentifier(method) && method.text === 'formatMessage';
}

function extractMessageFromJsxComponent(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  opts: Opts,
  sf: ts.SourceFile
): typeof node {
  const {onMsgExtracted} = opts;
  if (!isSingularMessageDecl(node, opts.additionalComponentNames || [])) {
    return node;
  }
  const msg = extractMessageDescriptor(node, opts, sf);
  if (!msg) {
    return node;
  }
  if (typeof onMsgExtracted === 'function') {
    onMsgExtracted(sf.fileName, [msg]);
  }

  const clonedEl = ts.getMutableClone(node);
  clonedEl.attributes = setAttributesInJsxAttributes(clonedEl.attributes, {
    defaultMessage: opts.removeDefaultMessage ? undefined : msg.defaultMessage,
    id: msg.id,
  });
  return clonedEl;
}

function setAttributesInObject(
  node: ts.ObjectLiteralExpression,
  msg: MessageDescriptor
) {
  const newNode = ts.getMutableClone(node);
  const newProps = [];
  for (const k of MESSAGE_DESC_KEYS) {
    const val = msg[k];
    if (val) {
      newProps.push(
        ts.createPropertyAssignment(k, ts.createStringLiteral(String(val)))
      );
    }
  }
  for (const prop of node.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      MESSAGE_DESC_KEYS.includes(prop.name.text as keyof MessageDescriptor)
    ) {
      continue;
    }
    newProps.push(prop);
  }
  newNode.properties = ts.createNodeArray(newProps);
  return newNode;
}

function setAttributesInJsxAttributes(
  node: ts.JsxAttributes,
  msg: MessageDescriptor
) {
  const newNode = ts.getMutableClone(node);
  const newProps = [];
  for (const k of MESSAGE_DESC_KEYS) {
    const val = msg[k];
    if (val) {
      newProps.push(
        ts.createJsxAttribute(
          ts.createIdentifier(k),
          ts.createStringLiteral(String(val))
        )
      );
    }
  }
  for (const prop of node.properties) {
    if (
      ts.isJsxAttribute(prop) &&
      ts.isIdentifier(prop.name) &&
      MESSAGE_DESC_KEYS.includes(prop.name.text as keyof MessageDescriptor)
    ) {
      continue;
    }
    newProps.push(prop);
  }
  newNode.properties = ts.createNodeArray(newProps);
  return newNode;
}

function extractMessagesFromCallExpression(
  node: ts.CallExpression,
  opts: Opts,
  sf: ts.SourceFile
): typeof node {
  const {onMsgExtracted} = opts;
  if (isMultipleMessageDecl(node)) {
    const [arg, ...restArgs] = node.arguments;
    let descriptorsObj: ts.ObjectLiteralExpression | undefined;
    if (ts.isObjectLiteralExpression(arg)) {
      descriptorsObj = arg;
    } else if (
      ts.isAsExpression(arg) &&
      ts.isObjectLiteralExpression(arg.expression)
    ) {
      descriptorsObj = arg.expression;
    }
    if (descriptorsObj) {
      const properties = descriptorsObj.properties;
      const msgs = properties
        .filter<ts.PropertyAssignment>((prop): prop is ts.PropertyAssignment =>
          ts.isPropertyAssignment(prop)
        )
        .map(
          prop =>
            ts.isObjectLiteralExpression(prop.initializer) &&
            extractMessageDescriptor(prop.initializer, opts, sf)
        )
        .filter((msg): msg is MessageDescriptor => !!msg);
      if (!msgs.length) {
        return node;
      }
      if (typeof onMsgExtracted === 'function') {
        onMsgExtracted(sf.fileName, msgs);
      }

      const newNode = ts.getMutableClone(node);
      const clonedDescriptorsObj = ts.getMutableClone(descriptorsObj);
      const clonedProperties = ts.createNodeArray(
        properties.map((prop, i) => {
          if (
            !ts.isPropertyAssignment(prop) ||
            !ts.isObjectLiteralExpression(prop.initializer)
          ) {
            return prop;
          }
          const clonedNode = ts.getMutableClone(prop);
          clonedNode.initializer = setAttributesInObject(prop.initializer, {
            defaultMessage: opts.removeDefaultMessage
              ? undefined
              : msgs[i].defaultMessage,
            id: msgs[i] ? msgs[i].id : '',
          });
          return clonedNode;
        })
      );
      clonedDescriptorsObj.properties = clonedProperties;
      newNode.arguments = ts.createNodeArray([
        clonedDescriptorsObj,
        ...restArgs,
      ]);
      return newNode;
    }
  } else if (
    isSingularMessageDecl(node, opts.additionalComponentNames || []) ||
    (opts.extractFromFormatMessageCall && isIntlFormatMessageCall(node))
  ) {
    const [descriptorsObj, ...restArgs] = node.arguments;
    if (ts.isObjectLiteralExpression(descriptorsObj)) {
      const msg = extractMessageDescriptor(descriptorsObj, opts, sf);
      if (!msg) {
        return node;
      }
      if (typeof onMsgExtracted === 'function') {
        onMsgExtracted(sf.fileName, [msg]);
      }

      const newNode = ts.getMutableClone(node);
      newNode.arguments = ts.createNodeArray([
        setAttributesInObject(descriptorsObj, {
          defaultMessage: opts.removeDefaultMessage
            ? undefined
            : msg.defaultMessage,
          id: msg.id,
        }),
        ...restArgs,
      ]);
      return newNode;
    }
  }
  return node;
}

const PRAGMA_REGEX = /^\/\/ @([^\s]*) (.*)$/m;

function getVisitor(
  ctx: ts.TransformationContext,
  sf: ts.SourceFile,
  opts: Opts
) {
  const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
    const newNode = ts.isCallExpression(node)
      ? extractMessagesFromCallExpression(node, opts, sf)
      : ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)
      ? extractMessageFromJsxComponent(node, opts, sf)
      : node;

    return ts.visitEachChild(newNode, visitor, ctx);
  };
  return visitor;
}

export function transform(opts: Opts) {
  opts = {...DEFAULT_OPTS, ...opts};
  const transformFn: ts.TransformerFactory<ts.SourceFile> = ctx => {
    return (sf: ts.SourceFile) => {
      const pragmaResult = PRAGMA_REGEX.exec(sf.text);
      if (pragmaResult) {
        const [, pragma, kvString] = pragmaResult;
        if (pragma === opts.pragma) {
          const kvs = kvString.split(' ');
          const result: Record<string, string> = {};
          for (const kv of kvs) {
            const [k, v] = kv.split(':');
            result[k] = v;
          }
          if (typeof opts.onMetaExtracted === 'function') {
            opts.onMetaExtracted(sf.fileName, result);
          }
        }
      }
      return ts.visitNode(sf, getVisitor(ctx, sf, opts));
    };
  };

  return transformFn;
}
