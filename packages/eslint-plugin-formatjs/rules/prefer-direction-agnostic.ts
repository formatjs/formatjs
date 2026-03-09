import postcss from 'postcss'
import * as postcssLess from 'postcss-less'
import * as postcssScss from 'postcss-scss'
import * as sugarss from 'sugarss'
import type {Rule} from 'eslint'

export const name = 'prefer-direction-agnostic'

const PROPERTY_REPLACEMENTS = new Map<string, string>([
  ['left', 'inset-inline-start'],
  ['right', 'inset-inline-end'],
  ['margin-left', 'margin-inline-start'],
  ['margin-right', 'margin-inline-end'],
  ['padding-left', 'padding-inline-start'],
  ['padding-right', 'padding-inline-end'],
  ['border-left', 'border-inline-start'],
  ['border-right', 'border-inline-end'],
  ['border-left-color', 'border-inline-start-color'],
  ['border-right-color', 'border-inline-end-color'],
  ['border-left-style', 'border-inline-start-style'],
  ['border-right-style', 'border-inline-end-style'],
  ['border-left-width', 'border-inline-start-width'],
  ['border-right-width', 'border-inline-end-width'],
  ['border-top-left-radius', 'border-start-start-radius'],
  ['border-top-right-radius', 'border-start-end-radius'],
  ['border-bottom-left-radius', 'border-end-start-radius'],
  ['border-bottom-right-radius', 'border-end-end-radius'],
])

const VALUE_REPLACEMENTS = new Map<string, Record<string, string>>([
  ['text-align', {left: 'start', right: 'end'}],
  ['float', {left: 'inline-start', right: 'inline-end'}],
  ['clear', {left: 'inline-start', right: 'inline-end'}],
])

type SupportedExtension = '.css' | '.scss' | '.sass' | '.less'

type Violation = {
  messageId: 'preferProperty' | 'preferValue'
  data: {
    actual: string
    replacement: string
  }
  range: [number, number]
}

function getSupportedExtension(
  filename: string
): SupportedExtension | undefined {
  const normalized = filename.toLowerCase()
  if (normalized.endsWith('.css')) {
    return '.css'
  }
  if (normalized.endsWith('.scss')) {
    return '.scss'
  }
  if (normalized.endsWith('.sass')) {
    return '.sass'
  }
  if (normalized.endsWith('.less')) {
    return '.less'
  }
  return undefined
}

function getLineStartOffsets(text: string): number[] {
  const offsets = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      offsets.push(i + 1)
    }
  }
  return offsets
}

function getIndexFromPosition(
  lineStartOffsets: number[],
  line: number,
  column: number
): number {
  return lineStartOffsets[line - 1] + column - 1
}

function parseStylesheet(
  text: string,
  filename: string,
  extension: SupportedExtension
) {
  switch (extension) {
    case '.scss':
      return postcssScss.parse(text, {from: filename})
    case '.sass':
      return sugarss.parse(text, {from: filename})
    case '.less':
      return postcssLess.parse(text, {from: filename})
    default:
      return postcss.parse(text, {from: filename})
  }
}

function collectViolations(
  text: string,
  filename: string,
  extension: SupportedExtension
): Violation[] {
  const root = parseStylesheet(text, filename, extension)
  const lineStartOffsets = getLineStartOffsets(text)
  const violations: Violation[] = []

  root.walkDecls(decl => {
    if (!decl.source?.start) {
      return
    }

    const prop = decl.prop.toLowerCase()
    const propReplacement = PROPERTY_REPLACEMENTS.get(prop)
    const propStart = getIndexFromPosition(
      lineStartOffsets,
      decl.source.start.line,
      decl.source.start.column
    )
    const propEnd = propStart + decl.prop.length

    if (propReplacement) {
      violations.push({
        messageId: 'preferProperty',
        data: {actual: prop, replacement: propReplacement},
        range: [propStart, propEnd],
      })
    }

    const valueReplacements = VALUE_REPLACEMENTS.get(prop)
    if (!valueReplacements) {
      return
    }

    const value = decl.value.trim().toLowerCase()
    const valueReplacement = valueReplacements[value]
    if (!valueReplacement) {
      return
    }

    const between = decl.raws.between ?? ':'
    const valueStart = propStart + decl.prop.length + between.length
    violations.push({
      messageId: 'preferValue',
      data: {actual: value, replacement: valueReplacement},
      range: [valueStart, valueStart + decl.value.length],
    })
  })

  return violations
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer direction-agnostic CSS logical properties and values for RTL support',
      url: 'https://formatjs.github.io/docs/tooling/linter#prefer-direction-agnostic',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferProperty:
        'Use the direction-agnostic property "{{replacement}}" instead of "{{actual}}".',
      preferValue:
        'Use the direction-agnostic value "{{replacement}}" instead of "{{actual}}".',
    },
  },
  create(context) {
    const filename = context.filename
    const extension = getSupportedExtension(filename)

    if (!extension) {
      return {}
    }

    return {
      Program() {
        const sourceCode = context.sourceCode

        let violations: Violation[]
        try {
          violations = collectViolations(sourceCode.text, filename, extension)
        } catch {
          return
        }

        for (const violation of violations) {
          context.report({
            loc: {
              start: sourceCode.getLocFromIndex(violation.range[0]),
              end: sourceCode.getLocFromIndex(violation.range[1]),
            },
            messageId: violation.messageId,
            data: violation.data,
            fix(fixer) {
              return fixer.replaceTextRange(
                violation.range,
                violation.data.replacement
              )
            },
          })
        }
      },
    }
  },
}
