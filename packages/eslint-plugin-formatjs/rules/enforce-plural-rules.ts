import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {extractMessages, getSettings} from '../util'
import {
  parse,
  isPluralElement,
  MessageFormatElement,
} from '@formatjs/icu-messageformat-parser'

class PluralRulesEnforcement extends Error {
  public message: string
  constructor(message: string) {
    super()
    this.message = message
  }
}

enum LDML {
  zero = 'zero',
  one = 'one',
  two = 'two',
  few = 'few',
  many = 'many',
  other = 'other',
}

function verifyAst(
  plConfig: Record<LDML, boolean>,
  ast: MessageFormatElement[]
) {
  for (const el of ast) {
    if (isPluralElement(el)) {
      const rules = Object.keys(plConfig) as Array<LDML>
      for (const rule of rules) {
        if (plConfig[rule] && !el.options[rule]) {
          throw new PluralRulesEnforcement(`Missing plural rule "${rule}"`)
        }
        if (!plConfig[rule] && el.options[rule]) {
          throw new PluralRulesEnforcement(`Plural rule "${rule}" is forbidden`)
        }
      }
      const {options} = el
      for (const selector of Object.keys(options)) {
        verifyAst(plConfig, options[selector].value)
      }
    }
  }
}

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const settings = getSettings(context)
  const msgs = extractMessages(node, settings)
  if (!msgs.length) {
    return
  }

  const plConfig: Record<keyof LDML, boolean> = context.options[0]
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
    try {
      verifyAst(
        context.options[0],
        parse(defaultMessage, {
          ignoreTag: settings.ignoreTag,
        })
      )
    } catch (e) {
      context.report({
        node: messageNode as any,
        message: e instanceof Error ? e.message : String(e),
      })
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce plural rules to always specify certain categories like `one`/`other`',
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#enforce-plural-rules',
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
}

export default rule
