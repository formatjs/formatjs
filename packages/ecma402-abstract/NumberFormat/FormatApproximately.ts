import type {Decimal} from '@formatjs/bigdecimal'
import type {
  NumberFormatInternal,
  NumberFormatPart,
} from '#packages/ecma402-abstract/types/number.js'
import {PartitionNumberPattern} from '#packages/ecma402-abstract/NumberFormat/PartitionNumberPattern.js'

// ECMA-402 §16.5.20 step 2 inserts the approximately sign at a locale-dependent position.
// Render it in the same pattern as the number so currency, bidi, and sign placement agree.
// https://tc39.es/ecma402/#sec-formatapproximately
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1859-L1861
// https://unicode.org/reports/tr35/tr35-numbers.html#Approximate_Number_Formatting
// https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-numbers.md#L1854-L1858
export function FormatApproximately(
  internalSlots: NumberFormatInternal,
  x: Decimal
): NumberFormatPart[] {
  return PartitionNumberPattern(internalSlots, x, true)
}
