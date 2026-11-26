import {CORE_MESSAGES} from '#packages/eslint-plugin-formatjs/messages.js'
import {
  extractMessages,
  getSettings,
} from '#packages/eslint-plugin-formatjs/util.js'
import {
  type MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import type {Rule} from 'eslint'
import type {Node} from 'estree-jsx'

type AllowedAdjacency =
  | {argument: string; prefix: string; suffix?: never}
  | {argument: string; prefix?: never; suffix: string}

interface Options {
  allowlist?: AllowedAdjacency[]
}

const WORD_START = /^[\p{L}\p{M}\p{N}\p{Pc}\p{Join_Control}]+/u
const WORD_END = /[\p{L}\p{M}\p{N}\p{Pc}\p{Join_Control}]+$/u

type MessageIssue =
  | 'leadingWhitespace'
  | 'placeholderAdjacentToWord'
  | 'trailingWhitespace'

/**
 * Get the first boundary element, recursing into tags since
 * <b>hello</b> starts with the literal "hello".
 */
function getFirstBoundaryElement(
  ast: MessageFormatElement[]
): MessageFormatElement | null {
  if (ast.length === 0) return null
  const first = ast[0]
  if (first.type === TYPE.tag) {
    return getFirstBoundaryElement(first.children)
  }
  return first
}

/**
 * Get the last boundary element, recursing into tags.
 */
function getLastBoundaryElement(
  ast: MessageFormatElement[]
): MessageFormatElement | null {
  if (ast.length === 0) return null
  const last = ast[ast.length - 1]
  if (last.type === TYPE.tag) {
    return getLastBoundaryElement(last.children)
  }
  return last
}

function isPlaceholder(
  element: MessageFormatElement,
  ordinal: boolean
): boolean {
  // Ordinal affixes belong to the translated branch, as in English #st or Japanese #日.
  return (
    element.type !== TYPE.literal &&
    element.type !== TYPE.tag &&
    !(ordinal && element.type === TYPE.pound)
  )
}

function isAllowedAdjacency(
  element: MessageFormatElement,
  literal: string,
  side: 'prefix' | 'suffix',
  allowlist: AllowedAdjacency[]
): boolean {
  if (
    allowlist.length === 0 ||
    (element.type !== TYPE.argument && element.type !== TYPE.number)
  ) {
    return false
  }

  const word = (side === 'prefix' ? WORD_END : WORD_START).exec(literal)?.[0]
  if (!word) return false

  return allowlist.some(
    allowed => allowed.argument === element.value && allowed[side] === word
  )
}

function findMessageIssues(
  ast: MessageFormatElement[],
  allowlist: AllowedAdjacency[],
  ordinal = false
): MessageIssue[] {
  const issues: MessageIssue[] = []

  const first = getFirstBoundaryElement(ast)
  const last = getLastBoundaryElement(ast)

  // Ignore messages that are only whitespace (edge case)
  if (
    first === last &&
    first?.type === TYPE.literal &&
    ast.length === 1 &&
    first.value.trim() === ''
  ) {
    return issues
  }

  if (first?.type === TYPE.literal && /^\s/.test(first.value)) {
    issues.push('leadingWhitespace')
  }

  if (last?.type === TYPE.literal && /\s$/.test(last.value)) {
    issues.push('trailingWhitespace')
  }

  for (let index = 0; index < ast.length - 1; index++) {
    const current = ast[index]
    const next = ast[index + 1]
    if (
      current.type === TYPE.literal &&
      /\p{L}$/u.test(current.value) &&
      isPlaceholder(next, ordinal) &&
      !isAllowedAdjacency(next, current.value, 'prefix', allowlist)
    ) {
      issues.push('placeholderAdjacentToWord')
    }
    if (
      isPlaceholder(current, ordinal) &&
      next.type === TYPE.literal &&
      /^\p{L}/u.test(next.value) &&
      !isAllowedAdjacency(current, next.value, 'suffix', allowlist)
    ) {
      issues.push('placeholderAdjacentToWord')
    }
  }

  // Check nested message branches independently.
  for (const element of ast) {
    switch (element.type) {
      case TYPE.plural: {
        for (const option of Object.values(element.options)) {
          issues.push(
            ...findMessageIssues(
              option.value,
              allowlist,
              element.pluralType === 'ordinal'
            )
          )
        }
        break
      }
      case TYPE.select: {
        for (const option of Object.values(element.options)) {
          issues.push(...findMessageIssues(option.value, allowlist, ordinal))
        }
        break
      }
      case TYPE.tag:
        issues.push(...findMessageIssues(element.children, allowlist, ordinal))
        break
    }
  }

  return issues
}

function checkNode(
  context: Rule.RuleContext,
  node: Node,
  allowlist: AllowedAdjacency[]
) {
  const msgs = extractMessages(node, getSettings(context))

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
      ast = parse(defaultMessage)
    } catch (e) {
      context.report({
        node: messageNode,
        messageId: 'parseError',
        data: {error: e instanceof Error ? e.message : String(e)},
      })
      return
    }

    const issues = findMessageIssues(ast, allowlist)

    // Deduplicate
    const seen = new Set<string>()
    for (const issue of issues) {
      if (seen.has(issue)) continue
      seen.add(issue)
      context.report({
        node: messageNode,
        messageId: issue,
      })
    }
  }
}

export const name = 'prefer-full-sentence'

export const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Checks messages for layout whitespace and unapproved word-placeholder joins',
      url: 'https://formatjs.github.io/docs/tooling/linter#prefer-full-sentence',
    },
    messages: {
      ...CORE_MESSAGES,
      leadingWhitespace:
        'Messages should be full sentences — leading whitespace suggests string concatenation',
      trailingWhitespace:
        'Messages should be full sentences — trailing whitespace suggests string concatenation',
      placeholderAdjacentToWord:
        'Unexpected word next to a placeholder — use ICU/Intl formatting, or allowlist intentional notation',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowlist: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                argument: {type: 'string', minLength: 1},
                prefix: {type: 'string', minLength: 1, pattern: '^\\S+$'},
                suffix: {type: 'string', minLength: 1, pattern: '^\\S+$'},
              },
              required: ['argument'],
              oneOf: [{required: ['prefix']}, {required: ['suffix']}],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options: Options = context.options[0] ?? {}
    const allowlist = options.allowlist ?? []
    const callExpressionVisitor = (node: Node) =>
      checkNode(context, node, allowlist)

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
      JSXOpeningElement: (node: Node) => checkNode(context, node, allowlist),
      CallExpression: callExpressionVisitor,
    }
  },
}
