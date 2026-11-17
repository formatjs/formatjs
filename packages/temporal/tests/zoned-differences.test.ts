import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'

import {checkZonedArithmeticOracle} from '#packages/temporal/tests/zoned-arithmetic-oracle.js'

it('matches independent ICU zoned spans, boundaries and all rounding modes', () => {
  const fixture = (name: string) =>
    readFileSync(
      runfiles.resolve(
        `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-${name}-fixtures.tsv`
      ),
      'utf8'
    )
  checkZonedArithmeticOracle(
    Temporal,
    fixture('zoned-difference'),
    fixture('zoned-rounding'),
    (actual, expected, context) => expect(actual, context).toBe(expected)
  )
})
