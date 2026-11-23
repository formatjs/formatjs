import {
  RangeErrorConstructor,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import type {IntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import type {Decimal} from '@formatjs/bigdecimal'
import {
  type NumberFormatInternal,
  type NumberFormatPart,
} from '#packages/ecma402-abstract/types/number.js'
import {CollapseNumberRange} from '#packages/ecma402-abstract/NumberFormat/CollapseNumberRange.js'
import {FormatApproximately} from '#packages/ecma402-abstract/NumberFormat/FormatApproximately.js'
import {PartitionNumberPattern} from '#packages/ecma402-abstract/NumberFormat/PartitionNumberPattern.js'
import {joinNumberParts} from '#packages/ecma402-abstract/NumberFormat/FormatNumeric.js'

function appendEndpoint(
  result: NumberFormatPart[],
  endpoint: NumberFormatPart[],
  source: 'startRange' | 'endRange' | 'shared'
): void {
  for (let index = 0; index < endpoint.length; index++) {
    const {type, value} = endpoint[index]
    setDataProperty(result, result.length, {type, value, source})
  }
}

/**
 * https://tc39.es/ecma402/#sec-partitionnumberrangepattern
 */
export function PartitionNumberRangePattern(
  numberFormat: Intl.NumberFormat,
  x: Decimal | IntlMathematicalValue,
  y: Decimal | IntlMathematicalValue,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberFormatPart[] {
  // ECMA-402 §16.5.18 step 1 rejects NaN before formatting either endpoint.
  if (
    ('value' in x ? x.value : x).isNaN() ||
    ('value' in y ? y.value : y).isNaN()
  )
    throw new RangeErrorConstructor('Input must be a number')
  const internalSlots = getInternalSlots(numberFormat)

  // Steps 2–3 partition both endpoints in argument order.
  const style = {pattern: '', sign: 0}
  const xResult = PartitionNumberPattern(internalSlots, x, style)
  const yResult = PartitionNumberPattern(internalSlots, y)

  const result: NumberFormatPart[] = []
  // Step 4 compares the already-partitioned text and labels approximate parts shared.
  if (joinNumberParts(xResult) === joinNumberParts(yResult)) {
    appendEndpoint(
      result,
      FormatApproximately(internalSlots, xResult, style),
      'shared'
    )
    return result
  }

  // Steps 5–9 construct the private parts list with endpoint sources.
  appendEndpoint(result, xResult, 'startRange')
  const rangeSeparator =
    internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem]
      .rangeSign

  setDataProperty(result, result.length, {
    type: 'literal',
    value: rangeSeparator,
    source: 'shared',
  })
  appendEndpoint(result, yResult, 'endRange')

  // Step 10 applies locale-specific affix collapse.
  return CollapseNumberRange(numberFormat, result, {getInternalSlots})
}
