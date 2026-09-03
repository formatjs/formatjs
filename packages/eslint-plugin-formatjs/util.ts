import type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'
import type {Rule} from 'eslint'
import type {
  BinaryExpression,
  Expression,
  Node,
  ObjectExpression,
  Property,
  TemplateLiteral,
} from 'estree-jsx'
import type {JSXAttribute, JSXOpeningElement} from 'estree-jsx'

export interface MessageDescriptor {
  id?: string
  defaultMessage?: string
  description?: string | object
}

const FORMAT_FUNCTION_NAMES = new Set(['$formatMessage', 'formatMessage', '$t'])
const COMPONENT_NAMES = new Set(['FormattedMessage'])

export interface Settings {
  excludeMessageDeclCalls?: boolean
  additionalFunctionNames?: string[]
  additionalComponentNames?: string[]
  ignoreTag?: boolean
}
export interface MessageDescriptorNodeInfo {
  message: MessageDescriptor
  messageDescriptorNode: ObjectExpression | JSXOpeningElement
  messageNode?: Property['value'] | JSXAttribute['value']
  messagePropNode?: Property | JSXAttribute
  descriptionNode?: Property['value'] | JSXAttribute['value']
  idValueNode?: Property['value'] | JSXAttribute['value']
  idPropNode?: Property | JSXAttribute
}

export function getSettings({settings}: Rule.RuleContext): Settings {
  return settings.formatjs ?? settings
}

type BinaryExpressionOperand =
  | BinaryExpression['left']
  | BinaryExpression['right']

function isTemplateLiteralWithoutVar(node: Node): node is TemplateLiteral {
  return node.type === 'TemplateLiteral' && node.quasis.length === 1
}

type TransparentTypeScriptExpressionType =
  | 'TSAsExpression'
  | 'TSSatisfiesExpression'
  | 'TSNonNullExpression'
  | 'TSTypeAssertion'

interface TypeScriptExpressionWrapper {
  type: TransparentTypeScriptExpressionType
  expression: StaticMessageExpression
}

interface TypeScriptBinaryExpressionOperandWrapper {
  type: TransparentTypeScriptExpressionType
  expression: StaticStringConcatOperand
}

type StaticMessageExpression = Expression | TypeScriptExpressionWrapper
type MessagePropertyValue = Property['value'] | TypeScriptExpressionWrapper
type StaticStringConcatOperand =
  | BinaryExpressionOperand
  | TypeScriptBinaryExpressionOperandWrapper

function getStaticStringFromTemplateLiteral(
  node: TemplateLiteral
): string | undefined {
  return node.quasis.length === 1
    ? (node.quasis[0].value.cooked ?? undefined)
    : undefined
}

function isStaticMessageExpression(
  node: MessagePropertyValue
): node is StaticMessageExpression {
  switch (node.type) {
    case 'ArrayPattern':
    case 'AssignmentPattern':
    case 'ObjectPattern':
      return false
    default:
      return true
  }
}

function getStaticStringFromMessageExpression(
  node: StaticMessageExpression
): string | undefined {
  switch (node.type) {
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
      return getStaticStringFromMessageExpression(node.expression)
    case 'Literal':
      return typeof node.value === 'string' ? node.value : undefined
    case 'TemplateLiteral':
      return getStaticStringFromTemplateLiteral(node)
    case 'TaggedTemplateExpression':
      if (!isTemplateLiteralWithoutVar(node.quasi)) {
        throw new Error('Tagged template expression must be no substitution')
      }
      return getStaticStringFromTemplateLiteral(node.quasi)
    case 'BinaryExpression': {
      const [result, isStaticallyEvaluatable] =
        staticallyEvaluateStringConcat(node)
      return isStaticallyEvaluatable ? result : undefined
    }
  }
}

function getStaticStringFromBinaryExpressionOperand(
  node: StaticStringConcatOperand
): string | undefined {
  switch (node.type) {
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
      return getStaticStringFromBinaryExpressionOperand(node.expression)
    case 'Literal':
      return typeof node.value === 'string' ? node.value : undefined
    case 'BinaryExpression': {
      const [result, isStaticallyEvaluatable] =
        staticallyEvaluateStringConcat(node)
      return isStaticallyEvaluatable ? result : undefined
    }
  }
}

