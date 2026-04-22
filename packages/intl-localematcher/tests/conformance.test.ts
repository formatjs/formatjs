import {match} from '#packages/intl-localematcher/index.js'
import {readFileSync} from 'fs'
import {join, dirname} from 'path'
import {describe, expect, test} from 'vitest'

interface Fixture {
  description: string
  requested: string[]
  supported: string[]
  expected: string
}

const fixtures: Fixture[] = JSON.parse(
  readFileSync(
    join(dirname(import.meta.filename), 'locale-match-fixtures.json'),
    'utf8'
  )
)

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
