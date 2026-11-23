import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {it, expect} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'
import {checkDurationOracle} from '#packages/temporal/tests/duration-oracle.js'

it('matches independent ICU scalar, plain and zoned Duration controls', () => {
  const fixture = (name: string) =>
    readFileSync(
      runfiles.resolve(
        `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-${name}-fixtures.tsv`
      ),
      'utf8'
    )
  const scalar = fixture('duration')
    .trim()
    .split('\n')
    .filter(line => !line.startsWith('#'))
    .map(line => line.split('\t'))
  checkDurationOracle(
    Temporal,
    scalar,
    fixture('plain-relative'),
    fixture('zoned-difference'),
    (actual, expected, context) => expect(actual, context).toBe(expected)
  )
}, 120_000)