function staticallyEvaluateStringConcat(
  node: BinaryExpression
): [result: string, isStaticallyEvaluatable: boolean] {
  const right = getStaticStringFromBinaryExpressionOperand(node.right)
  const left = getStaticStringFromBinaryExpressionOperand(node.left)
  return left !== undefined && right !== undefined
    ? [left + right, true]
    : ['', false]
}

function unwrapObjectExpression(
  node?: MessagePropertyValue
): ObjectExpression | undefined {
  switch (node?.type) {
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'TSTypeAssertion':
      return unwrapObjectExpression(node.expression)
    case 'ObjectExpression':
      return node
  }
}

function getCalleeName(node: Node): string | undefined {
  if (node.type === 'Identifier') {
    return node.name
  }
  if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
    return node.property.name
  }
}

export function isIntlFormatMessageCall(
  node: Node,
  additionalFunctionNames: string[] = []
): boolean {
  if (node.type === 'ChainExpression') {
    return isIntlFormatMessageCall(node.expression, additionalFunctionNames)
  }
  if (node.type !== 'CallExpression') {
    return false
  }
  const descriptor = node.arguments[0]
  const calleeName = getCalleeName(node.callee)
  return !!(
    calleeName &&
    (FORMAT_FUNCTION_NAMES.has(calleeName) ||
      additionalFunctionNames.includes(calleeName)) &&
    descriptor?.type !== 'SpreadElement' &&
    unwrapObjectExpression(descriptor)
  )
}

export function extractMessageDescriptor(
  expression?: MessagePropertyValue
): MessageDescriptorNodeInfo | undefined {
  const node = unwrapObjectExpression(expression)
  if (!node) {
    return
  }
  const result: MessageDescriptorNodeInfo = {
    messageDescriptorNode: node,
    message: {},
    messageNode: undefined,
    messagePropNode: undefined,
    descriptionNode: undefined,
    idValueNode: undefined,
  }
  for (const prop of node.properties) {
    if (prop.type !== 'Property') {
      continue
    }

    // Only extract values for message-related props
    // GH #5069: Don't process other props like tagName, values, etc.
    const propName =
      prop.key.type === 'Identifier'
        ? prop.key.name
        : prop.key.type === 'Literal'
          ? prop.key.value
          : undefined
    if (
      propName !== 'id' &&
      propName !== 'defaultMessage' &&
      propName !== 'description'
    ) {
      continue
    }

    const valueNode: MessagePropertyValue = prop.value
    const value = isStaticMessageExpression(valueNode)
      ? getStaticStringFromMessageExpression(valueNode)
      : undefined

    switch (propName) {
      case 'defaultMessage':
        result.messagePropNode = prop
        result.messageNode = valueNode
        result.message.defaultMessage = value
        break
      case 'description':
        result.descriptionNode = valueNode
        result.message.description = value
        break
      case 'id':
        result.message.id = value
        result.idValueNode = valueNode
        result.idPropNode = prop
        break
    }
  }
  return result
}

function extractMessageDescriptorFromJSXElement(
  node?: JSXOpeningElement
): [MessageDescriptorNodeInfo, ObjectExpression | undefined] | undefined {
  if (!node || !node.attributes) {
    return
  }
  let values: ObjectExpression | undefined
  const result: MessageDescriptorNodeInfo = {
    messageDescriptorNode: node,
    message: {},
    messageNode: undefined,
    messagePropNode: undefined,
    descriptionNode: undefined,
    idValueNode: undefined,
    idPropNode: undefined,
  }
  let hasSpreadAttribute = false
  for (const prop of node.attributes) {
    // We can't analyze spread attr
    if (prop.type === 'JSXSpreadAttribute') {
      hasSpreadAttribute = true
    }
    if (prop.type !== 'JSXAttribute' || prop.name.type !== 'JSXIdentifier') {
      continue
    }
    const key = prop.name
    const keyName = key.name

    // Only extract values for message-related props
    // GH #5069: Don't process other props like tagName, values, etc.
    // Allow them to have tagged templates with substitutions
    const isMessageProp =
      keyName === 'id' ||
      keyName === 'defaultMessage' ||
      keyName === 'description'

    let valueNode = prop.value
    let value: string | undefined = undefined
    if (valueNode && isMessageProp) {
      if (valueNode.type === 'Literal' && typeof valueNode.value === 'string') {
        value = valueNode.value
      } else if (valueNode?.type === 'JSXExpressionContainer') {
        const {expression} = valueNode
        if (expression.type !== 'JSXEmptyExpression') {
          value = getStaticStringFromMessageExpression(expression)
        }
      }
    }

    switch (keyName) {
      case 'defaultMessage':
        result.messagePropNode = prop
        result.messageNode = valueNode
        if (value) {
          result.message.defaultMessage = value
        }
        break
      case 'description':
        result.descriptionNode = valueNode
        if (value) {
          result.message.description = value
        }
        break
      case 'id':
        result.idValueNode = valueNode
        result.idPropNode = prop
        if (value) {
          result.message.id = value
        }
        break
      case 'values':
        if (
          valueNode?.type === 'JSXExpressionContainer' &&
          valueNode.expression.type === 'ObjectExpression'
        ) {
          values = valueNode.expression
        }
        break
    }
  }
  if (
    !result.messagePropNode &&
    !result.descriptionNode &&
    !result.idPropNode &&
    hasSpreadAttribute
  ) {
    return
  }
  return [result, values]
}

