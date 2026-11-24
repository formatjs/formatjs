import type {ApproximateStyle} from '#packages/ecma402-abstract/NumberFormat/FormatApproximately.js'
import type {IntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import type {Decimal} from '@formatjs/bigdecimal'
import {
  type NumberFormatInternal,
  type NumberFormatPart,
} from '#packages/ecma402-abstract/types/number.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {ComputeExponent} from '#packages/ecma402-abstract/NumberFormat/ComputeExponent.js'
import formatToParts from '#packages/ecma402-abstract/NumberFormat/format_to_parts.js'
import {FormatNumericToString} from '#packages/ecma402-abstract/NumberFormat/FormatNumericToString.js'
import {getPowerOf10} from '#packages/ecma402-abstract/NumberFormat/decimal-cache.js'

// ECMA-402 §16.5.3 PartitionNumberPattern.
// https://tc39.es/ecma402/#sec-partitionnumberpattern
export function PartitionNumberPattern(
  internalSlots: NumberFormatInternal,
  _x: Decimal | IntlMathematicalValue,
  approximateStyle?: ApproximateStyle
): NumberFormatPart[] {
  const record = 'value' in _x ? _x : undefined
  const digitCount = record?.stringDigitCount || 0
  const fractionDigitCount = record?.stringFractionDigitCount || 0
  let x = 'value' in _x ? _x.value : _x
  // IMPL: We need to record the magnitude of the number
  let magnitude = 0

  const {selectPlural, dataLocaleData, numberingSystem} = internalSlots

  const symbols =
    dataLocaleData.numbers.symbols[numberingSystem] ||
    dataLocaleData.numbers.symbols[dataLocaleData.numbers.nu[0]]

  // Step 1 starts with exponent zero.
  let exponent = 0

  let n: string

  // Steps 2–4 use locale symbols for NaN and both infinities.
  if (x.isNaN()) {
    n = symbols.nan
  } else if (!x.isFinite()) {
    n = symbols.infinity
  } else {
    let preview: ReturnType<typeof FormatNumericToString> | undefined
    if (!x.isZero()) {
      invariant(x.isFinite(), 'Input must be a mathematical value')

      // Step 5.a.ii scales percentages by 100.
      if (internalSlots.style == 'percent') {
        x = x.times(100)
      }

      // Steps 5.a.iii–iv compute the exponent and scale the mantissa.
      if (internalSlots.notation !== 'standard') {
        ;[
          exponent,
          // IMPL: We need to record the magnitude of the number
          magnitude,
          preview,
        ] = ComputeExponent(internalSlots, x)

        if (digitCount || fractionDigitCount) preview = undefined
        if (!preview) {
          x = x.times(getPowerOf10(-exponent))
        }
      }
    }

    // Steps 5.b–d store both the formatted digits and the rounded value.
    const formatNumberResult =
      preview ??
      FormatNumericToString(internalSlots, x, digitCount, fractionDigitCount)

    n = formatNumberResult.formattedString

    x = formatNumberResult.roundedNumber
  }

  // Step 6 selects a signed pattern via §16.5.10 GetNumberFormatPattern.
  // https://tc39.es/ecma402/#sec-getnumberformatpattern
  let sign: -1 | 0 | 1

  const signDisplay = internalSlots.signDisplay
  switch (signDisplay) {
    case 'never':
      // Step 15 uses the zero pattern for every value.
      sign = 0
      break
    case 'auto':
      // Step 16 uses the negative pattern for negative values and negative zero.
      if (x.isPositive() || x.isNaN()) {
        sign = 0
      } else {
        sign = -1
      }
      break
    case 'always':
      // Step 17 uses either the positive or negative pattern.
      if (x.isPositive() || x.isNaN()) {
        sign = 1
      } else {
        sign = -1
      }
      break
    case 'exceptZero':
      // Steps 11.a and 18.a use the zero pattern for NaN and signed zeros.
      if (x.isZero() || x.isNaN()) {
        sign = 0
      } else if (x.isNegative()) {
        sign = -1
      } else {
        sign = 1
      }
      break
    default:
      // Step 19 uses the negative pattern only for negative nonzero values.
      invariant(signDisplay === 'negative', 'signDisplay must be "negative"')
      if (x.isNegative() && !x.isZero()) {
        sign = -1
      } else {
        sign = 0
      }
      break
  }

  // Steps 7–10 expand pattern slots into parts.
  return formatToParts(
    {
      roundedNumber: x,
      formattedString: n,
      exponent,
      // IMPL: We're returning this for our implementation of formatToParts
      magnitude,
      sign,
    },
    internalSlots.dataLocaleData,
    selectPlural,
    internalSlots,
    approximateStyle
  )
}
