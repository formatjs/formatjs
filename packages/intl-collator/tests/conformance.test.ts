import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {Collator as FormatJSCollator} from '#packages/intl-collator/index.js'
import {describe, expect, it} from 'vitest'

type ConformanceCase = {
  readonly description: string
  readonly locale: string
  readonly options: Intl.CollatorOptions
  readonly left: string
  readonly right: string
  readonly expected: number
}

function parseOptionalBoolean(value: string): boolean | undefined {
  return value === '-' ? undefined : value === 'true'
}

function parseCase(line: string): ConformanceCase {
  const parts = line.split('\t')
  if (parts.length !== 9) {
    throw new Error(
      `Invalid fixture row (expected 9 columns, got ${parts.length}): ${line}`
    )
  }
  const [
    description,
    locale,
    sensitivity,
    numeric,
    caseFirst,
    ignorePunctuation,
    left,
    right,
    expected,
  ] = parts
  const options: Intl.CollatorOptions = {}
  // Fixture columns cover the ECMA-402 Collator options that feed
  // InitializeCollator and CompareStrings: sensitivity, numeric (kn),
  // caseFirst (kf), and ignorePunctuation.
  // https://tc39.es/ecma402/#sec-initializecollator
  if (sensitivity !== '-') {
    options.sensitivity = sensitivity as Intl.CollatorOptions['sensitivity']
  }
  const numericValue = parseOptionalBoolean(numeric)
  if (numericValue !== undefined) {
    options.numeric = numericValue
  }
  if (caseFirst !== '-') {
    options.caseFirst = caseFirst as Intl.CollatorOptions['caseFirst']
  }
  const ignorePunctuationValue = parseOptionalBoolean(ignorePunctuation)
  if (ignorePunctuationValue !== undefined) {
    options.ignorePunctuation = ignorePunctuationValue
  }
  return {
    description,
    locale,
    options,
    left,
    right,
    expected: Number(expected),
  }
}

function sign(value: number): number {
  return value < 0 ? -1 : value > 0 ? 1 : 0
}

const cases = readFileSync(
  join(dirname(import.meta.filename), 'collator-conformance.tsv'),
  'utf8'
)
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map(parseCase)

describe('Intl.Collator conformance with native Node Intl.Collator', () => {
  for (const testCase of cases) {
    it(testCase.description, () => {
      const formatjs = new FormatJSCollator(testCase.locale, testCase.options)
      const native = new Intl.Collator(testCase.locale, testCase.options)
      // CompareStrings only promises a negative/zero/positive Number, so
      // conformance compares signs rather than engine-specific magnitudes.
      // https://tc39.es/ecma402/#sec-comparestrings
      const formatjsResult = sign(
        formatjs.compare(testCase.left, testCase.right)
      )
      const nativeResult = sign(native.compare(testCase.left, testCase.right))

      expect(formatjsResult).toBe(testCase.expected)
      expect(nativeResult).toBe(testCase.expected)
      expect(formatjsResult).toBe(nativeResult)
    })
  }
})
