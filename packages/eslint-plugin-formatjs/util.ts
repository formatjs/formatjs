import type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'
import type {Rule} from 'eslint'
import type {
  BinaryExpression,
  CallExpression,
  Expression,
  Node,
  ObjectExpression,
  Property,
  TemplateLiteral,
  JSXOpeningElement,
} from 'estree-jsx'

export interface MessageDescriptor {
  id?: string
  defaultMessage?: string
  description?: string | object
}

const FORMAT_FUNCTION_NAMES = new Set(['$formatMessage', 'formatMessage', '$t'])
const COMPONENT_NAMES = new Set(['FormattedMessage'])
const DECLARATION_FUNCTION_NAMES = new Set(['defineMessage'])

export interface Settings {
  excludeMessageDeclCalls?: boolean
  additionalFunctionNames?: string[]
  additionalComponentNames?: string[]
  ignoreTag?: boolean
}
export interface MessageDescriptorNodeInfo {
  message: MessageDescriptor
  messageDescriptorNode: Node
  messageNode?: Node
  messagePropNode?: Node
  descriptionNode?: Node
  idValueNode?: Node
  idPropNode?: Node
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

export function isIntlFormatMessageCall(node: Node): boolean {
  // GH #4890: Check for both MemberExpression (intl.formatMessage) and Identifier (formatMessage) patterns
  if (node.type !== 'CallExpression') {
    return false
  }

  // Check if call has at least one argument that is an object expression
  if (
    node.arguments.length < 1 ||
    node.arguments[0].type !== 'ObjectExpression'
  ) {
    return false
  }

  // Pattern 1: intl.formatMessage() or something.intl.formatMessage()
  if (node.callee.type === 'MemberExpression') {
    return (
      ((node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'intl') ||
        (node.callee.object.type === 'MemberExpression' &&
          node.callee.object.property.type === 'Identifier' &&
          node.callee.object.property.name === 'intl')) &&
      node.callee.property.type === 'Identifier' &&
      (node.callee.property.name === 'formatMessage' ||
        node.callee.property.name === '$t')
    )
  }

  // Pattern 2: formatMessage() (destructured from useIntl)
  if (node.callee.type === 'Identifier') {
    return FORMAT_FUNCTION_NAMES.has(node.callee.name)
  }

  return false
}

function isSingleMessageDescriptorDeclaration(
  node: Node,
  functionNames: Set<string>
) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    functionNames.has(node.callee.name)
  )
}

function isMultipleMessageDescriptorDeclaration(node: Node) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'defineMessages'
  )
}

function isShorthandTCall(node: CallExpression) {
  if (node.callee.type === 'Identifier') {
    return node.callee.name === '$t'
  }
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === '$t'
  )
}

function extractShorthandTDescriptor(
  node: CallExpression
): [MessageDescriptorNodeInfo, Expression | undefined] | undefined {
  const [idArg, values] = node.arguments
  if (!idArg || idArg.type === 'SpreadElement') {
    return
  }
  if (!isStaticMessageExpression(idArg)) {
    return
  }
  const id = getStaticStringFromMessageExpression(idArg)
  if (!id) {
    return
  }
  const result: MessageDescriptorNodeInfo = {
    messageDescriptorNode: node,
    message: {id},
    messageNode: undefined,
    messagePropNode: undefined,
    descriptionNode: undefined,
    idValueNode: idArg,
    idPropNode: undefined,
  }
  return [
    result,
    values && values.type !== 'SpreadElement' ? values : undefined,
  ]
}

export function extractMessageDescriptor(
  node?: Expression
): MessageDescriptorNodeInfo | undefined {
  if (!node || node.type !== 'ObjectExpression') {
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
    if (prop.type !== 'Property' || prop.key.type !== 'Identifier') {
      continue
    }

    // Only extract values for message-related props
    // GH #5069: Don't process other props like tagName, values, etc.
    const propName = prop.key.name
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
        result.messageNode = valueNode ?? undefined
        if (value) {
          result.message.defaultMessage = value
        }
        break
      case 'description':
        result.descriptionNode = valueNode ?? undefined
        if (value) {
          result.message.description = value
        }
        break
      case 'id':
        result.idValueNode = valueNode ?? undefined
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

function extractMessageDescriptors(node?: Expression) {
  if (!node || node.type !== 'ObjectExpression' || !node.properties.length) {
    return []
  }
  const msgs = []
  for (const prop of node.properties) {
    if (prop.type !== 'Property') {
      continue
    }
    const msg = prop.value
    if (msg.type !== 'ObjectExpression') {
      continue
    }
    const nodeInfo = extractMessageDescriptor(msg as Expression)
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
    const shorthandTDescriptor = isShorthandTCall(node)
      ? extractShorthandTDescriptor(node)
      : undefined
    if (shorthandTDescriptor) {
      return [shorthandTDescriptor]
    }
    if (
      (!excludeMessageDeclCalls &&
        isSingleMessageDescriptorDeclaration(
          node,
          DECLARATION_FUNCTION_NAMES
        )) ||
      isIntlFormatMessageCall(node) ||
      isSingleMessageDescriptorDeclaration(node, allFormatFunctionNames)
    ) {
      const msgDescriptorNodeInfo = extractMessageDescriptor(args0)
      if (msgDescriptorNodeInfo && (!args1 || args1.type !== 'SpreadElement')) {
        return [[msgDescriptorNodeInfo, args1 as Expression]]
      }
    } else if (
      !excludeMessageDeclCalls &&
      isMultipleMessageDescriptorDeclaration(node)
    ) {
      return extractMessageDescriptors(args0).map(msg => [msg, undefined])
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
