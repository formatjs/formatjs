import {it, expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {Temporal} from '#packages/temporal/index.js'
import {checkStringOracle} from '#packages/temporal/tests/string-oracle.js'

it('matches independent ICU ISO coordinates and zoned offsets while preserving option order', () => {
  const fixture = (name: string) =>
    readFileSync(
      runfiles.resolve(
        `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-${name}-fixtures.tsv`
      ),
      'utf8'
    )
  const iso = fixture('iso')
    .trim()
    .split('\n')
    .filter(line => !line.startsWith('#'))
    .map(line => line.split('\t'))
  console.log(
    checkStringOracle(
      Temporal,
      iso,
      fixture('timezone'),
      (actual, expected, context) => expect(actual, context).toBe(expected)
    )
  )
}, 120_000)
