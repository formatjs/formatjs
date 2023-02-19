import type {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {isIntlFormatMessageCall} from '../util'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer `FormattedMessage` component over `intl.formatMessage` if applicable.',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#prefer-formatted-message',
    },
    messages: {
      jsxChildren:
        'Prefer `FormattedMessage` over `intl.formatMessage` in the JSX children expression.',
    },
  },
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
            node: node as any,
            messageId: 'jsxChildren',
          })
        })
      },
    } as any
  },
}

export default rule
