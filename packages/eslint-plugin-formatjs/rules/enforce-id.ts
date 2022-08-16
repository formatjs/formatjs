import {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {interpolateName} from '@formatjs/ts-transformer'

interface Opts {
  idInterpolationPattern: string
  idWhitelistRegexps?: RegExp[]
}

function checkNode(
  context: Rule.RuleContext,
  node: TSESTree.Node,
  {idInterpolationPattern, idWhitelistRegexps}: Opts
) {
  const msgs = extractMessages(node, getSettings(context))
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
        if (
          idWhitelistRegexps &&
          id &&
          idWhitelistRegexps.some((r: RegExp) => r.test(id))
        ) {
          // messageId is allowlisted so skip interpolation id check
          return
        }

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
          let message = `"id" does not match with hash pattern ${idInterpolationPattern}`
          if (idWhitelistRegexps) {
            message += ` or allowlisted patterns ["${idWhitelistRegexps
              .map(r => r.toString())
              .join('", "')}"]`
          }

          context.report({
            node: node as any,
            message: `${message}.
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
            description:
              'Pattern to verify ID against. Recommended value: [sha512:contenthash:base64:6]',
          },
          idWhitelist: {
            type: 'array',
            description:
              "An array of strings with regular expressions. This array allows allowlist custom ids for messages. For example '`\\\\.`' allows any id which has dot; `'^payment_.*'` - allows any custom id which has prefix `payment_`. Be aware that any backslash \\ provided via string must be escaped with an additional backslash.",
            items: {
              type: 'string',
            },
          },
        },
        required: ['idInterpolationPattern'],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const tmp = context?.options?.[0]
    const opts = {
      idInterpolationPattern: tmp?.idInterpolationPattern,
    } as Opts
    if (Array.isArray(tmp?.idWhitelist)) {
      const {idWhitelist} = tmp
      opts.idWhitelistRegexps = idWhitelist.map(
        (str: string) => new RegExp(str, 'i')
      )
    }

    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node, opts)

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
      JSXOpeningElement: (node: TSESTree.Node) =>
        checkNode(context, node, opts),
      CallExpression: callExpressionVisitor,
    }
  },
} as Rule.RuleModule
