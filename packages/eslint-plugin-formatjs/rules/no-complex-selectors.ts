import {Rule} from 'eslint'
import {TSESTree} from '@typescript-eslint/typescript-estree'
import {extractMessages, getSettings} from '../util'
import {
  parse,
  MessageFormatElement,
  TYPE,
} from '@formatjs/icu-messageformat-parser'

interface Config {
  limit: number
}

function calculateComplexity(ast: MessageFormatElement[]): number {
  // Dynamic programming: define a complexity function f, where:
  //   f(plural | select) = sum(f(option) for each option) * f(next element),
  //   f(tag) = f(first element of children) * f(next element),
  //   f(other) = f(next element),
  //   f(out of bound) = 1.
  const complexityByNode = new Map<MessageFormatElement, number>()
  return _calculate(ast, 0)

  function _calculate(ast: MessageFormatElement[], index: number): number {
    const element: MessageFormatElement | undefined = ast[index]
    if (!element) {
      return 1
    }

    const cachedComplexity = complexityByNode.get(element)
    if (cachedComplexity !== undefined) {
      return cachedComplexity
    }

    let complexity: number

    switch (element.type) {
      case TYPE.plural:
      case TYPE.select: {
        let sumOfOptions = 0
        for (const {value} of Object.values(element.options)) {
          sumOfOptions += _calculate(value, 0)
        }
        complexity = sumOfOptions * _calculate(ast, index + 1)
        break
      }
      case TYPE.tag:
        complexity =
          _calculate(element.children, 0) * _calculate(ast, index + 1)
        break
      default:
        complexity = _calculate(ast, index + 1)
        break
    }

    complexityByNode.set(element, complexity)
    return complexity
  }
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

    let complexity = 0
    try {
      complexity = calculateComplexity(ast)
    } catch (e) {
      context.report({
        node: messageNode as any,
        message: e instanceof Error ? e.message : (e as string),
      })
    }
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
