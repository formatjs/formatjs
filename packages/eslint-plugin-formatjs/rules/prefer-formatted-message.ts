import type {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {extractMessageDescriptor, isIntlFormatMessageCall} from '../util'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer `FormattedMessage` component over `intl.formatMessage` if applicable.',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#prefer-formatted-message',
    },
    fixable: 'code',
    schema: [],
  },
  // TODO: Vue support
  create(context) {
    return {
      JSXElement: (node: TSESTree.JSXElement) => {
        node.children.forEach(child => {
          if (
            child.type === 'JSXExpressionContainer' &&
            isIntlFormatMessageCall(child.expression)
          ) {
            context.report({
              node: node as any,
              message:
                'Prefer `FormattedMessage` over `intl.formatMessage` in the JSX expression',
              fix(fixer) {
                const args0 = child.expression.arguments[0]
                const args1 = child.expression.arguments[1]

                // We can't really analyze spread element
                if (!args0 || args0.type === 'SpreadElement') {
                  return []
                }

                const descriptor = extractMessageDescriptor(args0)
                if (!descriptor) {
                  return []
                }

                const {message, idValueNode} = descriptor

                return [
                  fixer.replaceText(
                    child as any,
                    `<FormattedMessage id="${id}" defaultMessage="${msg}" description="${desc}" values={${values}} />`
                  ),
                ]
              },
            })
          }
        })
      },
    } as any
  },
}

export default rule
