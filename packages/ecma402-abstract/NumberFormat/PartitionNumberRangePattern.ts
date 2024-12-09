import Decimal from 'decimal.js'
import {NumberFormatInternal, NumberFormatPart} from '../types/number'
import {invariant} from '../utils'
import {CollapseNumberRange} from './CollapseNumberRange'
import {FormatApproximately} from './FormatApproximately'
import {PartitionNumberPattern} from './PartitionNumberPattern'

/**
 * https://tc39.es/ecma402/#sec-partitionnumberrangepattern
 */
export function PartitionNumberRangePattern(
  numberFormat: Intl.NumberFormat,
  x: Decimal,
  y: Decimal,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberFormatPart[] {
  // 1. Assert: x and y are both mathematical values.
  invariant(!x.isNaN() && !y.isNaN(), 'Input must be a number')

  // 2. Let result be a new empty List.
  let result: NumberFormatPart[] = []

  // 3. Let xResult be ? PartitionNumberPattern(numberFormat, x).
  const xResult = PartitionNumberPattern(numberFormat, x, {getInternalSlots})

  // 4. Let yResult be ? PartitionNumberPattern(numberFormat, y).
  const yResult = PartitionNumberPattern(numberFormat, y, {getInternalSlots})

  // 5. If xResult is the same List as yResult, then
  if (xResult === yResult) {
    // 5.a. Return ? FormatApproximately(numberFormat, xResult).
    return FormatApproximately(numberFormat, xResult, {getInternalSlots})
  }

  // 6. For each element r of xResult, set r.[[Source]] to "startRange".
  for (const r of xResult) {
    r.source = 'startRange'
  }

  // 7. Append all elements of xResult to result.
  result = result.concat(xResult)

  // 8. Let internalSlots be ? GetInternalSlots(numberFormat).
  const internalSlots = getInternalSlots(numberFormat)

  // 9. Let symbols be internalSlots.[[dataLocaleData]].[[numbers]].[[symbols]][internalSlots.[[numberingSystem]]].
  const symbols =
    internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem]

  // 10. Append a new Record { [[Type]]: "literal", [[Value]]: symbols.[[rangeSign]], [[Source]]: "shared" } to result.
  result.push({type: 'literal', value: symbols.rangeSign, source: 'shared'})

  // 11. For each element r of yResult, set r.[[Source]] to "endRange".
  for (const r of yResult) {
    r.source = 'endRange'
  }

  // 12. Append all elements of yResult to result.
  result = result.concat(yResult)

  // 13. Return ? CollapseNumberRange(numberFormat, result).
  return CollapseNumberRange(numberFormat, result, {getInternalSlots})
  // TODO: Needs to implement Range Pattern Processing https://unicode-org.github.io/cldr/ldml/tr35-numbers.html#range-pattern-processing
}
