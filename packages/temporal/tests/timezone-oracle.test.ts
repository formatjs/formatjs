import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'
import {checkTimezoneOracle} from '#packages/temporal/tests/timezone-oracle.js'

it('matches independent ICU identities, future offsets, transitions and local resolution', () => {
  const fixture = (name: string) =>
    readFileSync(
      runfiles.resolve(
        `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-${name}-fixtures.tsv`
      ),
      'utf8'
    )
  const counts = checkTimezoneOracle(
    Temporal,
    fixture('timezone-identity'),
    fixture('timezone'),
    fixture('transition'),
    (actual, expected, context) => expect(actual, context).toBe(expected)
  )
  expect(counts.transitions).toBeGreaterThan(10000)
}, 120_000)
