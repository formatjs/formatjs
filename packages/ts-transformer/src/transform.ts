import * as typescript from 'typescript'
import {MessageDescriptor} from './types'
import {interpolateName} from './interpolate-name'
import {parse, MessageFormatElement} from '@formatjs/icu-messageformat-parser'
import {debug} from './console_utils'
import stringify from 'json-stable-stringify'
export type Extractor = (filePath: string, msgs: MessageDescriptor[]) => void
export type MetaExtractor = (
  filePath: string,
  meta: Record<string, string>
) => void

export type InterpolateNameFn = (
  id?: MessageDescriptor['id'],
  defaultMessage?: MessageDescriptor['defaultMessage'],
  description?: MessageDescriptor['description'],
  filePath?: string
) => string

const MESSAGE_DESC_KEYS: Array<keyof MessageDescriptor> = [
  'id',
  'defaultMessage',
  'description',
]

type TypeScript = typeof typescript

function primitiveToTSNode(
  factory: typescript.NodeFactory,
  v: string | number | boolean
) {
  return typeof v === 'string'
    ? factory.createStringLiteral(v)
    : typeof v === 'number'
    ? factory.createNumericLiteral(v + '')
    : typeof v === 'boolean'
    ? v
      ? factory.createTrue()
      : factory.createFalse()
    : undefined
}

function isValidIdentifier(k: string): boolean {
  try {
    new Function(`return {${k}:1}`)
    return true
  } catch (e) {
    return false
  }
}

function objToTSNode(factory: typescript.NodeFactory, obj: object) {
  if (typeof obj === 'object' && !obj) {
    return factory.createNull()
  }
  const props: typescript.PropertyAssignment[] = Object.entries(obj)
    .filter(([_, v]) => typeof v !== 'undefined')
    .map(([k, v]) =>
      factory.createPropertyAssignment(
        isValidIdentifier(k) ? k : factory.createStringLiteral(k),
        primitiveToTSNode(factory, v) ||
          (Array.isArray(v)
            ? factory.createArrayLiteralExpression(
                v
                  .filter(n => typeof n !== 'undefined')
                  .map(n => objToTSNode(factory, n))
              )
            : objToTSNode(factory, v))
      )
    )
  return factory.createObjectLiteralExpression(props)
}

function messageASTToTSNode(
  factory: typescript.NodeFactory,
  ast: MessageFormatElement[]
) {
  return factory.createArrayLiteralExpression(
    ast.map(el => objToTSNode(factory, el))
  )
}

function literalToObj(ts: TypeScript, n: typescript.Node) {
  if (ts.isNumericLiteral(n)) {
    return +n.text
  }
  if (ts.isStringLiteral(n)) {
    return n.text
  }
  if (n.kind === ts.SyntaxKind.TrueKeyword) {
    return true
  }
  if (n.kind === ts.SyntaxKind.FalseKeyword) {
    return false
  }
}

function objectLiteralExpressionToObj(
  ts: TypeScript,
  obj: typescript.ObjectLiteralExpression
): object {
  return obj.properties.reduce((all: Record<string, any>, prop) => {
    if (ts.isPropertyAssignment(prop) && prop.name) {
      if (ts.isIdentifier(prop.name)) {
        all[prop.name.escapedText.toString()] = literalToObj(
          ts,
          prop.initializer
        )
      } else if (ts.isStringLiteral(prop.name)) {
        all[prop.name.text] = literalToObj(ts, prop.initializer)
      }
    }
    return all
  }, {})
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
  pragma?: string
  /**
   * Whether the metadata about the location of the message in the source file
   * should be extracted. If `true`, then `file`, `start`, and `end`
   * fields will exist for each extracted message descriptors.
   * Defaults to `false`.
   */
  extractSourceLocation?: boolean
  /**
   * Remove `defaultMessage` field in generated js after extraction.
   */
  removeDefaultMessage?: boolean
  /**
   * Additional component names to extract messages from,
   * e.g: `['FormattedFooBarMessage']`.
   */
  additionalComponentNames?: string[]
  /**
   * Additional function names to extract messages from,
   * e.g: `['formatMessage', '$t']`
   * Default to `['formatMessage']`
   */
  additionalFunctionNames?: string[]
  /**
   * Callback function that gets called everytime we encountered something
   * that looks like a MessageDescriptor
   *
   * @type {Extractor}
   * @memberof Opts
   */
  onMsgExtracted?: Extractor
  /**
   * Callback function that gets called when we successfully parsed meta
   * declared in pragma
   */
  onMetaExtracted?: MetaExtractor
  /**
   * webpack-style name interpolation.
   * Can also be a string like '[sha512:contenthash:hex:6]'
   *
   * @type {(InterpolateNameFn | string)}
   * @memberof Opts
   */
  overrideIdFn?: InterpolateNameFn | string
  /**
   * Whether to compile `defaultMessage` to AST.
   * This is no-op if `removeDefaultMessage` is `true`
   */
  ast?: boolean
  /**
   * Whether to preserve whitespace and newlines.
   */
  preserveWhitespace?: boolean
}