function extractMessageDescriptors(expression?: Expression) {
  const node = unwrapObjectExpression(expression)
  if (!node) {
    return []
  }
  const msgs = []
  for (const prop of node.properties) {
    if (prop.type !== 'Property') {
      continue
    }
    const nodeInfo = extractMessageDescriptor(prop.value)
    if (nodeInfo) {
      msgs.push(nodeInfo)
    }
  }
  return msgs
}

export function extractMessages(
  node: Node,
  {
    additionalComponentNames,
    additionalFunctionNames,
    excludeMessageDeclCalls,
  }: Settings = {}
): Array<[MessageDescriptorNodeInfo, Expression | undefined]> {
  const allFormatFunctionNames = Array.isArray(additionalFunctionNames)
    ? new Set([
        ...Array.from(FORMAT_FUNCTION_NAMES),
        ...additionalFunctionNames,
      ])
    : FORMAT_FUNCTION_NAMES
  const allComponentNames = Array.isArray(additionalComponentNames)
    ? new Set([...Array.from(COMPONENT_NAMES), ...additionalComponentNames])
    : COMPONENT_NAMES
  if (node.type === 'CallExpression') {
    const args0 = node.arguments[0]
    const args1 = node.arguments[1]
    // We can't really analyze spread element
    if (!args0 || args0.type === 'SpreadElement') {
      return []
    }
    const calleeName = getCalleeName(node.callee)
    if (!calleeName) {
      return []
    }
    if (calleeName === 'defineMessages') {
      return excludeMessageDeclCalls
        ? []
        : extractMessageDescriptors(args0).map(msg => [msg, undefined])
    }
    if (
      calleeName === 'defineMessage'
        ? !excludeMessageDeclCalls
        : allFormatFunctionNames.has(calleeName)
    ) {
      const msgDescriptorNodeInfo = extractMessageDescriptor(args0)
      if (msgDescriptorNodeInfo && (!args1 || args1.type !== 'SpreadElement')) {
        return [[msgDescriptorNodeInfo, args1 as Expression]]
      }
    }
  } else if (
    node.type === 'JSXOpeningElement' &&
    node.name &&
    node.name.type === 'JSXIdentifier' &&
    allComponentNames.has(node.name.name)
  ) {
    const msgDescriptorNodeInfo = extractMessageDescriptorFromJSXElement(node)
    if (msgDescriptorNodeInfo) {
      return [msgDescriptorNodeInfo]
    }
  }
  return []
}

/**
 * Apply changes to the ICU message in code. The return value can be used in
 * `fixer.replaceText(messageNode, <return value>)`. If the return value is null,
 * it means that the patch cannot be applied.
 */
export function patchMessage(
  messageNode: Node,
  ast: MessageFormatElement[],
  patcher: (messageContent: string, ast: MessageFormatElement[]) => string
): string | null {
  if (
    messageNode.type === 'Literal' &&
    messageNode.value &&
    typeof messageNode.value === 'string'
  ) {
    return (
      '"' + patcher(messageNode.value as string, ast).replace('"', '\\"') + '"'
    )
  } else if (
    messageNode.type === 'TemplateLiteral' &&
    messageNode.quasis.length === 1 &&
    messageNode.expressions.length === 0
  ) {
    return (
      '`' +
      patcher(messageNode.quasis[0].value.cooked!, ast)
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`') +
      '`'
    )
  }

  return null
}
