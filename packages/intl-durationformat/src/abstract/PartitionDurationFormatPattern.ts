import {invariant} from '@formatjs/ecma402-abstract'
import {TABLE_2} from '../constants'
import {DurationFormat} from '../core'
import {getInternalSlots} from '../get_internal_slots'
import {DurationFormatPart, DurationRecord} from '../types'

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
  while (!done) {
    let nextStyle
    for (const row of TABLE_2) {
      let value = duration[row.valueField]
      const style = internalSlots[row.styleSlot]
      const display = internalSlots[row.displaySlot]
      const {unit, numberFormatUnit} = row
      const nfOpts = Object.create(null)
      if (
        unit === 'seconds' ||
        unit === 'milliseconds' ||
        unit === 'microseconds'
      ) {
        if (unit === 'seconds') {
          nextStyle = internalSlots.milliseconds
        } else if (unit === 'milliseconds') {
          nextStyle = internalSlots.microseconds
        } else {
          nextStyle = internalSlots.nanoseconds
        }
        if (nextStyle === 'numeric') {
          if (unit === 'seconds') {
            value = value +=
              duration.milliseconds / 1e3 +
              duration.microseconds / 1e6 +
              duration.nanoseconds / 1e9
          } else if (unit === 'milliseconds') {
            value = value +=
              duration.microseconds / 1e3 + duration.nanoseconds / 1e6
          } else {
            value = value += duration.nanoseconds / 1e3
          }
          if (internalSlots.fractionalDigits === undefined) {
            nfOpts.minimumFractionDigits = 0
            nfOpts.maximumFractionDigits = 9
          } else {
            nfOpts.minimumFractionDigits = internalSlots.fractionalDigits
            nfOpts.maximumFractionDigits = internalSlots.fractionalDigits
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
        const nf = new Intl.NumberFormat(internalSlots.locale, nfOpts)
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
        parts.forEach(part => {
          list.push({
            type: part.type,
            value: part.value,
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
  }
  const lfOpts = Object.create(null)
  lfOpts.type = 'unit'
  let listStyle = internalSlots.style
  if (listStyle === 'digital') {
    listStyle = 'short'
  }
  lfOpts.style = listStyle
  const lf = new Intl.ListFormat(internalSlots.locale, lfOpts)
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
