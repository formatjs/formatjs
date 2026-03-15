import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util.js'

export enum Option {
  literal = 'literal',
  anything = 'anything',
}

export type ObjectOption = {
  mode?: Option
  minLength?: number
}

type NormalizedOption = {
  mode: Option | undefined
  minLength: number | undefined
}

function normalizeOptions(
  raw: string | ObjectOption | undefined
): NormalizedOption {
  if (typeof raw === 'string') {
    return {mode: raw as Option, minLength: undefined}
  }
  if (typeof raw === 'object' && raw !== null) {
    return {mode: raw.mode, minLength: raw.minLength}
  }
  return {mode: undefined, minLength: undefined}
}

function checkNode(context: Rule.RuleContext, node: Node) {
  const msgs = extractMessages(node, getSettings(context))
  const {mode: type, minLength} = normalizeOptions(context.options[0])
  for (const [
    {
      message: {description},
      descriptionNode,
      messageDescriptorNode,
    },
  ] of msgs) {
    if (!description) {
      if (type === 'literal' && descriptionNode) {
        context.report({
          node: descriptionNode,
          messageId: 'enforceDescriptionLiteral',
        })
      } else if (!descriptionNode) {
        context.report({
          node: messageDescriptorNode,
          messageId: 'enforceDescription',
        })
      }
    } else if (
      typeof minLength === 'number' &&
      typeof description === 'string' &&
      description.length < minLength
    ) {
      context.report({
        node: descriptionNode ?? messageDescriptorNode,
        messageId: 'enforceDescriptionMinLength',
        data: {
          minLength: String(minLength),
          length: String(description.length),
        },
      })
    }
  }
}

export const name = 'enforce-description'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce description in message descriptor',
      url: 'https://formatjs.github.io/docs/tooling/linter#enforce-description',
    },
    fixable: 'code',
    schema: [
      {
        oneOf: [
          {
            type: 'string',
            enum: Object.keys(Option),
          },
          {
            type: 'object',
            properties: {
              mode: {
                type: 'string',
                enum: Object.keys(Option),
              },
              minLength: {
                type: 'integer',
                minimum: 1,
              },
            },
            additionalProperties: false,
            minProperties: 1,
          },
        ],
      },
    ],
    messages: {
      enforceDescription:
        '`description` has to be specified in message descriptor',
      enforceDescriptionLiteral:
        '`description` has to be a string literal (not function call or variable)',
      enforceDescriptionMinLength:
        '`description` must be at least {{minLength}} characters long (currently {{length}})',
    },
  },
  create(context) {
    const callExpressionVisitor = (node: Node) => checkNode(context, node)

    const parserServices = context.sourceCode.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
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
      JSXOpeningElement: (node: Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}