const DEFAULT_OPTS: Omit<Opts, 'program'> = {
  onMsgExtracted: () => undefined,
  onMetaExtracted: () => undefined,
}

function isMultipleMessageDecl(
  ts: TypeScript,
  node: typescript.CallExpression
) {
  return (
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'defineMessages'
  )
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
    'formatMessage',
    '$formatMessage',
    '$t',
    ...additionalComponentNames,
  ])
  let fnName = ''
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    fnName = node.expression.text
  } else if (ts.isJsxOpeningElement(node) && ts.isIdentifier(node.tagName)) {
    fnName = node.tagName.text
  } else if (
    ts.isJsxSelfClosingElement(node) &&
    ts.isIdentifier(node.tagName)
  ) {
    fnName = node.tagName.text
  }
  return compNames.has(fnName)
}

function evaluateStringConcat(
  ts: TypeScript,
  node: typescript.BinaryExpression
): [result: string, isStaticallyEvaluatable: boolean] {
  const {right, left} = node
  if (!ts.isStringLiteral(right)) {
    return ['', false]
  }
  if (ts.isStringLiteral(left)) {
    return [left.text + right.text, true]
  }
  if (ts.isBinaryExpression(left)) {
    const [result, isStatic] = evaluateStringConcat(ts, left)
    return [result + right.text, isStatic]
  }
  return ['', false]
}

