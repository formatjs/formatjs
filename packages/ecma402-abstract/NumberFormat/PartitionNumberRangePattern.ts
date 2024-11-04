import {NumberFormatInternal, NumberFormatPart} from '../types/number'
import {CollapseNumberRange} from './CollapseNumberRange'
import {FormatApproximately} from './FormatApproximately'
import {PartitionNumberPattern} from './PartitionNumberPattern'

/**
 * https://tc39.es/ecma402/#sec-partitionnumberrangepattern
 */
export function PartitionNumberRangePattern(
  numberFormat: Intl.NumberFormat,
  x: number,
  y: number,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
) {
  if (isNaN(x) || isNaN(y)) {
    throw new RangeError('Input must be a number')
  }

  let result: NumberFormatPart[] = []
  const xResult = PartitionNumberPattern(numberFormat, x, {getInternalSlots})
  const yResult = PartitionNumberPattern(numberFormat, y, {getInternalSlots})
  if (xResult === yResult) {
    return FormatApproximately(numberFormat, xResult, {getInternalSlots})
  }

  for (const r of xResult) {
    r.source = 'startRange'
  }

  result = result.concat(xResult)

  const internalSlots = getInternalSlots(numberFormat)

  const symbols =
    internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem]

  result.push({type: 'literal', value: symbols.rangeSign, source: 'shared'})

  for (const r of yResult) {
    r.source = 'endRange'
  }

  result = result.concat(yResult)

  return CollapseNumberRange(numberFormat, result, {getInternalSlots})
  // TODO: Needs to implement Range Pattern Processing https://unicode-org.github.io/cldr/ldml/tr35-numbers.html#range-pattern-processing
}
