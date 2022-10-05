import {NumberFormatInternal, NumberFormatPart} from '../types/number'
import {SameValue} from '../262'
import {PartitionNumberPattern} from './PartitionNumberPattern'
import {CollapseNumberRange} from './CollapseNumberRange'
import {FormatApproximately} from './FormatApproximately'

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
  const internalSlots = getInternalSlots(numberFormat)
  if (isNaN(x) || isNaN(y)) {
    throw new RangeError('Input must be a number')
  }

  if (isFinite(x)) {
    if (isFinite(y) && y < x) {
      throw new RangeError('Y input must be bigger than X')
    } else if (y == Number.NEGATIVE_INFINITY) {
      throw new RangeError('Y input must not be NegativeInfinity')
    } else if (SameValue(y, -0) && x >= 0) {
      throw new RangeError('Y input must be bigger than X')
    }
  } else if (x == Number.POSITIVE_INFINITY) {
    if (isFinite(y) || y == Number.NEGATIVE_INFINITY || SameValue(y, -0)) {
      throw new RangeError('Y input must be bigger than X')
    }
  } else if (SameValue(x, -0)) {
    if (isFinite(y) && y < 0) {
      throw new RangeError('Y input must be bigger than X')
    } else if (y == Number.NEGATIVE_INFINITY) {
      throw new RangeError('Y input must be bigger than X')
    }
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

  const symbols =
    internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem]

  const rangeSeparator = symbols.timeSeparator

  result.push({type: 'literal', value: rangeSeparator, source: 'shared'})

  for (const r of yResult) {
    r.source = 'endRange'
  }

  result = result.concat(yResult)

  return CollapseNumberRange(result)
}
