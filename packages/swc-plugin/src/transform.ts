import {MessageDescriptor} from './types'
import {interpolateName} from '@formatjs/ts-transformer'
import {parse, MessageFormatElement} from '@formatjs/icu-messageformat-parser'
import Visitor from '@swc/core/Visitor'
import {
  CallExpression,
  Expression,
  JSXOpeningElement,
  ObjectExpression,
  Property,
  JSXAttribute,
  JSXExpressionContainer,
  BinaryExpression,
  KeyValueProperty,
  Span,
  NullLiteral,
  ArrayExpression,
  BooleanLiteral,
  NumericLiteral,
  TemplateLiteral,
  Identifier,
  StringLiteral,
} from '@swc/core'
import {debug} from './console_utils'
import stringify from 'json-stable-stringify'

export type Extractor = (filePath: string, msgs: MessageDescriptor[]) => void
export type MetaExtractor = (
  filePath: string,
  meta: Record<string, string>
) => void

export type InterpolateNameFn = (
  id?: string,
  defaultMessage?: string,
  description?: string | object,
  filePath?: string
) => string

const MESSAGE_DESC_KEYS: Array<keyof MessageDescriptor> = [
  'id',
  'defaultMessage',
  'description',
]

function createStringLiteral(value: string, span: Span): StringLiteral {
  return {
    type: 'StringLiteral',
    value,
    hasEscape: false,
    span,
  }
}

function createIdentifier(value: string, span: Span): Identifier {
  return {
    type: 'Identifier',
    value,
    span,
    optional: false,
  }
}

function createNumericLiteral(value: number, span: Span): NumericLiteral {
  return {
    type: 'NumericLiteral',
    value,
    span,
  }
}

function createBooleanLiteral(value: boolean, span: Span): BooleanLiteral {
  return {
    type: 'BooleanLiteral',
    value,
    span,
  }
}

function createArrayExpression(
  elements: Expression[],
  span: Span
): ArrayExpression {
  return {
    type: 'ArrayExpression',
    elements: elements.map(expression => ({
      expression,
    })),
    span,
  }
}

function createObjectExpression(
  props: Property[],
  span: Span
): ObjectExpression {
  return {
    type: 'ObjectExpression',
    properties: props,
    span,
  }
}

function createKeyValueProperty(
  key: string,
  value: string | Expression,
  span: Span
): KeyValueProperty {
  return {
    type: 'KeyValueProperty',
    key: createIdentifier(key, span),
    value: typeof value === 'string' ? createStringLiteral(value, span) : value,
  }
}

function primitiveToTSNode(
  v: string | number | boolean,
  span: Span
): StringLiteral | NumericLiteral | BooleanLiteral | undefined {
  return typeof v === 'string'
    ? createStringLiteral(v, span)
    : typeof v === 'number'
    ? createNumericLiteral(v, span)
    : typeof v === 'boolean'
    ? createBooleanLiteral(v, span)
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

function objToTSNode(obj: object, span: Span): ObjectExpression | NullLiteral {
  if (typeof obj === 'object' && !obj) {
    return {
      type: 'NullLiteral',
      span,
    } as NullLiteral
  }
  const properties: Property[] = Object.entries(obj)
    .filter(([_, v]) => typeof v !== 'undefined')
    .map(([k, v]) => ({
      type: 'KeyValueProperty',
      span,
      key: isValidIdentifier(k)
        ? createIdentifier(k, span)
        : createStringLiteral(k, span),
      value:
        primitiveToTSNode(v, span) ||
        (Array.isArray(v)
          ? createArrayExpression(
              v.filter(Boolean).map(n => objToTSNode(n, span)),
              span
            )
          : objToTSNode(v, span)),
    }))
  return {
    type: 'ObjectExpression',
    properties,
    span,
  } as ObjectExpression
}

function messageASTToTSNode(
  ast: MessageFormatElement[],
  span: Span
): ArrayExpression {
  return createArrayExpression(
    ast.map(el => objToTSNode(el, span)),
    span
  )
}

export interface Opts {
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
   * Filename
   */
  filename?: string
}

const DEFAULT_OPTS: Omit<Opts, 'program'> = {
  onMsgExtracted: () => undefined,
  filename: '',
}

function isMultipleMessageDecl(node: CallExpression) {
  return (
    node.callee.type === 'Identifier' && node.callee.value === 'defineMessages'
  )
}

function literalToPrimitive(n: Expression) {
  if (n.type === 'StringLiteral') {
    return n.value
  }
  if (n.type === 'BooleanLiteral') {
    return n.value
  }
  if (n.type === 'NumericLiteral') {
    return n.value
  }
}

function expressionToObject(obj: ObjectExpression) {
  return obj.properties.reduce((all: Record<string, any>, prop) => {
    if (prop.type === 'KeyValueProperty') {
      if (prop.key.type === 'Identifier' || prop.key.type === 'StringLiteral') {
        all[prop.key.value] = literalToPrimitive(prop.value)
      }
    }
    return all
  }, {})
}

function isSingularMessageDecl(
  node: CallExpression | JSXOpeningElement,
  additionalComponentNames: string[]
) {
  const compNames = new Set([
    'FormattedMessage',
    'defineMessage',
    'formatMessage',
    '$formatMessage',
    ...additionalComponentNames,
  ])
  let fnName = ''
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
    fnName = node.callee.value
  } else if (
    node.type === 'JSXOpeningElement' &&
    node.name.type === 'Identifier'
  ) {
    fnName = node.name.value
  }
  return compNames.has(fnName)
}

