import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'

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
  messageNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value']
  messagePropNode?: TSESTree.Property | TSESTree.JSXAttribute
  descriptionNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value']
  idValueNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value']
  idPropNode?: TSESTree.Property | TSESTree.JSXAttribute
}

export function getSettings({settings}: Rule.RuleContext): Settings {
  return settings.formatjs ?? settings
}

function isStringLiteral(node: TSESTree.Node): node is TSESTree.StringLiteral {
  return node.type === 'Literal' && typeof node.value === 'string'
}

function isTemplateLiteralWithoutVar(
  node: TSESTree.Node
): node is TSESTree.TemplateLiteral {
  return node.type === 'TemplateLiteral' && node.quasis.length === 1
}

function staticallyEvaluateStringConcat(
  node: TSESTree.BinaryExpression
): [result: string, isStaticallyEvaluatable: boolean] {
  if (!isStringLiteral(node.right)) {
    return ['', false]
  }
  if (isStringLiteral(node.left)) {
    return [String(node.left.value) + node.right.value, true]
  }
  if (node.left.type === 'BinaryExpression') {
    const [result, isStaticallyEvaluatable] = staticallyEvaluateStringConcat(
      node.left
    )
    return [result + node.right.value, isStaticallyEvaluatable]
  }
  return ['', false]
}

function isIntlFormatMessageCall(node: TSESTree.Node) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'intl' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'formatMessage' &&
    node.arguments.length >= 1 &&
    node.arguments[0].type === 'ObjectExpression'
  )
}

function isSingleMessageDescriptorDeclaration(
  node: TSESTree.Node,
  functionNames: Set<string>
) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    functionNames.has(node.callee.name)
  )
}

function isMultipleMessageDescriptorDeclaration(node: TSESTree.Node) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'defineMessages'
  )
}

function extractMessageDescriptor(
  node?: TSESTree.Expression
): MessageDescriptorNodeInfo | undefined {
  if (!node || node.type !== 'ObjectExpression') {
    return
  }
  const result: MessageDescriptorNodeInfo = {
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
    const valueNode = prop.value
    let value: string | undefined = undefined
    if (isStringLiteral(valueNode)) {
      value = valueNode.value
    } else if (isTemplateLiteralWithoutVar(valueNode)) {
      value = valueNode.quasis[0].value.cooked
    } else if (valueNode.type === 'BinaryExpression') {
      const [result, isStatic] = staticallyEvaluateStringConcat(valueNode)
      if (isStatic) {
        value = result
      }
    }

    switch (prop.key.name) {
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
  node?: TSESTree.JSXOpeningElement
):
  | [MessageDescriptorNodeInfo, TSESTree.ObjectExpression | undefined]
  | undefined {
  if (!node || !node.attributes) {
    return
  }
  let values: TSESTree.ObjectExpression | undefined
  const result: MessageDescriptorNodeInfo = {
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
    let valueNode = prop.value
    let value: string | undefined = undefined
    if (valueNode) {
      if (isStringLiteral(valueNode)) {
        value = valueNode.value
      } else if (valueNode?.type === 'JSXExpressionContainer') {
        const {expression} = valueNode
        if (expression.type === 'BinaryExpression') {
          const [result, isStatic] = staticallyEvaluateStringConcat(expression)
          if (isStatic) {
            value = result
          }
        } else if (isTemplateLiteralWithoutVar(expression)) {
          value = expression.quasis[0].value.cooked
        }
      }
    }

    switch (key.name) {
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

function extractMessageDescriptors(node?: TSESTree.Expression) {
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
    const nodeInfo = extractMessageDescriptor(msg)
    if (nodeInfo) {
      msgs.push(nodeInfo)
    }
  }
  return msgs
}

export function extractMessages(
  node: TSESTree.Node,
  {
    additionalComponentNames,
    additionalFunctionNames,
    excludeMessageDeclCalls,
  }: Settings = {}
): Array<[MessageDescriptorNodeInfo, TSESTree.Expression | undefined]> {
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
    const expr = node
    const args0 = expr.arguments[0]
    const args1 = expr.arguments[1]
    // We can't really analyze spread element
    if (!args0 || args0.type === 'SpreadElement') {
      return []
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
        return [[msgDescriptorNodeInfo, args1]]
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
