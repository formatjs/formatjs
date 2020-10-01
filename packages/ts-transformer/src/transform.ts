import * as typescript from 'typescript';
import {MessageDescriptor} from './types';
import {interpolateName} from './interpolate-name';
import {parse, MessageFormatElement} from 'intl-messageformat-parser';
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

type TypeScript = typeof typescript;

function primitiveToTSNode(ts: TypeScript, v: string | number | boolean) {
  return typeof v === 'string'
    ? ts.createStringLiteral(v)
    : typeof v === 'number'
    ? ts.createNumericLiteral(v + '')
    : typeof v === 'boolean'
    ? v
      ? ts.createTrue()
      : ts.createFalse()
    : undefined;
}

function objToTSNode(ts: TypeScript, obj: object) {
  const props: typescript.PropertyAssignment[] = Object.entries(
    obj
  ).map(([k, v]) =>
    ts.createPropertyAssignment(
      k,
      primitiveToTSNode(ts, v) ||
        (Array.isArray(v)
          ? ts.createArrayLiteral(v.map(n => objToTSNode(ts, n)))
          : typeof v === 'object'
          ? objToTSNode(ts, v)
          : ts.createNull())
    )
  );
  return ts.createObjectLiteral(props);
}

function messageASTToTSNode(ts: TypeScript, ast: MessageFormatElement[]) {
  return ts.createArrayLiteral(ast.map(el => objToTSNode(ts, el)));
}

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
  /**
   * Whether to compile `defaultMessage` to AST.
   * This is no-op if `removeDefaultMessage` is `true`
   */
  ast?: boolean;
}

const DEFAULT_OPTS: Omit<Opts, 'program'> = {
  onMsgExtracted: () => undefined,
  onMetaExtracted: () => undefined,
};

function isMultipleMessageDecl(
  ts: TypeScript,
  node: typescript.CallExpression
) {
  return (
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'defineMessages'
  );
}

function isSingularMessageDecl(
  ts: TypeScript,
  node:
    | typescript.CallExpression
    | typescript.JsxOpeningElement
    | typescript.JsxSelfClosingElement,
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
  ts: TypeScript,
  node:
    | typescript.ObjectLiteralExpression
    | typescript.JsxOpeningElement
    | typescript.JsxSelfClosingElement,
  {overrideIdFn, extractSourceLocation}: Opts,
  sf: typescript.SourceFile
): MessageDescriptor | undefined {
  let properties:
    | typescript.NodeArray<typescript.ObjectLiteralElement>
    | undefined = undefined;
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
    if (name && ts.isIdentifier(name) && initializer) {
      if (ts.isStringLiteral(initializer)) {
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
      } else if (ts.isNoSubstitutionTemplateLiteral(initializer)) {
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
      } else if (
        ts.isJsxExpression(initializer) &&
        initializer.expression &&
        ts.isNoSubstitutionTemplateLiteral(initializer.expression)
      ) {
        const {expression} = initializer;
        switch (name.text) {
          case 'id':
            msg.id = expression.text;
            break;
          case 'defaultMessage':
            msg.defaultMessage = expression.text;
            break;
          case 'description':
            msg.description = expression.text;
            break;
        }
      }
    }
  });
  // We extracted nothing
  if (!msg.defaultMessage && !msg.id) {
    return;
  }

  if (msg.defaultMessage) {
    msg.defaultMessage = msg.defaultMessage.trim().replace(/\s+/gm, ' ');
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
          );
        }
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
function isIntlFormatMessageCall(
  ts: TypeScript,
  node: typescript.CallExpression
) {
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
  ts: TypeScript,
  node: typescript.JsxOpeningElement | typescript.JsxSelfClosingElement,
  opts: Opts,
  sf: typescript.SourceFile
): typeof node {
  const {onMsgExtracted} = opts;
  if (!isSingularMessageDecl(ts, node, opts.additionalComponentNames || [])) {
    return node;
  }
  const msg = extractMessageDescriptor(ts, node, opts, sf);
  if (!msg) {
    return node;
  }
  if (typeof onMsgExtracted === 'function') {
    onMsgExtracted(sf.fileName, [msg]);
  }

  const attrs = setAttributesInJsxAttributes(
    ts,
    node.attributes,
    {
      defaultMessage: opts.removeDefaultMessage
        ? undefined
        : msg.defaultMessage,
      id: msg.id,
    },
    opts.ast
  );
  return ts.isJsxOpeningElement(node)
    ? ts.createJsxOpeningElement(node.tagName, node.typeArguments, attrs)
    : ts.createJsxSelfClosingElement(node.tagName, node.typeArguments, attrs);
}

function setAttributesInObject(
  ts: TypeScript,
  node: typescript.ObjectLiteralExpression,
  msg: MessageDescriptor,
  ast?: boolean
) {
  const newProps = [
    ts.createPropertyAssignment('id', ts.createStringLiteral(msg.id)),
    ...(msg.defaultMessage
      ? [
          ts.createPropertyAssignment(
            'defaultMessage',
            ast
              ? messageASTToTSNode(ts, parse(msg.defaultMessage))
              : ts.createStringLiteral(msg.defaultMessage)
          ),
        ]
      : []),
  ];

  for (const prop of node.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      MESSAGE_DESC_KEYS.includes(prop.name.text as keyof MessageDescriptor)
    ) {
      continue;
    }
    if (ts.isPropertyAssignment(prop)) {
      newProps.push(prop);
    }
  }
  return ts.createObjectLiteral(ts.createNodeArray(newProps));
}