function evaluateStringConcat(
  node: BinaryExpression,
  filename: string
): [result: string, isStaticallyEvaluatable: boolean] {
  const {right, left} = node
  if (right.type !== 'StringLiteral') {
    return ['', false]
  }
  if (left.type === 'StringLiteral') {
    return [left.value + right.value, true]
  }
  if (left.type === 'BinaryExpression') {
    const [result, isStatic] = evaluateStringConcat(left, filename)
    return [result + right.value, isStatic]
  }
  return ['', false]
}

function extractMessageDescriptor(
  node: ObjectExpression | JSXOpeningElement,
  {overrideIdFn, extractSourceLocation, preserveWhitespace, filename = ''}: Opts
): MessageDescriptor | undefined {
  let properties: Property[] | JSXAttribute[] | undefined = undefined
  if (node.type === 'ObjectExpression') {
    properties = node.properties.filter(
      (prop): prop is Property => prop.type !== 'SpreadElement'
    )
  } else if (node.type === 'JSXOpeningElement') {
    properties = node.attributes?.filter(
      (attr): attr is JSXAttribute => attr.type === 'JSXAttribute'
    )
  }
  const msg: MessageDescriptor = {id: ''}
  if (!properties) {
    return
  }

  properties.forEach(prop => {
    const name: Identifier | undefined =
      prop.type === 'KeyValueProperty'
        ? prop.key.type === 'Identifier'
          ? prop.key
          : undefined
        : prop.type === 'JSXAttribute' && prop.name.type === 'Identifier'
        ? prop.name
        : undefined
    if (!name) {
      return
    }
    const value:
      | TemplateLiteral
      | StringLiteral
      | JSXExpressionContainer
      | BinaryExpression
      | ObjectExpression
      | undefined =
      prop.type === 'KeyValueProperty' &&
      (prop.value.type === 'StringLiteral' ||
        prop.value.type === 'TemplateLiteral' ||
        prop.value.type === 'ObjectExpression' ||
        prop.value.type === 'BinaryExpression')
        ? prop.value
        : prop.type === 'JSXAttribute' &&
          (prop.value?.type === 'StringLiteral' ||
            prop.value?.type === 'JSXExpressionContainer')
        ? prop.value
        : undefined

    if (name && name.type === 'Identifier' && value) {
      // {id: 'id'}
      if (value.type === 'StringLiteral') {
        switch (name.value) {
          case 'id':
            msg.id = value.value
            break
          case 'defaultMessage':
            msg.defaultMessage = value.value
            break
          case 'description':
            msg.description = value.value
            break
        }
      }
      // {id: `id`}
      else if (value.type === 'TemplateLiteral') {
        switch (name.value) {
          case 'id':
            msg.id = value.quasis[0].cooked.value
            break
          case 'defaultMessage':
            msg.defaultMessage = value.quasis[0].cooked.value
            break
          case 'description':
            msg.description = value.quasis[0].cooked.value
            break
        }
      } else if (value.type === 'JSXExpressionContainer') {
        // <FormattedMessage foo={'barbaz'} />
        if (value.expression.type === 'StringLiteral') {
          switch (name.value) {
            case 'id':
              msg.id = value.expression.value
              break
            case 'defaultMessage':
              msg.defaultMessage = value.expression.value
              break
            case 'description':
              msg.description = value.expression.value
              break
          }
        } else if (
          value.expression.type === 'ObjectExpression' &&
          name.value === 'description'
        ) {
          msg.description = expressionToObject(value.expression)
        }
        // <FormattedMessage foo={`bar`} />
        else if (value.expression.type === 'TemplateLiteral') {
          const {expression} = value
          switch (name.value) {
            case 'id':
              msg.id = expression.quasis[0].cooked.value
              break
            case 'defaultMessage':
              msg.defaultMessage = expression.quasis[0].cooked.value
              break
            case 'description':
              msg.description = expression.quasis[0].cooked.value
              break
          }
        }
        // <FormattedMessage foo={'bar' + 'baz'} />
        else if (value.expression.type === 'BinaryExpression') {
          const {expression} = value
          const [result, isStatic] = evaluateStringConcat(expression, filename)
          if (isStatic) {
            switch (name.value) {
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
      else if (value.type === 'BinaryExpression') {
        const [result, isStatic] = evaluateStringConcat(value, filename)
        if (isStatic) {
          switch (name.value) {
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
      } else if (
        value.type === 'ObjectExpression' &&
        name.value === 'description'
      ) {
        msg.description = expressionToObject(value)
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
            {resourcePath: filename} as any,
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
          filename
        )
        break
    }
  }
  if (extractSourceLocation) {
    return {
      ...msg,
      file: filename,
      start: node.span.start,
      end: node.span.end,
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
  node: CallExpression,
  additionalFunctionNames: string[]
) {
  const fnNames = new Set([
    'formatMessage',
    '$formatMessage',
    ...additionalFunctionNames,
  ])

  // Handle foo.formatMessage()
  if (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier'
  ) {
    return fnNames.has(node.callee.property.value)
  }

  // Handle formatMessage()
  return node.callee.type === 'Identifier' && fnNames.has(node.callee.value)
}

function setAttributesInObject(
  props: ObjectExpression['properties'],
  msg: MessageDescriptor,
  span: Span,
  ast?: boolean
): KeyValueProperty[] {
  const newProps: KeyValueProperty[] = [
    {
      type: 'KeyValueProperty',
      key: createIdentifier('id', span),
      value: createStringLiteral(msg.id, span),
    },
    ...(msg.defaultMessage
      ? [
          createKeyValueProperty(
            'defaultMessage',
            ast
              ? messageASTToTSNode(parse(msg.defaultMessage), span)
              : createStringLiteral(msg.defaultMessage, span),
            span
          ),
        ]
      : []),
  ]

  for (const prop of props) {
    if (
      prop.type === 'KeyValueProperty' &&
      prop.key.type === 'Identifier' &&
      MESSAGE_DESC_KEYS.includes(prop.key.value as keyof MessageDescriptor)
    ) {
      continue
    }
    if (prop.type === 'KeyValueProperty') {
      newProps.push(prop)
    }
  }
  return newProps
}

function generateNewProperties(
  {span, attributes = []}: JSXOpeningElement,
  msg: MessageDescriptor,
  ast?: boolean
): JSXAttribute[] {
  const newProps: JSXAttribute[] = [
    {
      type: 'JSXAttribute',
      name: createIdentifier('id', span),
      value: createStringLiteral(msg.id, span),
      span,
    },
    ...(msg.defaultMessage
      ? [
          {
            type: 'JSXAttribute',
            name: createIdentifier('defaultMessage', span),
            value: ast
              ? ({
                  type: 'JSXExpressionContainer',
                  expression: messageASTToTSNode(
                    parse(msg.defaultMessage),
                    span
                  ),
                } as JSXExpressionContainer)
              : createStringLiteral(msg.defaultMessage, span),
            span,
          } as JSXAttribute,
        ]
      : []),
  ]
  for (const prop of attributes) {
    if (
      prop.type === 'JSXAttribute' &&
      prop.name.type === 'Identifier' &&
      MESSAGE_DESC_KEYS.includes(prop.name.value as keyof MessageDescriptor)
    ) {
      continue
    }
    if (prop.type === 'JSXAttribute') {
      newProps.push(prop)
    }
  }
  return newProps
}
export class FormatJSTransformer extends Visitor {
  private opts: Opts
  // @ts-ignore
  constructor(opts: Opts = {}) {
    // @ts-ignore
    this.opts = {...DEFAULT_OPTS, ...opts}
  }
  visitCallExpression(node: CallExpression): Expression {
    const {opts} = this
    const {filename = '', additionalFunctionNames, onMsgExtracted} = opts
    if (isMultipleMessageDecl(node)) {
      const [arg, ...restArgs] = node.arguments
      let descriptorsObj: ObjectExpression | undefined
      if (arg.expression.type === 'ObjectExpression') {
        descriptorsObj = arg.expression
      } else if (
        (arg.expression.type === 'TsAsExpression' ||
          arg.expression.type === 'TsConstAssertion') &&
        arg.expression.expression.type === 'ObjectExpression'
      ) {
        descriptorsObj = arg.expression.expression
      }
      if (descriptorsObj) {
        const properties = descriptorsObj.properties
        const msgs = properties
          .filter<KeyValueProperty>(
            (prop): prop is KeyValueProperty => prop.type === 'KeyValueProperty'
          )
          .map(
            prop =>
              prop.value.type === 'ObjectExpression' &&
              extractMessageDescriptor(prop.value, opts)
          )
          .filter((msg): msg is MessageDescriptor => !!msg)
        if (!msgs.length) {
          return node
        }
        debug(
          'Multiple messages extracted from the same file "%s": %s',
          filename,
          msgs
        )
        if (typeof onMsgExtracted === 'function') {
          onMsgExtracted(filename, msgs)
        }

        const clonedProperties = properties.map((prop, i) => {
          if (
            prop.type !== 'KeyValueProperty' ||
            prop.value.type !== 'ObjectExpression'
          ) {
            return prop
          }

          return {
            ...prop,
            value: createObjectExpression(
              setAttributesInObject(
                prop.value.properties,
                {
                  defaultMessage: opts.removeDefaultMessage
                    ? undefined
                    : msgs[i].defaultMessage,
                  id: msgs[i]?.id || '',
                },
                prop.value.span,
                opts.ast
              ),
              node.span
            ),
          }
        })
        return {
          ...node,
          arguments: [
            {
              expression: {
                type: 'ObjectExpression',
                properties: clonedProperties,
                span: descriptorsObj.span,
              },
            },
            ...restArgs,
          ],
        }
      }
    } else if (
      isSingularMessageDecl(node, opts.additionalComponentNames || []) ||
      isMemberMethodFormatMessageCall(node, additionalFunctionNames || [])
    ) {
      const [descriptorsObj, ...restArgs] = node.arguments
      if (descriptorsObj.expression.type === 'ObjectExpression') {
        const msg = extractMessageDescriptor(descriptorsObj.expression, opts)
        if (!msg) {
          return node
        }
        debug('Message extracted from "%s": %s', filename, msg)
        if (typeof onMsgExtracted === 'function') {
          onMsgExtracted(filename, [msg])
        }

        return {
          ...node,
          arguments: [
            {
              expression: createObjectExpression(
                setAttributesInObject(
                  descriptorsObj.expression.properties,
                  {
                    defaultMessage: opts.removeDefaultMessage
                      ? undefined
                      : msg.defaultMessage,
                    id: msg.id,
                  },
                  descriptorsObj.expression.span,
                  opts.ast
                ),
                node.span
              ),
            },
            ...restArgs,
          ],
        }
      }
    }
    return {
      ...node,
      callee: this.visitCallee(node.callee),
      arguments: this.visitArguments(node.arguments),
    }
  }
  visitJSXOpeningElement(node: JSXOpeningElement): JSXOpeningElement {
    const {opts} = this
    const {onMsgExtracted, filename = ''} = opts
    if (!isSingularMessageDecl(node, opts.additionalComponentNames || [])) {
      return {
        ...node,
        name: this.visitJSXElementName(node.name),
        attributes: !node.attributes
          ? undefined
          : node.attributes.map(this.visitJSXAttributeOrSpread, this),
      }
    }
    const msg = extractMessageDescriptor(node, opts)
    if (!msg) {
      return {
        ...node,
        name: this.visitJSXElementName(node.name),
        attributes: !node.attributes
          ? undefined
          : node.attributes.map(this.visitJSXAttributeOrSpread, this),
      }
    }
    debug('Message extracted from "%s": %s', filename, msg)
    if (typeof onMsgExtracted === 'function') {
      onMsgExtracted(filename, [msg])
    }

    const newProps = generateNewProperties(
      node,
      {
        defaultMessage: opts.removeDefaultMessage
          ? undefined
          : msg.defaultMessage,
        id: msg.id,
      },
      opts.ast
    )

    return {
      ...node,
      attributes: newProps,
    }
  }
}