function extractMessageDescriptor(
  ts: TypeScript,
  node:
    | typescript.ObjectLiteralExpression
    | typescript.JsxOpeningElement
    | typescript.JsxSelfClosingElement,
  {overrideIdFn, extractSourceLocation, preserveWhitespace}: Opts,
  sf: typescript.SourceFile
): MessageDescriptor | undefined {
  let properties:
    | typescript.NodeArray<typescript.ObjectLiteralElement>
    | undefined = undefined
  if (ts.isObjectLiteralExpression(node)) {
    properties = node.properties
  } else if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    properties = node.attributes.properties
  }
  const msg: MessageDescriptor = {id: ''}
  if (!properties) {
    return
  }

  properties.forEach(prop => {
    const {name} = prop
    const initializer:
      | typescript.Expression
      | typescript.JsxExpression
      | undefined =
      ts.isPropertyAssignment(prop) || ts.isJsxAttribute(prop)
        ? prop.initializer
        : undefined

    if (name && ts.isIdentifier(name) && initializer) {
      // {id: 'id'}
      if (ts.isStringLiteral(initializer)) {
        switch (name.text) {
          case 'id':
            msg.id = initializer.text
            break
          case 'defaultMessage':
            msg.defaultMessage = initializer.text
            break
          case 'description':
            msg.description = initializer.text
            break
        }
      }
      // {id: `id`}
      else if (ts.isNoSubstitutionTemplateLiteral(initializer)) {
        switch (name.text) {
          case 'id':
            msg.id = initializer.text
            break
          case 'defaultMessage':
            msg.defaultMessage = initializer.text
            break
          case 'description':
            msg.description = initializer.text
            break
        }
      } else if (ts.isJsxExpression(initializer) && initializer.expression) {
        // <FormattedMessage foo={'barbaz'} />
        if (ts.isStringLiteral(initializer.expression)) {
          switch (name.text) {
            case 'id':
              msg.id = initializer.expression.text
              break
            case 'defaultMessage':
              msg.defaultMessage = initializer.expression.text
              break
            case 'description':
              msg.description = initializer.expression.text
              break
          }
        }
        // description={{custom: 1}}
        else if (
          ts.isObjectLiteralExpression(initializer.expression) &&
          name.text === 'description'
        ) {
          msg.description = objectLiteralExpressionToObj(
            ts,
            initializer.expression
          )
        }
        // <FormattedMessage foo={`bar`} />
        else if (ts.isNoSubstitutionTemplateLiteral(initializer.expression)) {
          const {expression} = initializer
          switch (name.text) {
            case 'id':
              msg.id = expression.text
              break
            case 'defaultMessage':
              msg.defaultMessage = expression.text
              break
            case 'description':
              msg.description = expression.text
              break
          }
        }
        // <FormattedMessage foo={'bar' + 'baz'} />
        else if (ts.isBinaryExpression(initializer.expression)) {
          const {expression} = initializer
          const [result, isStatic] = evaluateStringConcat(ts, expression)
          if (isStatic) {
            switch (name.text) {
              case 'id':
                msg.id = result
                break
              case 'defaultMessage':
                msg.defaultMessage = result
                break
              case 'description':
                msg.description = result
                break
            }
          }
        }
      }
      // {defaultMessage: 'asd' + bar'}
      else if (ts.isBinaryExpression(initializer)) {
        const [result, isStatic] = evaluateStringConcat(ts, initializer)
        if (isStatic) {
          switch (name.text) {
            case 'id':
              msg.id = result
              break
            case 'defaultMessage':
              msg.defaultMessage = result
              break
            case 'description':
              msg.description = result
              break
          }
        }
      }
      // description: {custom: 1}
      else if (
        ts.isObjectLiteralExpression(initializer) &&
        name.text === 'description'
      ) {
        msg.description = objectLiteralExpressionToObj(ts, initializer)
      }
    }
  })
  // We extracted nothing
  if (!msg.defaultMessage && !msg.id) {
    return
  }

  if (msg.defaultMessage && !preserveWhitespace) {
    msg.defaultMessage = msg.defaultMessage.trim().replace(/\s+/gm, ' ')
  }
  if (msg.defaultMessage && overrideIdFn) {
    switch (typeof overrideIdFn) {
      case 'string':
        if (!msg.id) {
          msg.id = interpolateName(
            {resourcePath: sf.fileName} as any,
            overrideIdFn,
            {
              content: msg.description
                ? `${msg.defaultMessage}#${
                    typeof msg.description === 'string'
                      ? msg.description
                      : stringify(msg.description)
                  }`
                : msg.defaultMessage,
            }
          )
        }
        break
      case 'function':
        msg.id = overrideIdFn(
          msg.id,
          msg.defaultMessage,
          msg.description,
          sf.fileName
        )
        break
    }
  }
  if (extractSourceLocation) {
    return {
      ...msg,
      file: sf.fileName,
      start: node.pos,
      end: node.end,
    }
  }
  return msg
}

/**
 * Check if node is `foo.bar.formatMessage` node
 * @param node
 * @param sf
 */
function isMemberMethodFormatMessageCall(
  ts: TypeScript,
  node: typescript.CallExpression,
  additionalFunctionNames: string[]
) {
  const fnNames = new Set([
    'formatMessage',
    '$formatMessage',
    ...additionalFunctionNames,
  ])
  const method = node.expression

  // Handle foo.formatMessage()
  if (ts.isPropertyAccessExpression(method)) {
    return fnNames.has(method.name.text)
  }

  // Handle formatMessage()
  return ts.isIdentifier(method) && fnNames.has(method.text)
}

