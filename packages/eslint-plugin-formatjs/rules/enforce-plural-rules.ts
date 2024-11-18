import {
  MessageFormatElement,
  isPluralElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import {TSESTree} from '@typescript-eslint/utils'
import {RuleContext, RuleModule} from '@typescript-eslint/utils/ts-eslint'
import {getParserServices} from '../context-compat'
import {extractMessages, getSettings} from '../util'

enum LDML {
  zero = 'zero',
  one = 'one',
  two = 'two',
  few = 'few',
  many = 'many',
  other = 'other',
}

type PluralConfig = {[key in LDML]?: boolean}
export type Options = [PluralConfig?]
type MessageIds = 'missingPlural' | 'forbidden'

function verifyAst(plConfig: PluralConfig, ast: MessageFormatElement[]) {
  const errors: {messageId: MessageIds; data: Record<string, unknown>}[] = []
  for (const el of ast) {
    if (isPluralElement(el)) {
      const rules = Object.keys(plConfig) as Array<LDML>
      for (const rule of rules) {
        if (plConfig[rule] && !el.options[rule]) {
          errors.push({messageId: 'missingPlural', data: {rule}})
        }
        if (!plConfig[rule] && el.options[rule]) {
          errors.push({messageId: 'forbidden', data: {rule}})
        }
      }
      const {options} = el
      for (const selector of Object.keys(options)) {
        errors.push(...verifyAst(plConfig, options[selector].value))
      }
    }
  }

  return errors
}

function checkNode(
  context: RuleContext<MessageIds, Options>,
  node: TSESTree.Node
) {
  const settings = getSettings(context)
  const msgs = extractMessages(node, settings)
  if (!msgs.length) {
    return
  }

  const plConfig = context.options[0]
  if (!plConfig) {
    return
  }
  for (const [
    {
      message: {defaultMessage},
      messageNode,
    },
  ] of msgs) {
    if (!defaultMessage || !messageNode) {
      continue
    }
    const errors = verifyAst(
      plConfig,
      parse(defaultMessage, {
        ignoreTag: settings.ignoreTag,
      })
    )
    for (const error of errors) {
      context.report({
        node: messageNode,
        ...error,
      })
    }
  }
}

export const name = 'enforce-plural-rules'

export const rule: RuleModule<MessageIds, Options> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce plural rules to always specify certain categories like `one`/`other`',
      url: 'https://formatjs.github.io/docs/tooling/linter#enforce-plural-rules',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: Object.keys(LDML).reduce(
          (schema: Record<string, {type: 'boolean'}>, k) => {
            schema[k] = {
              type: 'boolean',
            }
            return schema
          },
          {}
        ),
        additionalProperties: false,
      },
    ],
    messages: {
      missingPlural: `Missing plural rule "{{rule}}"`,
      forbidden: `Plural rule "{{rule}}" is forbidden`,
    },
  },
  defaultOptions: [],
  create(context) {
    const callExpressionVisitor = (node: TSESTree.Node) =>
      checkNode(context, node)

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
      JSXOpeningElement: (node: TSESTree.Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}
