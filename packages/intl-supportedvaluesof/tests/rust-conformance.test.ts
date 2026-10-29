import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {beforeAll, describe, expect, it} from 'vitest'
import {supportedValuesOf} from '#packages/intl-supportedvaluesof/index.js'
import type {SupportedValuesOf} from '#packages/intl-supportedvaluesof/index.js'

interface Candidate {
  value: string
  locale: string
}

interface Observation extends Candidate {
  resolved?: string
  formatted?: string
}

interface Request {
  key: string
  observations: Observation[]
}

interface Response {
  values?: string[]
  error?: string
}

const keys = [
  'calendar',
  'collation',
  'currency',
  'numberingSystem',
  'timeZone',
  'unit',
] as const

const executable = runfiles.resolve(
  `${process.env.TEST_WORKSPACE || '_main'}/crates/intl_supportedvaluesof/conformance`
)

function rust(requests: Request[]): Response[] {
  const process = spawnSync(executable, [], {
    input: requests.map(request => JSON.stringify(request)).join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  if (process.error) throw process.error
  expect(process.status, process.stderr).toBe(0)
  return process.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
}

// Observe the real host formatters; no fixed expected list is substituted for
// runtime capabilities. Rust and the TS implementation see the same backend.
function observe(
  key: SupportedValuesOf,
  candidate: Candidate
): Observation | undefined {
  const {value, locale} = candidate
  try {
    switch (key) {
      case 'calendar':
        return {
          ...candidate,
          resolved: new Intl.DateTimeFormat(
            `${locale}-u-ca-${value}`
          ).resolvedOptions().calendar,
        }
      case 'collation':
        return {
          ...candidate,
          resolved: new Intl.Collator(
            `${locale}-u-co-${value}`
          ).resolvedOptions().collation,
        }
      case 'currency':
        return {
          ...candidate,
          formatted: new Intl.NumberFormat(locale, {
            style: 'currency',
            currencyDisplay: 'name',
            currency: value,
          }).format(123),
        }
      case 'numberingSystem': {
        const formatter = new Intl.NumberFormat(`${locale}-u-nu-${value}`)
        return {
          ...candidate,
          resolved: formatter.resolvedOptions().numberingSystem,
          formatted: formatter.format(123),
        }
      }
      case 'timeZone':
        return {
          ...candidate,
          resolved: new Intl.DateTimeFormat(locale, {
            timeZone: value,
          }).resolvedOptions().timeZone,
        }
      case 'unit':
        return {
          ...candidate,
          resolved: new Intl.NumberFormat(locale, {
            style: 'unit',
            unit: value,
          }).resolvedOptions().unit,
        }
    }
  } catch {
    return undefined
  }
}

let candidates: Record<SupportedValuesOf, Candidate[]>
let observations: Record<SupportedValuesOf, Observation[]>
let responses: Response[]

beforeAll(() => {
  const process = spawnSync(executable, ['--candidates'], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  if (process.error) throw process.error
  expect(process.status, process.stderr).toBe(0)
  candidates = JSON.parse(process.stdout)
  observations = Object.fromEntries(
    keys.map(key => [
      key,
      candidates[key].flatMap(candidate => {
        const observation = observe(key, candidate)
        return observation ? [observation] : []
      }),
    ])
  ) as Record<SupportedValuesOf, Observation[]>
  responses = rust(keys.map(key => ({key, observations: observations[key]})))
}, 30_000)

describe('Rust supportedValuesOf against TypeScript source', () => {
  for (const [index, key] of keys.entries()) {
    it(`matches every supported ${key} value`, () => {
      expect(candidates[key].length).toBeGreaterThan(0)
      const reference = supportedValuesOf(key)
      expect(reference.length).toBeGreaterThan(0)
      expect(responses[index]).toEqual({values: reference})
      expect(responses[index].values).toEqual([...new Set(reference)].sort())
    })
  }

  it('probes collations outside English', () => {
    for (const [locale, value] of [
      ['de', 'phonebk'],
      ['es', 'trad'],
      ['si', 'dict'],
    ] as const) {
      expect(candidates.collation).toContainEqual({value, locale})
      if (
        new Intl.Collator(locale, {collation: value}).resolvedOptions()
          .collation === value
      ) {
        expect(responses[1].values).toContain(value)
      }
    }
    expect(responses[1].values).not.toContain('search')
    expect(responses[1].values).not.toContain('standard')
  })

  it('rejects every invalid key like the TypeScript implementation', () => {
    const invalid = [
      '',
      'invalid',
      'calendars',
      'Calendar',
      'timezone',
      'numberingsystem',
      'unit\0',
      'undefined',
      'null',
    ]
    const actual = rust(invalid.map(key => ({key, observations: []})))
    for (const [index, key] of invalid.entries()) {
      expect(() => supportedValuesOf(key as SupportedValuesOf)).toThrow(
        RangeError
      )
      expect(actual[index]).toEqual({error: 'RangeError'})
    }
  })

  it('does not leak support between independent backends', () => {
    const requests = keys.flatMap(key => [
      {key, observations: observations[key]},
      {key, observations: []},
      {key, observations: observations[key]},
    ])
    const actual = rust(requests)
    for (const [index] of keys.entries()) {
      expect(actual[index * 3]).toEqual(responses[index])
      expect(actual[index * 3 + 1]).toEqual({values: []})
      expect(actual[index * 3 + 2]).toEqual(responses[index])
    }
  })
})
