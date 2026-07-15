import {
  type MessageFormatElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import {hoistSelectors} from '@formatjs/icu-messageformat-parser/manipulator.js'
import {printAST} from '@formatjs/icu-messageformat-parser/printer.js'
import * as stringifyNs from 'json-stable-stringify'
import * as typescript from 'typescript'
import {debug} from '#packages/ts-transformer/console_utils.js'
import {interpolateName} from '#packages/ts-transformer/interpolate-name.js'
import {normalizeMessageWhitespace} from '#packages/ts-transformer/normalize-whitespace.js'
import {
  type MessageDescriptor,
  type MessageDescriptorOccurrence,
  type MessageDescriptorValueLocation,
} from '#packages/ts-transformer/types.js'

const stringify = (stringifyNs as any).default || stringifyNs
export type Extractor = (filePath: string, msgs: MessageDescriptor[]) => void
export type DescriptorExtractor = (
  filePath: string,
  occurrence: MessageDescriptorOccurrence
) => void
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

type TypeScript = Omit<typeof typescript, 'default'>

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
  } catch {
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
   * Callback for each successfully extracted descriptor occurrence, including
   * duplicate IDs. Writable value locations use inclusive `start` and
   * exclusive `end` source offsets.
   */
  onMsgDescriptorExtracted?: DescriptorExtractor
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
  /**
   * Whether to hoist selectors & flatten sentences
   */
  flatten?: boolean
  /**
   * Whether to throw on errors extracting messages.
   * When false, invalid messages are skipped with a warning.
   * Defaults to true.
   */
  throws?: boolean
  /**
   * Callback for reporting errors when throws is false.
   */
  onMsgError?: (filePath: string, error: Error) => void
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
  const right = unwrapTransparentTypeScriptExpression(ts, node.right)
  const left = unwrapTransparentTypeScriptExpression(ts, node.left)
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

function unwrapTransparentTypeScriptExpression(
  ts: TypeScript,
  node: typescript.Expression
): typescript.Expression {
  let current = node
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression
  }
  return current
}

function unwrapObjectLiteralExpression(
  ts: TypeScript,
  node: typescript.Expression
): typescript.ObjectLiteralExpression | undefined {
  const expression = unwrapTransparentTypeScriptExpression(ts, node)
  return ts.isObjectLiteralExpression(expression) ? expression : undefined
}

function getStaticPropertyName(
  ts: TypeScript,
  name: typescript.PropertyName | typescript.JsxAttributeName
): string | undefined {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text
  }
  if (ts.isComputedPropertyName(name)) {
    const expression = unwrapTransparentTypeScriptExpression(
      ts,
      name.expression
    )
    if (
      ts.isStringLiteral(expression) ||
      ts.isNoSubstitutionTemplateLiteral(expression) ||
      ts.isNumericLiteral(expression)
    ) {
      return expression.text
    }
  }
}

function hasUnsafeDescriptorProperty(
  ts: TypeScript,
  properties:
    | typescript.NodeArray<typescript.ObjectLiteralElement>
    | typescript.NodeArray<typescript.JsxAttributeLike>
): boolean {
  return properties.some(prop => {
    if (ts.isSpreadAssignment(prop) || ts.isJsxSpreadAttribute(prop)) {
      return true
    }
    if (ts.isJsxAttribute(prop)) {
      return false
    }
    const name = prop.name
    if (!name) {
      return true
    }
    const propertyName = getStaticPropertyName(ts, name)
    if (propertyName == null) {
      return ts.isComputedPropertyName(name)
    }
    return (
      (propertyName === 'id' || propertyName === 'defaultMessage') &&
      !ts.isPropertyAssignment(prop)
    )
  })
}

