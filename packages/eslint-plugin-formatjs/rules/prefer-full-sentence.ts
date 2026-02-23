import {
  type MessageFormatElement,
  parse,
  TYPE,
} from '@formatjs/icu-messageformat-parser'
import type {Node} from 'estree-jsx'
import type {Rule} from 'eslint'
import {extractMessages, getSettings} from '../util.js'
import {CORE_MESSAGES} from '../messages.js'

type WhitespaceIssue = 'leadingWhitespace' | 'trailingWhitespace'

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

function findWhitespaceIssues(ast: MessageFormatElement[]): WhitespaceIssue[] {
  const issues: WhitespaceIssue[] = []

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

  // Check each plural/select option branch independently
  for (const element of ast) {
    switch (element.type) {
      case TYPE.plural:
      case TYPE.select: {
        for (const option of Object.values(element.options)) {
          issues.push(...findWhitespaceIssues(option.value))
        }
        break
      }
    }
  }

  return issues
}

function checkNode(context: Rule.RuleContext, node: Node) {
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

    const issues = findWhitespaceIssues(ast)

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
        'Detects messages with leading/trailing whitespace, which suggests string concatenation instead of full sentences',
      url: 'https://formatjs.github.io/docs/tooling/linter#prefer-full-sentence',
    },
    messages: {
      ...CORE_MESSAGES,
      leadingWhitespace:
        'Messages should be full sentences — leading whitespace suggests string concatenation',
      trailingWhitespace:
        'Messages should be full sentences — trailing whitespace suggests string concatenation',
    },
    schema: [],
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