function extractMessageFromJsxComponent(
  ts: TypeScript,
  factory: typescript.NodeFactory,
  node: typescript.JsxSelfClosingElement,
  opts: Opts,
  sf: typescript.SourceFile
): typescript.VisitResult<typescript.JsxSelfClosingElement>
function extractMessageFromJsxComponent(
  ts: TypeScript,
  factory: typescript.NodeFactory,
  node: typescript.JsxOpeningElement,
  opts: Opts,
  sf: typescript.SourceFile
): typescript.VisitResult<typescript.JsxOpeningElement>
function extractMessageFromJsxComponent(
  ts: TypeScript,
  factory: typescript.NodeFactory,
  node: typescript.JsxOpeningElement | typescript.JsxSelfClosingElement,
  opts: Opts,
  sf: typescript.SourceFile
): typescript.VisitResult<typeof node> {
  const {onMsgExtracted} = opts
  if (!isSingularMessageDecl(ts, node, opts.additionalComponentNames || [])) {
    return node
  }
  const msg = extractMessageDescriptor(ts, node, opts, sf)
  if (!msg) {
    return node
  }
  if (typeof onMsgExtracted === 'function') {
    onMsgExtracted(sf.fileName, [msg])
  }

  const newProps = generateNewProperties(
    ts,
    factory,
    node.attributes,
    {
      defaultMessage: opts.removeDefaultMessage
        ? undefined
        : msg.defaultMessage,
      id: msg.id,
    },
    opts.ast
  )

  if (ts.isJsxOpeningElement(node)) {
    return factory.updateJsxOpeningElement(
      node,
      node.tagName,
      node.typeArguments,
      factory.createJsxAttributes(newProps)
    )
  }

  return factory.updateJsxSelfClosingElement(
    node,
    node.tagName,
    node.typeArguments,
    factory.createJsxAttributes(newProps)
  )
}

function setAttributesInObject(
  ts: TypeScript,
  factory: typescript.NodeFactory,
  node: typescript.ObjectLiteralExpression,
  msg: MessageDescriptor,
  ast?: boolean
) {
  const newProps = [
    factory.createPropertyAssignment('id', factory.createStringLiteral(msg.id)),
    ...(msg.defaultMessage
      ? [
          factory.createPropertyAssignment(
            'defaultMessage',
            ast
              ? messageASTToTSNode(factory, parse(msg.defaultMessage))
              : factory.createStringLiteral(msg.defaultMessage)
          ),
        ]
      : []),
  ]

  for (const prop of node.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      MESSAGE_DESC_KEYS.includes(prop.name.text as keyof MessageDescriptor)
    ) {
      continue
    }
    if (ts.isPropertyAssignment(prop)) {
      newProps.push(prop)
    }
  }
  return factory.createObjectLiteralExpression(
    factory.createNodeArray(newProps)
  )
}

function generateNewProperties(
  ts: TypeScript,
  factory: typescript.NodeFactory,
  node: typescript.JsxAttributes,
  msg: MessageDescriptor,
  ast?: boolean
) {
  const newProps = [
    factory.createJsxAttribute(
      factory.createIdentifier('id'),
      factory.createStringLiteral(msg.id)
    ),
    ...(msg.defaultMessage
      ? [
          factory.createJsxAttribute(
            factory.createIdentifier('defaultMessage'),
            ast
              ? factory.createJsxExpression(
                  undefined,
                  messageASTToTSNode(factory, parse(msg.defaultMessage))
                )
              : factory.createStringLiteral(msg.defaultMessage)
          ),
        ]
      : []),
  ]
  for (const prop of node.properties) {
    if (
      ts.isJsxAttribute(prop) &&
      ts.isIdentifier(prop.name) &&
      MESSAGE_DESC_KEYS.includes(prop.name.text as keyof MessageDescriptor)
    ) {
      continue
    }
    if (ts.isJsxAttribute(prop)) {
      newProps.push(prop)
    }
  }
  return newProps
}

