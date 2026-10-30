import {match} from '#packages/intl-localematcher/index.js'
import {findBestMatch} from '#packages/intl-localematcher/abstract/utils.js'
import {readFileSync} from 'fs'
import {join, dirname} from 'path'
import {describe, expect, test} from 'vitest'

interface Fixture {
  description: string
  requested: string[]
  supported: string[]
  expected: string
  defaultLocale?: string
  desiredIndex?: string
}

const fixtures: Fixture[] = JSON.parse(
  readFileSync(
    join(dirname(import.meta.filename), 'icu-match-fixtures.json'),
    'utf8'
  )
)

describe('Locale matching conformance (shared with ICU4J)', () => {
  for (const fixture of fixtures) {
    test(fixture.description, () => {
      const result = match(
        fixture.requested,
        fixture.supported,
        fixture.defaultLocale || fixture.supported[0] || 'en'
      )
      expect(result).toEqual(fixture.expected)
      const best = findBestMatch(
        fixture.requested,
        fixture.supported,
        undefined,
        fixture.defaultLocale || fixture.supported[0] || 'en'
      )
      if (fixture.desiredIndex !== undefined) {
        expect(fixture.requested.indexOf(best.matchedDesiredLocale || '')).toBe(
          +fixture.desiredIndex
        )
      }
    })
  }
})

test('ICU4J differential grid', () => {
  const grid = readFileSync(
    join(
      dirname(import.meta.filename),
      '../../../conformance-tests/icu4j/locale-matcher-grid.tsv'
    ),
    'utf8'
  )
  for (const line of grid.trim().split('\n')) {
    const [desired, available, fallback, expected, desiredIndex] =
      line.split('\t')
    const requested = desired.split(',')
    const supported = available.split(',')
    expect(match(requested, supported, fallback), line).toBe(expected)
    const result = findBestMatch(
      requested,
      supported,
      undefined,
      fallback,
      false
    )
    expect(requested.indexOf(result.matchedDesiredLocale || ''), line).toBe(
      +desiredIndex
    )
  }
})
