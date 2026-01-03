import {
  type NumberFormatOptions,
  createMemoizedListFormat,
  createMemoizedNumberFormat,
  invariant,
} from '@formatjs/ecma402-abstract'
import {TABLE_2} from '../constants.js'
import {DurationFormat} from '../core.js'
import {getInternalSlots} from '../get_internal_slots.js'
import {type DurationFormatPart, type DurationRecord} from '../types.js'

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
    let value = duration[row.valueField]
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
          value +=
            duration.milliseconds / 1e3 +
            duration.microseconds / 1e6 +
            duration.nanoseconds / 1e9
        } else if (unit === 'milliseconds') {
          value += duration.microseconds / 1e3 + duration.nanoseconds / 1e6
        } else {
          value += duration.nanoseconds / 1e3
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
    if (value !== 0 || display !== 'auto') {
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
      let parts = nf.formatToParts(value)
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
