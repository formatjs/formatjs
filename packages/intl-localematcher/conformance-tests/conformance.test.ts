import {match} from '#packages/intl-localematcher/index.js'
import {describe, expect, test} from 'vitest'
import fixtures from './locale-match-fixtures.json'

describe('Locale matching conformance (shared with ICU4J)', () => {
  for (const fixture of fixtures) {
    test(fixture.description, () => {
      const result = match(
        fixture.requested,
        fixture.supported,
        fixture.supported[0]
      )
      expect(result).toEqual(fixture.expected)
    })
  }
})
