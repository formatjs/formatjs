import {
  type MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import type {Rule} from 'eslint'
import type {Node} from 'estree-jsx'
import {CORE_MESSAGES} from '#packages/eslint-plugin-formatjs/messages.js'
import {
  extractMessages,
  getSettings,
} from '#packages/eslint-plugin-formatjs/util.js'

// Other template syntaxes only survive ICU parsing as literal text, usually
// quoted ('{{name}}'). Code then patches them after translation, which breaks
// once a translator reorders or translates the words around the token.
const TEMPLATE_PLACEHOLDER = new RegExp(
  [
    // Mustache, Handlebars, i18next, Jinja: {{name}}, {{ user.name }}
    String.raw`\{\{\s*[\p{L}_$][\p{L}\p{N}_$.]*\s*\}\}`,
    // printf: %s, %d, %1$s, %(name)s, %@
    String.raw`(?<![\p{L}\p{N}%])%(?:\d+\$)?(?:\([\p{L}_][\p{L}\p{N}_]*\))?[sd@](?![\p{L}\p{N}])`,
  ].join('|'),
  'gu'
)

function findTokens(ast: MessageFormatElement[], tokens: Set<string>): void {
  for (const element of ast) {
    switch (element.type) {
      case TYPE.literal: {
        for (const [token] of element.value.matchAll(TEMPLATE_PLACEHOLDER)) {
          tokens.add(token)
        }
        break
      }
      case TYPE.plural:
      case TYPE.select:
        for (const option of Object.values(element.options)) {
          findTokens(option.value, tokens)
        }
        break
      case TYPE.tag:
        findTokens(element.children, tokens)
        break
      default:
        break
    }
  }
}

function checkNode(context: Rule.RuleContext, node: Node) {
  const settings = getSettings(context)
  for (const [{message, messageNode}] of extractMessages(node, settings)) {
    if (!message.defaultMessage || !messageNode) {
      continue
    }
    let ast: MessageFormatElement[]
    try {
      ast = parse(message.defaultMessage, {ignoreTag: settings.ignoreTag})
    } catch (e) {
      context.report({
        node: messageNode,
        messageId: 'parseError',
        data: {error: (e as Error).message},
      })
      continue
    }
    const tokens = new Set<string>()
    findTokens(ast, tokens)
    for (const token of tokens) {
      context.report({
        node: messageNode,
        messageId: 'literalTemplatePlaceholder',
        data: {token},
      })
    }
  }
}

export const name = 'no-literal-template-placeholder'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow non-ICU template placeholders like `{{name}}` or `%s` in message text',
      url: 'https://formatjs.github.io/docs/tooling/linter#no-literal-template-placeholder',
    },
    messages: {
      ...CORE_MESSAGES,
      literalTemplatePlaceholder:
        '`{{token}}` is literal text in ICU, not a placeholder. Use an ICU argument like `{name}` and pass the value when formatting, instead of replacing the token after translation.',
    },
    schema: [],
  },
  create(context) {
    const callExpressionVisitor = (node: Node) => checkNode(context, node)

    const parserServices = context.sourceCode.parserServices
    if (parserServices?.defineTemplateBodyVisitor) {
      return parserServices.defineTemplateBodyVisitor(
        {CallExpression: callExpressionVisitor},
        {CallExpression: callExpressionVisitor}
      )
    }
    return {
      JSXOpeningElement: (node: Node) => checkNode(context, node),
      CallExpression: callExpressionVisitor,
    }
  },
}