function setAttributesInJsxAttributes(
  ts: TypeScript,
  node: typescript.JsxAttributes,
  msg: MessageDescriptor,
  ast?: boolean
) {
  const newProps = [
    ts.createJsxAttribute(
      ts.createIdentifier('id'),
      ts.createStringLiteral(msg.id)
    ),
    ...(msg.defaultMessage
      ? [
          ts.createJsxAttribute(
            ts.createIdentifier('defaultMessage'),
            ast
              ? ts.createJsxExpression(
                  undefined,
                  messageASTToTSNode(ts, parse(msg.defaultMessage))
                )
              : ts.createStringLiteral(msg.defaultMessage)
          ),
        ]
      : []),
  ];
  for (const prop of node.properties) {
    if (
      ts.isJsxAttribute(prop) &&
      ts.isIdentifier(prop.name) &&
      MESSAGE_DESC_KEYS.includes(prop.name.text as keyof MessageDescriptor)
    ) {
      continue;
    }
    if (ts.isJsxAttribute(prop)) {
      newProps.push(prop);
    }
  }
  return ts.createJsxAttributes(ts.createNodeArray(newProps));
}

function extractMessagesFromCallExpression(
  ts: TypeScript,
  node: typescript.CallExpression,
  opts: Opts,
  sf: typescript.SourceFile
): typeof node {
  const {onMsgExtracted} = opts;
  if (isMultipleMessageDecl(ts, node)) {
    const [arg, ...restArgs] = node.arguments;
    let descriptorsObj: typescript.ObjectLiteralExpression | undefined;
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
        .filter<typescript.PropertyAssignment>(
          (prop): prop is typescript.PropertyAssignment =>
            ts.isPropertyAssignment(prop)
        )
        .map(
          prop =>
            ts.isObjectLiteralExpression(prop.initializer) &&
            extractMessageDescriptor(ts, prop.initializer, opts, sf)
        )
        .filter((msg): msg is MessageDescriptor => !!msg);
      if (!msgs.length) {
        return node;
      }
      if (typeof onMsgExtracted === 'function') {
        onMsgExtracted(sf.fileName, msgs);
      }

      const clonedProperties = ts.createNodeArray(
        properties.map((prop, i) => {
          if (
            !ts.isPropertyAssignment(prop) ||
            !ts.isObjectLiteralExpression(prop.initializer)
          ) {
            return prop;
          }

          return ts.createPropertyAssignment(
            prop.name,
            setAttributesInObject(
              ts,
              prop.initializer,
              {
                defaultMessage: opts.removeDefaultMessage
                  ? undefined
                  : msgs[i].defaultMessage,
                id: msgs[i] ? msgs[i].id : '',
              },
              opts.ast
            )
          );
        })
      );
      const clonedDescriptorsObj = ts.createObjectLiteral(clonedProperties);
      return ts.createCall(
        node.expression,
        node.typeArguments,
        ts.createNodeArray([clonedDescriptorsObj, ...restArgs])
      );
    }
  } else if (
    isSingularMessageDecl(ts, node, opts.additionalComponentNames || []) ||
    (opts.extractFromFormatMessageCall && isIntlFormatMessageCall(ts, node))
  ) {
    const [descriptorsObj, ...restArgs] = node.arguments;
    if (ts.isObjectLiteralExpression(descriptorsObj)) {
      const msg = extractMessageDescriptor(ts, descriptorsObj, opts, sf);
      if (!msg) {
        return node;
      }
      if (typeof onMsgExtracted === 'function') {
        onMsgExtracted(sf.fileName, [msg]);
      }

      return ts.createCall(
        node.expression,
        node.typeArguments,
        ts.createNodeArray([
          setAttributesInObject(
            ts,
            descriptorsObj,
            {
              defaultMessage: opts.removeDefaultMessage
                ? undefined
                : msg.defaultMessage,
              id: msg.id,
            },
            opts.ast
          ),
          ...restArgs,
        ])
      );
    }
  }
  return node;
}

const PRAGMA_REGEX = /^\/\/ @([^\s]*) (.*)$/m;

function getVisitor(
  ts: TypeScript,
  ctx: typescript.TransformationContext,
  sf: typescript.SourceFile,
  opts: Opts
) {
  const visitor: typescript.Visitor = (
    node: typescript.Node
  ): typescript.Node => {
    const newNode = ts.isCallExpression(node)
      ? extractMessagesFromCallExpression(ts, node, opts, sf)
      : ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)
      ? extractMessageFromJsxComponent(ts, node, opts, sf)
      : node;

    return ts.visitEachChild(newNode, visitor, ctx);
  };
  return visitor;
}

export function transformWithTs(ts: TypeScript, opts: Opts) {
  opts = {...DEFAULT_OPTS, ...opts};
  const transformFn: typescript.TransformerFactory<typescript.SourceFile> = ctx => {
    return (sf: typescript.SourceFile) => {
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
      return ts.visitNode(sf, getVisitor(ts, ctx, sf, opts));
    };
  };

  return transformFn;
}

export function transform(opts: Opts) {
  return transformWithTs(typescript, opts);
}
