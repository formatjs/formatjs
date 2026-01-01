import type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext} from '@typescript-eslint/utils/ts-eslint'

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
  messageDescriptorNode: TSESTree.ObjectExpression | TSESTree.JSXOpeningElement
  messageNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value']
  messagePropNode?: TSESTree.Property | TSESTree.JSXAttribute
  descriptionNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value']
  idValueNode?: TSESTree.Property['value'] | TSESTree.JSXAttribute['value']
  idPropNode?: TSESTree.Property | TSESTree.JSXAttribute
}

export function getSettings<
  TMessageIds extends string,
  TOptions extends readonly unknown[],
>({settings}: RuleContext<TMessageIds, TOptions>): Settings {
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

export function isIntlFormatMessageCall(
  node: TSESTree.Node
): node is TSESTree.CallExpression {
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

export function extractMessageDescriptor(
  node?: TSESTree.Expression
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

    const valueNode = prop.value
    let value: string | undefined = undefined
    if (isStringLiteral(valueNode)) {
      value = valueNode.value
    }
    // like "`asd`"
    else if (isTemplateLiteralWithoutVar(valueNode)) {
      value = valueNode.quasis[0].value.cooked
    }
    // like "dedent`asd`"
    else if (valueNode.type === 'TaggedTemplateExpression') {
      const {quasi} = valueNode
      if (!isTemplateLiteralWithoutVar(quasi)) {
        throw new Error('Tagged template expression must be no substitution')
      }
      value = quasi.quasis[0].value.cooked
    }
    // like "`asd` + `asd`"
    else if (valueNode.type === 'BinaryExpression') {
      const [result, isStatic] = staticallyEvaluateStringConcat(valueNode)
      if (isStatic) {
        value = result
      }
    }

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
  node?: TSESTree.JSXOpeningElement
):
  | [MessageDescriptorNodeInfo, TSESTree.ObjectExpression | undefined]
  | undefined {
  if (!node || !node.attributes) {
    return
  }
  let values: TSESTree.ObjectExpression | undefined
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
      if (isStringLiteral(valueNode)) {
        value = valueNode.value
      } else if (valueNode?.type === 'JSXExpressionContainer') {
        const {expression} = valueNode
        if (expression.type === 'BinaryExpression') {
          const [result, isStatic] = staticallyEvaluateStringConcat(expression)
          if (isStatic) {
            value = result
          }
        }
        // like "`asd`"
        else if (isTemplateLiteralWithoutVar(expression)) {
          value = expression.quasis[0].value.cooked
        }
        // like "dedent`asd`"
        else if (expression.type === 'TaggedTemplateExpression') {
          const {quasi} = expression
          if (!isTemplateLiteralWithoutVar(quasi)) {
            throw new Error(
              'Tagged template expression must be no substitution'
            )
          }
          value = quasi.quasis[0].value.cooked
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

/**
 * Apply changes to the ICU message in code. The return value can be used in
 * `fixer.replaceText(messageNode, <return value>)`. If the return value is null,
 * it means that the patch cannot be applied.
 */
export function patchMessage(
  messageNode: TSESTree.Node,
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
      patcher(messageNode.quasis[0].value.cooked, ast)
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`') +
      '`'
    )
  }

  return null
}
