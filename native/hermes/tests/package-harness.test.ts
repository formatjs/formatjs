import {expect, test} from 'vitest'
import * as harness from './package-harness.js'

function run(
  body: () => void,
  snapshots: object = {},
  exclusions: object = {}
) {
  const host = globalThis as any
  host.__PACKAGE_SNAPSHOTS = snapshots
  host.__PACKAGE_EXCLUSIONS = exclusions
  harness.beginFile('contract')
  let result: any
  const previous = host.print
  host.print = (value: string) => {
    result = JSON.parse(value)
  }
  try {
    body()
    harness.finishFile()
    try {
      harness.report()
    } catch (error) {
      if (!result?.failures.length) throw error
    }
    return result
  } finally {
    host.print = previous
  }
}

test('runs parameterized cases with scoped setup and cleanup', () => {
  const order: string[] = []
  const result = run(() => {
    harness.describe('suite', () => {
      harness.beforeAll(() => {
        order.push('setup')
      })
      harness.afterEach(() => {
        order.push('cleanup')
      })
      harness.it.each([1, 2])('value %s', value => {
        order.push(String(value))
        harness.expect(value).not.toBe(0)
      })
    })
  })
  expect(result.failures).toEqual([])
  expect(result.passed).toBe(2)
  expect(order).toEqual(['setup', '1', 'cleanup', '2', 'cleanup'])
})

test('rejects changed, missing, and unconsumed existing snapshots', () => {
  const result = run(
    () => {
      harness.it('changed', () =>
        harness.expect([{value: 'wrong'}]).toMatchSnapshot()
      )
      harness.it('missing', () => harness.expect('new').toMatchSnapshot())
    },
    {'changed 1': [{value: 'original'}], 'unused 1': 'retained'}
  )
  expect(result.passed).toBe(0)
  expect(result.failures).toHaveLength(3)
  expect(result.failures.join('\n')).toContain('Snapshot mismatch changed 1')
  expect(result.failures.join('\n')).toContain(
    'Missing existing snapshot: missing 1'
  )
  expect(result.failures.join('\n')).toContain(
    'Unused existing snapshots: unused 1'
  )
})

test('snapshot comparison preserves whitespace and distinguishes arrays from objects', () => {
  const result = run(
    () => {
      harness.it('spaces', () => harness.expect('a b').toMatchSnapshot())
      harness.it('shape', () => harness.expect({'0': 'a'}).toMatchSnapshot())
    },
    {'spaces 1': 'a\u202fb', 'shape 1': ['a']}
  )
  expect(result.passed).toBe(0)
  expect(result.failures).toHaveLength(2)
})

test('fails incorrect throw types and stale exclusions', () => {
  const result = run(
    () => {
      harness.it('wrong type', () =>
        harness
          .expect(() => {
            throw new TypeError('bad')
          })
          .toThrow(RangeError)
      )
      harness.it('no throw', () => harness.expect(() => {}).toThrow())
    },
    {},
    {'removed case': 'TS private state'}
  )
  expect(result.passed).toBe(0)
  expect(result.failures).toHaveLength(3)
  expect(result.failures.join('\n')).toContain('Stale exclusions: removed case')
})

test('keeps Vitest loose equality separate from strict snapshot values', () => {
  const result = run(
    () => {
      harness.it('loose', () =>
        harness.expect({}).toEqual({missing: undefined})
      )
      harness.it('snapshot', () =>
        harness.expect({missing: undefined}).toMatchSnapshot()
      )
    },
    {'snapshot 1': {}}
  )
  expect(result.passed).toBe(1)
  expect(result.failures).toHaveLength(1)
})

test('assertion counts catch exception paths that never execute their assertion', () => {
  const result = run(() => {
    harness.it('missing exception', () => {
      harness.expect.assertions(1)
    })
    harness.it.skipIf(true)('conditional skip', () => {
      throw new Error('must not run')
    })
  })
  expect(result.passed).toBe(0)
  expect(result.skipped).toBe(1)
  expect(result.failures).toHaveLength(1)
  expect(result.failures[0]).toContain('Expected 1 assertions, got 0')
})

test('asymmetric matchers reject wrong types and missing members', () => {
  const result = run(() => {
    harness.it('type', () =>
      harness.expect(1).toEqual(harness.expect.any(String))
    )
    harness.it('member', () =>
      harness.expect(['a']).toEqual(harness.expect.arrayContaining(['b']))
    )
  })
  expect(result.passed).toBe(0)
  expect(result.failures).toHaveLength(2)
})

test('partial object matching requires explicitly undefined properties', () => {
  const result = run(() => {
    harness.it('missing', () =>
      harness.expect({}).toMatchObject({value: undefined})
    )
    harness.it('present', () =>
      harness.expect({value: undefined}).toMatchObject({value: undefined})
    )
  })
  expect(result.passed).toBe(1)
  expect(result.failures).toHaveLength(1)
})
