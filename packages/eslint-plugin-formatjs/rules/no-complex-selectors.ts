import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {extractMessages, getSettings} from '../util'
import {
  parse,
  isPluralElement,
  MessageFormatElement,
  isSelectElement,
} from '@formatjs/icu-messageformat-parser'
import {hoistSelectors} from '@formatjs/icu-messageformat-parser/manipulator'

interface Config {
  limit: number
}

function calculateComplexity(ast: MessageFormatElement[]): number {
  if (ast.length === 1) {
    const el = ast[0]
    if (isPluralElement(el) || isSelectElement(el)) {
      return Object.keys(el.options).reduce((complexity, k) => {
        return complexity + calculateComplexity(el.options[k].value)
      }, 0)
    }
  }
  return 1
}

function checkNode(context: Rule.RuleContext, node: TSESTree.Node) {
  const settings = getSettings(context)
  const msgs = extractMessages(node, settings)
  if (!msgs.length) {
    return
  }

  const config: Config = {
    limit: 20,
    ...(context.options[0] || {}),
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

    let ast: MessageFormatElement[]
    try {
      ast = parse(defaultMessage, {
        ignoreTag: settings.ignoreTag,
      })
    } catch (e) {
      context.report({
        node: messageNode as any,
        message: e instanceof Error ? e.message : String(e),
      })
      return
    }

    const hoistedAst = hoistSelectors(ast)
    const complexity = calculateComplexity(hoistedAst)
    if (complexity > config.limit) {
      context.report({
        node: messageNode as any,
        message: `Message complexity is too high (${complexity} vs limit at ${config.limit})`,
      })
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: `Make sure a sentence is not too complex. 
Complexity is determined by how many strings are produced when we try to
flatten the sentence given its selectors. For example:
"I have {count, plural, one{a dog} other{many dogs}}"
has the complexity of 2 because flattening the plural selector
results in 2 sentences: "I have a dog" & "I have many dogs".
Default complexity limit is 20 
(using Smartling as a reference: https://help.smartling.com/hc/en-us/articles/360008030994-ICU-MessageFormat)
`,
      category: 'Errors',
      recommended: false,
      url: 'https://formatjs.io/docs/tooling/linter#no-complex-selectors',
    },
    schema: [
      {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
          },
        },
        additionalProperties: false,
      },
    ],
    fixable: 'code',
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
