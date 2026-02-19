import type {JSXElement} from 'estree-jsx'
import type {Rule} from 'eslint'
import {isIntlFormatMessageCall} from '../util.js'

export const name = 'prefer-formatted-message'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer `FormattedMessage` component over `intl.formatMessage` if applicable.',
      url: 'https://formatjs.github.io/docs/tooling/linter#prefer-formatted-message',
    },
    messages: {
      jsxChildren:
        'Prefer `FormattedMessage` over `intl.formatMessage` in the JSX children expression.',
    },
    schema: [],
  },
  // TODO: Vue support
  create(context) {
    return {
      JSXElement: (node: JSXElement) => {
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
