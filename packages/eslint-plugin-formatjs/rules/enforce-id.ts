import {Rule} from 'eslint'
import {extractMessages} from '../util'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {interpolateName} from '@formatjs/ts-transformer'

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const msgs = extractMessages(node, context.settings)
  const {options} = context
  const [opt = {}] = options
  const {idInterpolationPattern} = opt
  for (const [
    {
      message: {defaultMessage, description, id},
      idPropNode,
      descriptionNode,
      messagePropNode,
    },
  ] of msgs) {
    if (!idInterpolationPattern && !idPropNode) {
      context.report({
        node: node as any,
        message: `id must be specified`,
      })
    } else if (idInterpolationPattern) {
      if (!defaultMessage) {
        context.report({
          node: node as any,
          message: `defaultMessage must be a string literal to calculate generated IDs`,
        })
      } else if (!description && descriptionNode) {
        context.report({
          node: node as any,
          message: `description must be a string literal to calculate generated IDs`,
        })
      } else {
        const correctId = interpolateName(
          {
            resourcePath: context.getFilename(),
          } as any,
          idInterpolationPattern,
          {
            content: description
              ? `${defaultMessage}#${description}`
              : defaultMessage,
          }
        )
        if (id !== correctId) {
          context.report({
            node: node as any,
            message: `"id" does not match with hash pattern ${idInterpolationPattern}.
Expected: ${correctId}
Actual: ${id}`,
            fix(fixer) {
              if (idPropNode) {
                if (idPropNode.type === 'JSXAttribute') {
                  return fixer.replaceText(
                    idPropNode as any,
                    `id="${correctId}"`
                  )
                }
                return fixer.replaceText(
                  idPropNode as any,
                  `id: '${correctId}'`
                )
              }
              // Insert after default message node
              if (messagePropNode!.type === 'JSXAttribute') {
                return fixer.insertTextAfter(
                  messagePropNode as any,
                  ` id="${correctId}"`
                )
              }
              return fixer.replaceText(
                messagePropNode as any,
                `defaultMessage: '${defaultMessage}', id: '${correctId}'`
              )
            },
          })
        }
      }
    }
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce (generated) ID in message descriptor',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#enforce-id',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          idInterpolationPattern: {
            type: 'string',
          },
        },
        required: ['idInterpolationPattern'],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

    if (context.parserServices.defineTemplateBodyVisitor) {
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
} as Rule.RuleModule
