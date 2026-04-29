import {BigDecimal} from '@formatjs/bigdecimal'
import type {NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'
import {
  createMemoizedListFormat,
  createMemoizedNumberFormat,
  invariant,
} from '#packages/ecma402-abstract/utils.js'
import {TABLE_2} from '#packages/intl-durationformat/constants.js'
import {DurationFormat} from '#packages/intl-durationformat/core.js'
import {getInternalSlots} from '#packages/intl-durationformat/get_internal_slots.js'
import {
  type DurationFormatPart,
  type DurationRecord,
} from '#packages/intl-durationformat/types.js'

export function PartitionDurationFormatPattern(
  df: DurationFormat,
  duration: DurationRecord
): DurationFormatPart[] {
  const result: DurationFormatPart[][] = []
  let done = false
  let separated = false
  const internalSlots = getInternalSlots(df)
  let dataLocale = internalSlots.dataLocale
  const dataLocaleData = DurationFormat.localeData[dataLocale]
  if (!dataLocaleData) {
    throw new TypeError('Invalid locale')
  }
  const numberingSystem = internalSlots.numberingSystem
  const separator = dataLocaleData.digitalFormat[numberingSystem]

  for (let i = 0; i < TABLE_2.length && !done; i++) {
    const row = TABLE_2[i]
    // Carry the value as BigDecimal end-to-end so sub-second rollups stay
    // exact. Float arithmetic like `1 + 473/1e3` lands on
    // `1.4729999999999998650`, which `roundingMode: 'trunc'` truncates to
    // `1.472999999` instead of `1.473` (#6462). NumberFormat (V3) accepts
    // a decimal string and parses it as a Mathematical Value, sidestepping
    // the IEEE 754 round-trip entirely.
    let value = new BigDecimal(duration[row.valueField])
    const style = internalSlots[row.styleSlot]
    const display = internalSlots[row.displaySlot]
    const {unit, numberFormatUnit} = row

    const nfOpts: NumberFormatOptions = Object.create(null)
    if (
      unit === 'seconds' ||
      unit === 'milliseconds' ||
      unit === 'microseconds'
    ) {
      let nextStyle
      if (unit === 'seconds') {
        nextStyle = internalSlots.milliseconds
      } else if (unit === 'milliseconds') {
        nextStyle = internalSlots.microseconds
      } else {
        nextStyle = internalSlots.nanoseconds
      }
      if (nextStyle === 'numeric') {
        if (unit === 'seconds') {
          value = value
            .plus(new BigDecimal(duration.milliseconds).div(1000))
            .plus(new BigDecimal(duration.microseconds).div(1_000_000))
            .plus(new BigDecimal(duration.nanoseconds).div(1_000_000_000))
        } else if (unit === 'milliseconds') {
          value = value
            .plus(new BigDecimal(duration.microseconds).div(1000))
            .plus(new BigDecimal(duration.nanoseconds).div(1_000_000))
        } else {
          value = value.plus(new BigDecimal(duration.nanoseconds).div(1000))
        }
        if (internalSlots.fractionalDigits === undefined) {
          nfOpts.maximumFractionDigits = 9
          nfOpts.minimumFractionDigits = 0
        } else {
          nfOpts.maximumFractionDigits = internalSlots.fractionalDigits
          nfOpts.minimumFractionDigits = internalSlots.fractionalDigits
        }
        nfOpts.roundingMode = 'trunc'
        done = true
      }
    }
    if (!value.isZero() || display !== 'auto') {
      nfOpts.numberingSystem = internalSlots.numberingSystem
      if (style === '2-digit') {
        nfOpts.minimumIntegerDigits = 2
      }
      if (style !== '2-digit' && style !== 'numeric') {
        nfOpts.style = 'unit'
        nfOpts.unit = numberFormatUnit
        nfOpts.unitDisplay = style
      }
      const nf = createMemoizedNumberFormat(
        internalSlots.locale,
        nfOpts as Intl.NumberFormatOptions
      )
      let list: DurationFormatPart[]
      if (!separated) {
        list = []
      } else {
        list = result[result.length - 1]
        list.push({
          type: 'literal',
          value: separator,
        })
      }
      let parts = nf.formatToParts(value.toString() as `${number}`)
      parts.forEach(({type, value}) => {
        list.push({
          type,
          value,
          unit: numberFormatUnit,
        })
      })
      if (!separated) {
        if (style === '2-digit' || style === 'numeric') {
          separated = true
        }
        result.push(list)
      }
    } else {
      separated = false
    }
  }
  const lfOpts: Intl.ListFormatOptions = Object.create(null)
  lfOpts.type = 'unit'
  let listStyle = internalSlots.style
  if (listStyle === 'digital') {
    listStyle = 'short'
  }
  lfOpts.style = listStyle
  const lf = createMemoizedListFormat(internalSlots.locale, lfOpts)
  const strings: string[] = []
  for (const parts of result) {
    let string = ''
    for (const {value} of parts) {
      string += value
    }
    strings.push(string)
  }
  let formatted = lf.formatToParts(strings)
  let resultIndex = 0
  let resultLength = result.length
  let flattened = []
  for (const {type, value} of formatted) {
    if (type === 'element') {
      invariant(resultIndex < resultLength, 'Index out of bounds')
      let parts = result[resultIndex]
      for (const part of parts) {
        flattened.push(part)
      }
      resultIndex++
    } else {
      invariant(type === 'literal', 'Type must be literal')
      flattened.push({
        type: 'literal',
        value,
      })
    }
  }
  return flattened
}
