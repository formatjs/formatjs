import * as ts from 'typescript';
import {MessageDescriptor} from './types';
import {interpolateName} from 'loader-utils';

export type Extractor = (filePath: string, msgs: MessageDescriptor[]) => void;

export type InterpolateNameFn = (
  id?: string,
  defaultMessage?: string,
  description?: string
) => string;

export interface Opts {
  /**
   * Whether the metadata about the location of the message in the source file
   * should be extracted. If `true`, then `file`, `start`, and `end`
   * fields will exist for each extracted message descriptors.
   * Defaults to `false`.
   */
  extractSourceLocation?: boolean;
  /**
   * The ES6 module source name of the React Intl package. Defaults to: `"react-intl"`,
   * but can be changed to another name/path to React Intl.
   *
   * @type {string}
   * @memberof Opts
   */
  moduleSourceName?: string;
  /**
   * Remove `defaultMessage` field in generated js after extraction.
   */
  removeDefaultMessage?: boolean;
  /**
   * Additional component names to extract messages from,
   * e.g: `['FormattedFooBarMessage']`. **NOTE**: By default we check
   * for the fact that `FormattedMessage` & `FormattedHTMLMessage` are
   * imported from `moduleSourceName` to make sure variable alias works.
   * This option does not do that so it's less safe.
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
   * webpack-style name interpolation
   *
   * @type {(InterpolateNameFn | string)}
   * @memberof Opts
   */
  overrideIdFn?: InterpolateNameFn | string;
  /**
   * TS Compiler program
   */
  program: ts.Program;
}

const DEFAULT_OPTS: Omit<Opts, 'program'> = {
  onMsgExtracted: () => undefined,
};

function getImportSpecifier(program: ts.Program, node: ts.Node) {
  const symbol = program.getTypeChecker().getSymbolAtLocation(node);
  if (!symbol) {
    return;
  }
  const decls = symbol.getDeclarations();
  if (!Array.isArray(decls) || decls.length !== 1) {
    return;
  }
  return decls[0] as ts.ImportSpecifier;
}

function referenceImport(
  moduleSourceName: string,
  importSpecifier?: ts.ImportSpecifier
): boolean {
  return (
    !!importSpecifier &&
    ts.isNamedImports(importSpecifier.parent) &&
    ts.isImportClause(importSpecifier.parent.parent) &&
    ts.isImportDeclaration(importSpecifier.parent.parent.parent) &&
    (importSpecifier.parent.parent.parent.moduleSpecifier as ts.StringLiteral)
      .text === moduleSourceName
  );
}

function isMultipleMessageDecl(
  node: ts.CallExpression,
  program: ts.Program,
  moduleSourceName: string
) {
  const importSpecifier = getImportSpecifier(program, node.expression);
  if (!importSpecifier) {
    return false;
  }
  return (
    referenceImport(moduleSourceName, importSpecifier) &&
    importSpecifier.name.text === 'defineMessages'
  );
}

function isSingularMessageDecl(
  node: ts.CallExpression | ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  program: ts.Program,
  moduleSourceName: string,
  additionalComponentNames: string[]
) {
  const importSpecifier = getImportSpecifier(
    program,
    ts.isCallExpression(node) ? node.expression : node.tagName
  );
  if (!importSpecifier) {
    return false;
  }
  const compNames = new Set([
    '_',
    'FormattedMessage',
    'FormattedHTMLMessage',
    ...additionalComponentNames,
  ]);
  return (
    referenceImport(moduleSourceName, importSpecifier) &&
    compNames.has(importSpecifier.name.text)
  );
}

