import {interpolateName} from '@formatjs/ts-transformer'
import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings} from '../util'

export type Option = {
  idInterpolationPattern: string
  idWhitelist?: string[]
}

type MessageIds =
  | 'enforceId'
  | 'enforceIdDefaultMessage'
  | 'enforceIdDescription'
  | 'enforceIdMatching'
  | 'enforceIdMatchingAllowlisted'

type MatchingMessageData = {
  idInterpolationPattern: string
  expected: string
  actual: string | undefined
  idWhitelist?: string
}

type Options = [Option]

function checkNode(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Node,
  {
    idInterpolationPattern,
    idWhitelistRegexps,
  }: {
    idInterpolationPattern: string
    idWhitelistRegexps?: RegExp[]
  }
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
        node,
        messageId: 'enforceId',
      })
    } else if (idInterpolationPattern) {
      if (!defaultMessage) {
        context.report({
          node,
          messageId: 'enforceIdDefaultMessage',
        })
      } else if (!description && descriptionNode) {
        context.report({
          node,
          messageId: 'enforceIdDescription',
        })
      } else {
        if (
          idWhitelistRegexps &&
          id &&
          idWhitelistRegexps.some((r: RegExp) => r.test(id))
        ) {
          // messageId is allowlisted so skip interpolation id check
          continue
        }

        const correctId = interpolateName(
          {
            resourcePath: context.getFilename(),
          },
          idInterpolationPattern,
          {
            content: description
              ? `${defaultMessage}#${description}`
              : defaultMessage,
          }
        )
        if (id !== correctId) {
          let messageId: MessageIds = 'enforceIdMatching'
          let messageData: MatchingMessageData = {
            idInterpolationPattern,
            expected: correctId,
            actual: id,
          }
          if (idWhitelistRegexps) {
            messageId = 'enforceIdMatchingAllowlisted'
            messageData = {
              ...messageData,
              idWhitelist: idWhitelistRegexps
                .map(r => `"${r.toString()}"`)
                .join(', '),
            }
          }

          context.report({
            node,
            messageId,
            data: messageData,
            fix(fixer) {
              if (idPropNode) {
                if (idPropNode.type === 'JSXAttribute') {
                  return fixer.replaceText(idPropNode, `id="${correctId}"`)
                }
                return fixer.replaceText(idPropNode, `id: '${correctId}'`)
              }

              if (messagePropNode) {
                // Insert after default message node
                if (messagePropNode.type === 'JSXAttribute') {
                  return fixer.insertTextAfter(
                    messagePropNode,
                    ` id="${correctId}"`
                  )
                }
                return fixer.insertTextAfter(
                  messagePropNode,
                  `, id: '${correctId}'`
                )
              }
              return null
            },
          })
        }
      }
    }
  }
}

export const name = 'enforce-id'

export const rule: RuleModule<MessageIds, Options> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce (generated) ID in message descriptor',
      url: 'https://formatjs.github.io/docs/tooling/linter#enforce-id',
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
    messages: {
      enforceId: `id must be specified`,
      enforceIdDefaultMessage: `defaultMessage must be a string literal to calculate generated IDs`,
      enforceIdDescription: `description must be a string literal to calculate generated IDs`,
      enforceIdMatching: `"id" does not match with hash pattern {{idInterpolationPattern}}.
Expected: {{expected}}
Actual: {{actual}}`,
      enforceIdMatchingAllowlisted: `"id" does not match with hash pattern {{idInterpolationPattern}} or allowlisted patterns {{idWhitelist}}.
Expected: {{expected}}
Actual: {{actual}}`,
    },
  },
  defaultOptions: [
    {
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
    },
  ],
  create(context) {
    const tmp = context.options[0]
    let opts: {
      idInterpolationPattern: string
      idWhitelistRegexps?: RegExp[]
    } = {
      idInterpolationPattern: tmp?.idInterpolationPattern,
    }
    if (Array.isArray(tmp?.idWhitelist)) {
      const {idWhitelist} = tmp
      opts.idWhitelistRegexps = idWhitelist.map(
        (str: string) => new RegExp(str, 'i')
      )
    }

    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node, opts)

    const parserServices = getParserServices(context)
    //@ts-expect-error defineTemplateBodyVisitor exists in Vue parser
    if (parserServices?.defineTemplateBodyVisitor) {
      //@ts-expect-error
      return parserServices.defineTemplateBodyVisitor(
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
}