function getWritableMessageValueLocation(
  ts: TypeScript,
  prop: typescript.ObjectLiteralElement | typescript.JsxAttributeLike,
  sf: typescript.SourceFile
): MessageDescriptorValueLocation | undefined {
  let value: typescript.Expression | undefined
  let kind: MessageDescriptorValueLocation['kind'] = 'string'

  if (ts.isPropertyAssignment(prop)) {
    value = unwrapTransparentTypeScriptExpression(ts, prop.initializer)
  } else if (ts.isJsxAttribute(prop) && prop.initializer) {
    if (ts.isStringLiteral(prop.initializer)) {
      value = prop.initializer
      kind = 'jsxAttribute'
    } else if (
      ts.isJsxExpression(prop.initializer) &&
      prop.initializer.expression
    ) {
      value = unwrapTransparentTypeScriptExpression(
        ts,
        prop.initializer.expression
      )
    }
  }

  if (
    !value ||
    (!ts.isStringLiteral(value) && !ts.isNoSubstitutionTemplateLiteral(value))
  ) {
    return
  }
  if (ts.isNoSubstitutionTemplateLiteral(value)) {
    kind = 'template'
  }
  return {
    start: value.getStart(sf),
    end: value.end,
    kind,
    value: value.text,
  }
}

function extractMessageDescriptor(
  ts: TypeScript,
  node:
    | typescript.ObjectLiteralExpression
    | typescript.JsxOpeningElement
    | typescript.JsxSelfClosingElement,
  {
    overrideIdFn,
    extractSourceLocation,
    preserveWhitespace,
    flatten,
    throws = true,
    onMsgError,
    onMsgDescriptorExtracted,
  }: Opts,
  sf: typescript.SourceFile
): MessageDescriptor | undefined {
  let extractionError: Error | null = null

  // Helper to handle errors based on throws option
  function handleError(errorMsg: string, errorNode?: typescript.Node): void {
    let locationMsg = errorMsg
    if (errorNode) {
      const {line, character} = ts.getLineAndCharacterOfPosition(
        sf,
        errorNode.getStart(sf)
      )
      locationMsg = `${sf.fileName}:${line + 1}:${character + 1} ${errorMsg}`
    }
    const error = new Error(locationMsg)
    if (throws) {
      throw error
    }
    extractionError = error
    if (onMsgError) {
      onMsgError(sf.fileName, error)
    }
  }
  let properties:
    | typescript.NodeArray<typescript.ObjectLiteralElement>
    | typescript.NodeArray<typescript.JsxAttributeLike>
    | undefined = undefined
  if (ts.isObjectLiteralExpression(node)) {
    properties = node.properties
  } else if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    properties = node.attributes.properties
  }
  const msg: MessageDescriptor = {id: ''}
  const locations: MessageDescriptorOccurrence['locations'] = {}
  if (!properties) {
    return
  }
  const hasUnsafeProperty = hasUnsafeDescriptorProperty(ts, properties)

  properties.forEach(prop => {
    const {name} = prop
    const propertyName = name && getStaticPropertyName(ts, name)
    const initializer:
      | typescript.Expression
      | typescript.JsxExpression
      | undefined =
      ts.isPropertyAssignment(prop) || ts.isJsxAttribute(prop)
        ? prop.initializer
        : undefined

    if (propertyName && initializer) {
      const value = ts.isPropertyAssignment(prop)
        ? unwrapTransparentTypeScriptExpression(ts, prop.initializer)
        : initializer
      // {id: 'id'}
      if (ts.isStringLiteral(value)) {
        switch (propertyName) {
          case 'id':
            msg.id = value.text
            break
          case 'defaultMessage':
            msg.defaultMessage = value.text
            break
          case 'description':
            msg.description = value.text
            break
        }
      }
      // {id: `id`}
      else if (ts.isNoSubstitutionTemplateLiteral(value)) {
        switch (propertyName) {
          case 'id':
            msg.id = value.text
            break
          case 'defaultMessage':
            msg.defaultMessage = value.text
            break
          case 'description':
            msg.description = value.text
            break
        }
      }
      // {id: dedent`id`}
      // GH #5069: Only check for substitutions on message-related props
      else if (ts.isTaggedTemplateExpression(value)) {
        const isMessageProp =
          propertyName === 'id' ||
          propertyName === 'defaultMessage' ||
          propertyName === 'description'
        if (!isMessageProp) {
          // Skip non-message props (like tagName, values, etc.)
          return
        }

        const {template} = value
        if (!ts.isNoSubstitutionTemplateLiteral(template)) {
          handleError(
            '[FormatJS] Tagged template expression must be no substitution',
            prop
          )
          return
        }

        switch (propertyName) {
          case 'id':
            msg.id = template.text
            break
          case 'defaultMessage':
            msg.defaultMessage = template.text
            break
          case 'description':
            msg.description = template.text
            break
        }
      } else if (ts.isJsxExpression(value) && value.expression) {
        const expression = unwrapTransparentTypeScriptExpression(
          ts,
          value.expression
        )
        // <FormattedMessage foo={'barbaz'} />
        if (ts.isStringLiteral(expression)) {
          switch (propertyName) {
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
        // description={{custom: 1}}
        else if (
          ts.isObjectLiteralExpression(expression) &&
          propertyName === 'description'
        ) {
          msg.description = objectLiteralExpressionToObj(ts, expression)
        }
        // <FormattedMessage foo={`bar`} />
        else if (ts.isNoSubstitutionTemplateLiteral(expression)) {
          switch (propertyName) {
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
        // <FormattedMessage foo={dedent`dedent Hello World!`} />
        // GH #5069: Only check for substitutions on message-related props
        else if (ts.isTaggedTemplateExpression(expression)) {
          const isMessageProp =
            propertyName === 'id' ||
            propertyName === 'defaultMessage' ||
            propertyName === 'description'
          if (!isMessageProp) {
            // Skip non-message props (like tagName, values, etc.)
            return
          }

          const {template} = expression
          if (!ts.isNoSubstitutionTemplateLiteral(template)) {
            handleError(
              '[FormatJS] Tagged template expression must be no substitution',
              prop
            )
            return
          }
          switch (propertyName) {
            case 'id':
              msg.id = template.text
              break
            case 'defaultMessage':
              msg.defaultMessage = template.text
              break
            case 'description':
              msg.description = template.text
              break
          }
        }
        // <FormattedMessage foo={'bar' + 'baz'} />
        else if (ts.isBinaryExpression(expression)) {
          const [result, isStatic] = evaluateStringConcat(ts, expression)
          if (isStatic) {
            switch (propertyName) {
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
          } else if (
            MESSAGE_DESC_KEYS.includes(
              propertyName as keyof MessageDescriptor
            ) &&
            propertyName !== 'description'
          ) {
            // Non-static expression for defaultMessage or id
            handleError(
              `[FormatJS] \`${propertyName}\` must be a string literal or statically evaluable expression to be extracted.`,
              prop
            )
            return
          }
        }
        // Non-static JSX expression for defaultMessage or id
        else if (
          MESSAGE_DESC_KEYS.includes(propertyName as keyof MessageDescriptor) &&
          propertyName !== 'description'
        ) {
          handleError(
            `[FormatJS] \`${propertyName}\` must be a string literal to be extracted.`,
            prop
          )
          return
        }
      }
      // {defaultMessage: 'asd' + bar'}
      else if (ts.isBinaryExpression(value)) {
        const [result, isStatic] = evaluateStringConcat(ts, value)
        if (isStatic) {
          switch (propertyName) {
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
        } else if (
          MESSAGE_DESC_KEYS.includes(propertyName as keyof MessageDescriptor) &&
          propertyName !== 'description'
        ) {
          // Non-static expression for defaultMessage or id
          handleError(
            `[FormatJS] \`${propertyName}\` must be a string literal or statically evaluable expression to be extracted.`,
            prop
          )
          return
        }
      }
      // description: {custom: 1}
      else if (
        ts.isObjectLiteralExpression(value) &&
        propertyName === 'description'
      ) {
        msg.description = objectLiteralExpressionToObj(ts, value)
      }
      // Non-static value for defaultMessage or id
      else if (
        MESSAGE_DESC_KEYS.includes(propertyName as keyof MessageDescriptor) &&
        propertyName !== 'description'
      ) {
        handleError(
          `[FormatJS] \`${propertyName}\` must be a string literal to be extracted.`,
          prop
        )
        return
      }

      if (propertyName === 'id' || propertyName === 'defaultMessage') {
        const location = getWritableMessageValueLocation(ts, prop, sf)
        if (location) {
          locations[propertyName] = location
        } else {
          delete locations[propertyName]
        }
      }
    }
  })
  if (hasUnsafeProperty) {
    delete locations.id
    delete locations.defaultMessage
  }
  // If we had an extraction error (and throws is false), skip this message
  if (extractionError) {
    return
  }
  // We extracted nothing
  if (!msg.defaultMessage && !msg.id) {
    return
  }

  if (msg.defaultMessage && !preserveWhitespace) {
    msg.defaultMessage = normalizeMessageWhitespace(msg.defaultMessage)
  }
  // GH #3537: Apply flatten transformation before calling overrideIdFn
  // so that the ID generation sees the same message format as the final output
  if (flatten && msg.defaultMessage) {
    try {
      msg.defaultMessage = printAST(hoistSelectors(parse(msg.defaultMessage)))
    } catch (e: any) {
      const {line, character} = sf.getLineAndCharacterOfPosition(node.pos)
      throw new Error(
        `[formatjs] Cannot flatten message in file "${sf.fileName}" at line ${line + 1}, column ${character + 1}${msg.id ? ` with id "${msg.id}"` : ''}: ${e.message}\nMessage: ${msg.defaultMessage}`
      )
    }
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
  const descriptor = extractSourceLocation
    ? {
        ...msg,
        file: sf.fileName,
        start: node.pos,
        end: node.end,
      }
    : msg
  if (typeof onMsgDescriptorExtracted === 'function') {
    onMsgDescriptorExtracted(sf.fileName, {descriptor, locations})
  }
  return descriptor
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

  // GH #4471: Handle foo.formatMessage<T>?.() - when both generics and optional chaining are used
  // TypeScript represents this as ExpressionWithTypeArguments containing a PropertyAccessExpression
  if (
    ts.isExpressionWithTypeArguments &&
    ts.isExpressionWithTypeArguments(method)
  ) {
    const expr = method.expression
    if (ts.isPropertyAccessExpression(expr)) {
      return fnNames.has(expr.name.text)
    }
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
    const propertyName =
      ts.isPropertyAssignment(prop) && getStaticPropertyName(ts, prop.name)
    if (
      propertyName &&
      MESSAGE_DESC_KEYS.includes(propertyName as keyof MessageDescriptor)
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
    const descriptorsObj = unwrapObjectLiteralExpression(ts, arg)
    if (descriptorsObj) {
      const properties = descriptorsObj.properties
      const messagesByProperty = properties.map(prop => {
        if (!ts.isPropertyAssignment(prop)) {
          return
        }
        const descriptor = unwrapObjectLiteralExpression(ts, prop.initializer)
        return descriptor && extractMessageDescriptor(ts, descriptor, opts, sf)
      })
      const msgs = messagesByProperty.filter(
        (msg): msg is MessageDescriptor => !!msg
      )
      if (!msgs.length) {
        return node
      }
      debug('Multiple messages extracted from "%s": %s', sf.fileName, msgs)
      if (typeof onMsgExtracted === 'function') {
        onMsgExtracted(sf.fileName, msgs)
      }

      const clonedProperties = factory.createNodeArray(
        properties.map((prop, i) => {
          const msg = messagesByProperty[i]
          if (
            !ts.isPropertyAssignment(prop) ||
            !ts.isObjectLiteralExpression(prop.initializer) ||
            !msg
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
                  : msg.defaultMessage,
                id: msg.id,
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
    const descriptor = unwrapObjectLiteralExpression(ts, descriptorsObj)
    if (descriptor) {
      const msg = extractMessageDescriptor(ts, descriptor, opts, sf)
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
            descriptor,
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

export function transformWithTs(
  ts: TypeScript,
  opts: Opts
): typescript.TransformerFactory<typescript.SourceFile> {
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

export function transform(
  opts: Opts
): typescript.TransformerFactory<typescript.SourceFile> {
  return transformWithTs(typescript, opts)
}
