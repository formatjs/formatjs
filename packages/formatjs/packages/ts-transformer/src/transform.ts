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

/**
 * Trim the trailing & beginning ': 'asd' -> asd
 *
 * @param {string} txt text
 * @returns trimmed string
 */
function trimSingleQuote(txt: string): string {
  return txt.replace(/["']/g, '');
}

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
  sf: ts.SourceFile,
  moduleSourceName: string,
  importSpecifier?: ts.ImportSpecifier
): boolean {
  return (
    !!importSpecifier &&
    ts.isNamedImports(importSpecifier.parent) &&
    ts.isImportClause(importSpecifier.parent.parent) &&
    ts.isImportDeclaration(importSpecifier.parent.parent.parent) &&
    trimSingleQuote(
      importSpecifier.parent.parent.parent.moduleSpecifier.getText(sf)
    ) === moduleSourceName
  );
}

function isMultipleMessageDecl(
  node: ts.CallExpression,
  program: ts.Program,
  sf: ts.SourceFile,
  moduleSourceName: string
) {
  const importSpecifier = getImportSpecifier(program, node.expression);
  if (!importSpecifier) {
    return false;
  }
  return (
    referenceImport(sf, moduleSourceName, importSpecifier) &&
    importSpecifier.name.getText(sf) === 'defineMessages'
  );
}

function isSingularMessageDecl(
  node: ts.CallExpression | ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  program: ts.Program,
  sf: ts.SourceFile,
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
    referenceImport(sf, moduleSourceName, importSpecifier) &&
    compNames.has(importSpecifier.name.getText(sf))
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
  let msg: MessageDescriptor = {};
  if (!properties) {
    return;
  }
  properties.forEach(prop => {
    const {name} = prop;
    let initializer =
      ts.isPropertyAssignment(prop) || ts.isJsxAttribute(prop)
        ? prop.initializer
        : undefined;
    if (!initializer || !ts.isStringLiteral(initializer) || !name) {
      return;
    }
    switch (name.getText(sf)) {
      case 'id':
        msg.id = trimSingleQuote(initializer.getText(sf));
        break;
      case 'defaultMessage':
        msg.defaultMessage = trimSingleQuote(initializer.getText(sf));
        break;
      case 'description':
        msg.description = trimSingleQuote(initializer.getText(sf));
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
  const expr = node.expression;
  return (
    ts.isPropertyAccessExpression(expr) &&
    expr.expression.getText(sf) === 'intl' &&
    expr.name.getText(sf) === 'formatMessage'
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
      sf,
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
    defaultMessage: opts.removeDefaultMessage !== true,
    id: msg ? msg.id : undefined,
  }) as ts.JsxAttributes;
  return clonedEl;
}

function setAttributesInObject(
  node: ts.ObjectLiteralExpression | ts.JsxAttributes,
  attrs: Record<string, boolean | string | undefined>
) {
  const newNode = ts.getMutableClone(node);
  newNode.properties = ts.createNodeArray(
    (node.properties as ts.NodeArray<ts.ObjectLiteralElement>)
      .filter(
        prop =>
          prop.name && attrs[trimSingleQuote(prop.name.getText())] !== false
      )
      .map(prop => {
        if (!prop.name) {
          return prop;
        }
        const name = trimSingleQuote(prop.name.getText());
        const value = attrs[name];
        if (typeof value === 'string') {
          const clonedProp = ts.getMutableClone(prop) as ts.PropertyAssignment;
          clonedProp.initializer = ts.createStringLiteral(value);
          return clonedProp;
        }
        return prop;
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
  if (isMultipleMessageDecl(node, program, sf, moduleSourceName)) {
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
            defaultMessage: opts.removeDefaultMessage !== true,
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
      sf,
      moduleSourceName,
      opts.additionalComponentNames || []
    ) ||
    (opts.extractFromFormatMessageCall && isIntlFormatMessageCall(node, sf))
  ) {
    const [descriptorsObj, ...restArgs] = node.arguments;
    if (ts.isObjectLiteralExpression(descriptorsObj)) {
      let msg = extractMessageDescriptor(descriptorsObj, sf, opts);
      if (!msg) {
        return;
      }
      if (typeof onMsgExtracted === 'function') {
        onMsgExtracted(sf.fileName, [msg]);
      }

      const newNode = ts.getMutableClone(node);
      newNode.arguments = ts.createNodeArray([
        setAttributesInObject(descriptorsObj, {
          defaultMessage: opts.removeDefaultMessage !== true,
          id: msg ? msg.id : undefined,
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
