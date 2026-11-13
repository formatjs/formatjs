import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import Decimal from '@formatjs/bigdecimal'
import {expect, test} from 'vitest'
import {FormatNumericToString} from '#packages/ecma402-abstract/NumberFormat/FormatNumericToString.js'
import {SetNumberFormatDigitOptions} from '#packages/ecma402-abstract/NumberFormat/SetNumberFormatDigitOptions.js'
import type {NumberFormatDigitInternalSlots} from '#packages/ecma402-abstract/types/number.js'

const path = runfiles.resolve(
  `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/precision/fixtures.tsv`
)
const rows = readFileSync(path, 'utf8').trimEnd().split('\n').slice(1)

test('complete precision matrix', () => expect(rows).toHaveLength(27))
test.each(rows)('source precision: %s', row => {
  const [input, digits, fraction, options, , expected] = row.split('\t')
  const slots = {} as NumberFormatDigitInternalSlots
  SetNumberFormatDigitOptions(slots, JSON.parse(options), 0, 3, 'standard')
  const actual = FormatNumericToString(
    slots,
    new Decimal(input),
    Number(digits),
    Number(fraction)
  )
  expect(actual.formattedString).toBe(expected)
})