function extractMessageDescriptor(
  node:
    | ts.ObjectLiteralExpression
    | ts.JsxOpeningElement
    | ts.JsxSelfClosingElement,
  sf: ts.SourceFile,
  {overrideIdFn, extractSourceLocation}: Opts
): MessageDescriptor | undefined {
  let properties: ts.NodeArray<ts.ObjectLiteralElement> | undefined = undefined;
  if (ts.isObjectLiteralExpression(node)) {
    properties = node.properties;
  } else if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    properties = node.attributes.properties;
  }
  const msg: MessageDescriptor = {};
  if (!properties) {
    return;
  }
  properties.forEach(prop => {
    const {name} = prop;
    const initializer =
      ts.isPropertyAssignment(prop) || ts.isJsxAttribute(prop)
        ? prop.initializer
        : undefined;
    if (!initializer || !ts.isStringLiteral(initializer) || !name) {
      return;
    }
    switch (name.getText(sf)) {
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
  if (!Object.keys(msg).length) {
    return;
  }
  if (!msg.id && overrideIdFn) {
    switch (typeof overrideIdFn) {
      case 'string':
        msg.id = interpolateName(
          {sourcePath: sf.fileName} as any,
          overrideIdFn,
          {content: `${msg.defaultMessage}#${msg.description}`}
        );
        break;
      case 'function':
        msg.id = overrideIdFn(msg.id, msg.defaultMessage, msg.description);
        break;
    }
  }
  if (extractSourceLocation) {
    return {
      ...msg,
      file: sf.fileName,
      start: node.getStart(sf),
      end: node.getEnd(),
    };
  }
  return msg;
}

function isIntlFormatMessageCall(node: ts.CallExpression, sf: ts.SourceFile) {
  const method = node.expression;
  if (!ts.isPropertyAccessExpression(method)) {
    return false;
  }

  return (
    (method.name.getText(sf) === 'formatMessage' &&
      ts.isIdentifier(method.expression) &&
      method.expression.getText(sf) === 'intl') ||
    (ts.isPropertyAccessExpression(method.expression) &&
      method.expression.name.getText(sf) === 'intl')
  );
}

function extractMessageFromJsxComponent(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  program: ts.Program,
  sf: ts.SourceFile,
  opts: Opts
): typeof node | undefined {
  const {moduleSourceName = 'react-intl', onMsgExtracted} = opts;
  if (
    !isSingularMessageDecl(
      node,
      program,
      moduleSourceName,
      opts.additionalComponentNames || []
    )
  ) {
    return;
  }
  const msg = extractMessageDescriptor(node, sf, opts);
  if (!msg) {
    return;
  }
  if (typeof onMsgExtracted === 'function') {
    onMsgExtracted(sf.fileName, [msg]);
  }

  const clonedEl = ts.getMutableClone(node);
  clonedEl.attributes = setAttributesInObject(clonedEl.attributes, {
    defaultMessage: opts.removeDefaultMessage ? undefined : msg.defaultMessage,
    id: msg.id,
  }) as ts.JsxAttributes;
  return clonedEl;
}

function setAttributesInObject(
  node: ts.ObjectLiteralExpression | ts.JsxAttributes,
  msg: MessageDescriptor
) {
  const newNode = ts.getMutableClone(node);
  newNode.properties = ts.createNodeArray(
    (['id', 'description', 'defaultMessage'] as Array<keyof MessageDescriptor>)
      .filter(k => !!msg[k])
      .map(k => {
        const val = msg[k];
        const keyNode = ts.createIdentifier(k);
        const valNode = ts.createStringLiteral(val + '');
        if (ts.isJsxAttributes(node)) {
          return ts.createJsxAttribute(keyNode, valNode);
        }
        return ts.createPropertyAssignment(keyNode, valNode);
      })
  ) as ts.NodeArray<ts.ObjectLiteralElementLike>;
  return newNode;
}

function extractMessagesFromCallExpression(
  node: ts.CallExpression,
  program: ts.Program,
  sf: ts.SourceFile,
  opts: Opts
): typeof node | undefined {
  const {moduleSourceName = 'react-intl', onMsgExtracted} = opts;
  if (isMultipleMessageDecl(node, program, moduleSourceName)) {
    const [descriptorsObj, ...restArgs] = node.arguments;
    if (ts.isObjectLiteralExpression(descriptorsObj)) {
      const properties = descriptorsObj.properties as ts.NodeArray<
        ts.PropertyAssignment
      >;
      const msgs = properties
        .map(prop =>
          extractMessageDescriptor(
            prop.initializer as ts.ObjectLiteralExpression,
            sf,
            opts
          )
        )
        .filter((msg): msg is MessageDescriptor => !!msg);
      if (!msgs.length) {
        return;
      }
      if (typeof onMsgExtracted === 'function') {
        onMsgExtracted(sf.fileName, msgs);
      }

      const newNode = ts.getMutableClone(node);
      const clonedDescriptorsObj = ts.getMutableClone(descriptorsObj);
      const clonedProperties = ts.createNodeArray(
        properties.map((prop, i) => {
          if (!ts.isObjectLiteralExpression(prop.initializer)) {
            return prop;
          }
          const clonedNode = ts.getMutableClone(prop);
          clonedNode.initializer = setAttributesInObject(prop.initializer, {
            defaultMessage: opts.removeDefaultMessage
              ? undefined
              : msgs[i].defaultMessage,
            id: msgs[i] ? msgs[i].id : undefined,
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
    isSingularMessageDecl(
      node,
      program,
      moduleSourceName,
      opts.additionalComponentNames || []
    ) ||
    (opts.extractFromFormatMessageCall && isIntlFormatMessageCall(node, sf))
  ) {
    const [descriptorsObj, ...restArgs] = node.arguments;
    if (ts.isObjectLiteralExpression(descriptorsObj)) {
      const msg = extractMessageDescriptor(descriptorsObj, sf, opts);
      if (!msg) {
        return;
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
}

export function transform(opts: Opts) {
  opts = {...DEFAULT_OPTS, ...opts};
  const {program} = opts;
  return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    function getVisitor(sf: ts.SourceFile) {
      const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
        const newNode = ts.isCallExpression(node)
          ? extractMessagesFromCallExpression(node, program, sf, opts)
          : ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)
          ? extractMessageFromJsxComponent(node, program, sf, opts)
          : undefined;

        return newNode || ts.visitEachChild(node, visitor, ctx);
      };
      return visitor;
    }

    return (sf: ts.SourceFile) => ts.visitNode(sf, getVisitor(sf));
  };
}
