import {
  RuleContext,
  RuleListener,
  RuleModule,
} from '@typescript-eslint/utils/ts-eslint'
import {TSESTree} from '@typescript-eslint/utils'
import {extractMessages} from '../util'

export const name = 'no-explicit-icu-plural'

export type MessageIds = 'noExplicitIcuPlural'
type Options = []

// Matches `one {`, then zero or more `{1}` brace pairs, then a `1` before the closing brace `}`.
const ruleRegex = /one\s*{[^{}]*(?:{[^}]*})*[^{}]*1/

const fix = (val: string) =>
  val.replace(/(one\s*{[^{}]*(?:{[^}]*})*[^{}]*)1/g, '$1#')

function checkNode(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Node
) {
  const msgs = extractMessages(node)

  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (
      messageNode &&
      messageNode.type === 'Literal' &&
      messageNode.value &&
      typeof messageNode.value === 'string' &&
      defaultMessage
    ) {
      if (ruleRegex.test(defaultMessage)) {
        context.report({
          node: messageNode,
          messageId: 'noExplicitIcuPlural',
          fix: fixer =>
            fixer.replaceText(messageNode, `'${fix(messageNode.value)}'`),
        })
      }
    }
  }
}

export const rule: RuleModule<MessageIds, Options, RuleListener> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'We use `one {# item}` instead of `one {1 item}` in ICU messages as some locales use the `one` formatting for other similar numbers.',
      url: 'https://formatjs.io/docs/tooling/linter#no-explicit-icu-plural',
    },
    fixable: 'code',
    messages: {
      noExplicitIcuPlural:
        'Use `one {# item}` instead of `one {1 item}` in ICU messages.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

    //@ts-expect-error defineTemplateBodyVisitor exists in Vue parser
    if (context.parserServices.defineTemplateBodyVisitor) {
      //@ts-expect-error
      return context.parserServices.defineTemplateBodyVisitor(
        {
          CallExpression: callExpressionVisitor,
        },
        {
          CallExpression: callExpressionVisitor,
        }
      )
    }
    return {
      JSXOpeningElement: (node: TSESTree.Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}
