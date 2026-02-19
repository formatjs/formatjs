import type {
  Expression,
  JSXAttribute,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  JSXText,
  Node,
  PrivateIdentifier,
} from 'estree-jsx'
import type {Rule} from 'eslint'
import * as picomatchNs from 'picomatch'

const picomatch = (picomatchNs as any).default ?? picomatchNs

type PropMatcher = readonly [TagNamePattern: string, PropNamePattern: string][]

type CompiledPropMatcher = readonly [
  TagNamePattern: RegExp,
  PropNamePattern: RegExp,
][]

type Config = {
  props?: {
    include?: PropMatcher
    exclude?: PropMatcher
  }
}

const propMatcherSchema = {
  type: 'array',
  items: {
    type: 'array',
    items: [{type: 'string'}, {type: 'string'}],
  },
}

const defaultPropIncludePattern: PropMatcher = [
  ['*', 'aria-{label,description,details,errormessage}'],
  ['[a-z]*([a-z0-9])', '(placeholder|title)'],
  ['img', 'alt'],
]

const defaultPropExcludePattern: PropMatcher = []

function stringifyJsxTagName(
  tagName: JSXIdentifier | JSXMemberExpression | JSXNamespacedName
): string {
  switch (tagName.type) {
    case 'JSXIdentifier':
      return tagName.name
    case 'JSXMemberExpression':
      return `${stringifyJsxTagName(tagName.object)}.${tagName.property.name}`
    case 'JSXNamespacedName':
      return `${tagName.namespace.name}:${tagName.name.name}`
  }
}

function compilePropMatcher(propMatcher: PropMatcher): CompiledPropMatcher {
  return propMatcher.map(([tagNamePattern, propNamePattern]) => {
    return [
      picomatch.makeRe(tagNamePattern, {contains: false}),
      picomatch.makeRe(propNamePattern, {contains: false}),
    ]
  })
}

export const name = 'no-literal-string-in-jsx'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow untranslated literal strings without translation.',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-literal-string-in-jsx',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          props: {
            type: 'object',
            additionalProperties: false,
            properties: {
              include: {
                ...propMatcherSchema,
              },
              exclude: {
                ...propMatcherSchema,
              },
            },
          },
        },
      },
    ],
    messages: {
      noLiteralStringInJsx: 'Cannot have untranslated text in JSX',
    },
  },
  // TODO: Vue support
  create(context) {
    const userConfig: Config = context.options[0] || {}

    const propIncludePattern: CompiledPropMatcher = compilePropMatcher([
      ...defaultPropIncludePattern,
      ...(userConfig.props?.include ?? []),
    ])

    const propExcludePattern: CompiledPropMatcher = compilePropMatcher([
      ...defaultPropExcludePattern,
      ...(userConfig.props?.exclude ?? []),
    ])

    const lexicalJsxStack: (JSXElement | JSXFragment)[] = []

    const shouldSkipCurrentJsxElement = () => {
      const currentJsxNode = lexicalJsxStack[lexicalJsxStack.length - 1]!
      if (currentJsxNode.type === 'JSXFragment') {
        return false
      }

      const nameString = stringifyJsxTagName(currentJsxNode.openingElement.name)

      // Check if children should be excluded
      for (const [tagNamePattern, propNamePattern] of propExcludePattern) {
        if (
          tagNamePattern.test(nameString) &&
          propNamePattern.test('children')
        ) {
          return true
        }
      }

      return false
    }

    const shouldSkipCurrentJsxAttribute = (node: JSXAttribute) => {
      const currentJsxNode = lexicalJsxStack[lexicalJsxStack.length - 1]!
      if (currentJsxNode.type === 'JSXFragment') {
        return false
      }

      const nameString = stringifyJsxTagName(currentJsxNode.openingElement.name)
      const attributeName =
        typeof node.name.name === 'string'
          ? node.name.name
          : node.name.name.name

      // match exclude
      for (const [tagNamePattern, propNamePattern] of propExcludePattern) {
        if (
          tagNamePattern.test(nameString) &&
          propNamePattern.test(attributeName)
        ) {
          return true
        }
      }

      // match include
      for (const [tagNamePattern, propNamePattern] of propIncludePattern) {
        if (
          tagNamePattern.test(nameString) &&
          propNamePattern.test(attributeName)
        ) {
          return false
        }
      }

      return true
    }

    const checkJSXExpression = (node: Expression | PrivateIdentifier) => {
      // Check if this is either a string literal / template literal, or the concat of them.
      // It also ignores the empty string.
      if (
        (node.type === 'Literal' &&
          typeof node.value === 'string' &&
          node.value.length > 0) ||
        (node.type === 'TemplateLiteral' &&
          (node.quasis.length > 1 || node.quasis[0].value.raw.length > 0))
      ) {
        context.report({
          node,
          messageId: 'noLiteralStringInJsx',
        })
      } else if (node.type === 'BinaryExpression' && node.operator === '+') {
        checkJSXExpression(node.left)
        checkJSXExpression(node.right)
      } else if (node.type === 'ConditionalExpression') {
        checkJSXExpression(node.consequent)
        checkJSXExpression(node.alternate)
      } else if (node.type === 'LogicalExpression') {
        checkJSXExpression(node.left)
        checkJSXExpression(node.right)
      }
    }

    return {
      JSXElement: (node: Node) => {
        lexicalJsxStack.push(node as JSXElement)
      },
      'JSXElement:exit': () => {
        lexicalJsxStack.pop()
      },

      JSXFragment: (node: Node) => {
        lexicalJsxStack.push(node as JSXFragment)
      },
      'JSXFragment:exit': () => {
        lexicalJsxStack.pop()
      },

      JSXAttribute: (node: JSXAttribute) => {
        if (shouldSkipCurrentJsxAttribute(node)) {
          return
        }

        if (!node.value) {
          return
        }

        if (
          node.value.type === 'Literal' &&
          typeof node.value.value === 'string' &&
          node.value.value.length > 0
        ) {
          context.report({
            node: node,
            messageId: 'noLiteralStringInJsx',
          })
        } else if (
          node.value.type === 'JSXExpressionContainer' &&
          node.value.expression.type !== 'JSXEmptyExpression'
        ) {
          checkJSXExpression(node.value.expression)
        }
      },

      JSXText: (node: JSXText) => {
        // Ignore purely spacing fragments
        if (!node.value.replace(/\s*/gm, '')) {
          return
        }

        if (shouldSkipCurrentJsxElement()) {
          return
        }

        context.report({
          node: node,
          messageId: 'noLiteralStringInJsx',
        })
      },

      // Children expression container
      'JSXElement > JSXExpressionContainer': (node: JSXExpressionContainer) => {
        if (shouldSkipCurrentJsxElement()) {
          return
        }

        if (node.expression.type !== 'JSXEmptyExpression') {
          checkJSXExpression(node.expression)
        }
      },
    }
  },
}