function extractMessagesFromCallExpression(
  ts: TypeScript,
  factory: typescript.NodeFactory,
  node: typescript.CallExpression,
  opts: Opts,
  sf: typescript.SourceFile
): typescript.VisitResult<typescript.CallExpression> {
  const {onMsgExtracted, additionalFunctionNames} = opts
  if (isMultipleMessageDecl(ts, node)) {
    const [arg, ...restArgs] = node.arguments
    let descriptorsObj: typescript.ObjectLiteralExpression | undefined
    if (ts.isObjectLiteralExpression(arg)) {
      descriptorsObj = arg
    } else if (
      ts.isAsExpression(arg) &&
      ts.isObjectLiteralExpression(arg.expression)
    ) {
      descriptorsObj = arg.expression
    }
    if (descriptorsObj) {
      const properties = descriptorsObj.properties
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
        .filter((msg): msg is MessageDescriptor => !!msg)
      if (!msgs.length) {
        return node
      }
      debug('Multiple messages extracted from "%s": %s', sf.fileName, msgs)
      if (typeof onMsgExtracted === 'function') {
        onMsgExtracted(sf.fileName, msgs)
      }

      const clonedProperties = factory.createNodeArray(
        properties.map((prop, i) => {
          if (
            !ts.isPropertyAssignment(prop) ||
            !ts.isObjectLiteralExpression(prop.initializer)
          ) {
            return prop
          }

          return factory.createPropertyAssignment(
            prop.name,
            setAttributesInObject(
              ts,
              factory,
              prop.initializer,
              {
                defaultMessage: opts.removeDefaultMessage
                  ? undefined
                  : msgs[i].defaultMessage,
                id: msgs[i] ? msgs[i].id : '',
              },
              opts.ast
            )
          )
        })
      )
      const clonedDescriptorsObj =
        factory.createObjectLiteralExpression(clonedProperties)
      return factory.updateCallExpression(
        node,
        node.expression,
        node.typeArguments,
        [clonedDescriptorsObj, ...restArgs]
      )
    }
  } else if (
    isSingularMessageDecl(ts, node, opts.additionalComponentNames || []) ||
    isMemberMethodFormatMessageCall(ts, node, additionalFunctionNames || [])
  ) {
    const [descriptorsObj, ...restArgs] = node.arguments
    if (ts.isObjectLiteralExpression(descriptorsObj)) {
      const msg = extractMessageDescriptor(ts, descriptorsObj, opts, sf)
      if (!msg) {
        return node
      }
      debug('Message extracted from "%s": %s', sf.fileName, msg)
      if (typeof onMsgExtracted === 'function') {
        onMsgExtracted(sf.fileName, [msg])
      }

      return factory.updateCallExpression(
        node,
        node.expression,
        node.typeArguments,
        [
          setAttributesInObject(
            ts,
            factory,
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
        ]
      )
    }
  }
  return node
}

const PRAGMA_REGEX = /^\/\/ @([^\s]*) (.*)$/m

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
      ? extractMessagesFromCallExpression(ts, ctx.factory, node, opts, sf)
      : ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)
      ? extractMessageFromJsxComponent(
          ts,
          ctx.factory,
          node as typescript.JsxOpeningElement,
          opts,
          sf
        )
      : node
    return ts.visitEachChild(newNode as typescript.Node, visitor, ctx)
  }
  return visitor
}

export function transformWithTs(ts: TypeScript, opts: Opts) {
  opts = {...DEFAULT_OPTS, ...opts}
  debug('Transforming options', opts)
  const transformFn: typescript.TransformerFactory<
    typescript.SourceFile
  > = ctx => {
    return sf => {
      const pragmaResult = PRAGMA_REGEX.exec(sf.text)
      if (pragmaResult) {
        debug('Pragma found', pragmaResult)
        const [, pragma, kvString] = pragmaResult
        if (pragma === opts.pragma) {
          const kvs = kvString.split(' ')
          const result: Record<string, string> = {}
          for (const kv of kvs) {
            const [k, v] = kv.split(':')
            result[k] = v
          }
          debug('Pragma extracted', result)
          if (typeof opts.onMetaExtracted === 'function') {
            opts.onMetaExtracted(sf.fileName, result)
          }
        }
      }
      return ts.visitEachChild(sf, getVisitor(ts, ctx, sf, opts), ctx)
    }
  }

  return transformFn
}

export function transform(opts: Opts) {
  return transformWithTs(typescript, opts)
}
