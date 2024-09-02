import {TSESTree} from '@typescript-eslint/utils'
import {RuleModule, RuleListener} from '@typescript-eslint/utils/ts-eslint'
import {isIntlFormatMessageCall} from '../util'

type MessageIds = 'jsxChildren'
type Options = []

export const name = 'prefer-formatted-message'

export const rule: RuleModule<MessageIds, Options, {}, RuleListener> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer `FormattedMessage` component over `intl.formatMessage` if applicable.',
      url: 'https://formatjs.io/docs/tooling/linter#prefer-formatted-message',
    },
    messages: {
      jsxChildren:
        'Prefer `FormattedMessage` over `intl.formatMessage` in the JSX children expression.',
    },
    schema: [],
  },
  defaultOptions: [],
  // TODO: Vue support
  create(context) {
    return {
      JSXElement: (node: TSESTree.JSXElement) => {
        node.children.forEach(child => {
          if (
            child.type !== 'JSXExpressionContainer' ||
            !isIntlFormatMessageCall(child.expression)
          ) {
            return
          }
          context.report({
            node: child,
            messageId: 'jsxChildren',
          })
        })
      },
    }
  },
}
