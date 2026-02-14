import {
  type DateTimeFormat,
  type DateTimeFormatLocaleInternalData,
  type IntlDateTimeFormatInternal,
  type IntlDateTimeFormatPart,
  TimeClip,
  createMemoizedNumberFormat,
} from '@formatjs/ecma402-abstract'

import Decimal from 'decimal.js'
import {ToLocalTime, type ToLocalTimeImplDetails} from './ToLocalTime.js'
import {DATE_TIME_PROPS} from './utils.js'

function pad(n: number): string {
  if (n < 10) {
    return `0${n}`
  }
  return String(n)
}

function offsetToGmtString(
  gmtFormat: string,
  hourFormat: string,
  offsetInMs: number,
  style: 'long' | 'short'
) {
  const offsetInMinutes = Math.floor(offsetInMs / 60000)
  const mins = Math.abs(offsetInMinutes) % 60
  const hours = Math.floor(Math.abs(offsetInMinutes) / 60)
  const [positivePattern, negativePattern] = hourFormat.split(';')

  let offsetStr = ''
  let pattern = offsetInMs < 0 ? negativePattern : positivePattern
  if (style === 'long') {
    offsetStr = pattern
      .replace('HH', pad(hours))
      .replace('H', String(hours))
      .replace('mm', pad(mins))
      .replace('m', String(mins))
  } else if (mins || hours) {
    if (!mins) {
      pattern = pattern.replace(/:?m+/, '')
    }
    offsetStr = pattern.replace(/H+/, String(hours)).replace(/m+/, String(mins))
  }

  return gmtFormat.replace('{0}', offsetStr)
}

export interface FormatDateTimePatternImplDetails {
  getInternalSlots(
    dtf: Intl.DateTimeFormat | DateTimeFormat
  ): IntlDateTimeFormatInternal
  localeData: Record<string, DateTimeFormatLocaleInternalData>
  getDefaultTimeZone(): string
  // GH #4535: Track if we're formatting a range where dates differ
  // Used to avoid converting hour 0 to 24 in h24 format when it's midnight on a different date
  rangeFormatOptions?: {
    isDifferentDate?: boolean
  }
}

/**
 * https://tc39.es/ecma402/#sec-partitiondatetimepattern
 * @param dtf
 * @param x
 */
export function FormatDateTimePattern(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  patternParts: IntlDateTimeFormatPart[],
  x: Decimal,
  {
    getInternalSlots,
    localeData,
    getDefaultTimeZone,
    tzData,
    rangeFormatOptions,
  }: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): IntlDateTimeFormatPart[] {
  x = TimeClip(x)
  /** IMPL START */
  const internalSlots = getInternalSlots(dtf)
  const dataLocale = internalSlots.dataLocale
  const dataLocaleData = localeData[dataLocale]
  /** IMPL END */

  const locale = internalSlots.locale
  const nfOptions = Object.create(null)
  nfOptions.useGrouping = false

  const nf = createMemoizedNumberFormat(locale, nfOptions)
  const nf2Options = Object.create(null)
  nf2Options.minimumIntegerDigits = 2
  nf2Options.useGrouping = false
  const nf2 = createMemoizedNumberFormat(locale, nf2Options)
  const fractionalSecondDigits = internalSlots.fractionalSecondDigits
  let nf3: Intl.NumberFormat
  if (fractionalSecondDigits !== undefined) {
    const nf3Options = Object.create(null)
    nf3Options.minimumIntegerDigits = fractionalSecondDigits
    nf3Options.useGrouping = false
    nf3 = createMemoizedNumberFormat(locale, nf3Options)
  }
  const tm = ToLocalTime(
    x,
    // @ts-ignore
    internalSlots.calendar,
    internalSlots.timeZone,
    {tzData}
  )
  const result: Intl.DateTimeFormatPart[] = []

  // Check if month is stand-alone (no other date fields like day, year, weekday)
  const hasMonth = patternParts.some(part => part.type === 'month')
  const hasOtherDateFields = patternParts.some(
    part =>
      part.type === 'day' ||
      part.type === 'year' ||
      part.type === 'weekday' ||
      part.type === 'era'
  )
  const isMonthStandalone = hasMonth && !hasOtherDateFields

  for (const patternPart of patternParts) {
    const p = patternPart.type
    if (p === 'literal') {
      result.push({
        type: 'literal',
        value: patternPart.value!,
      })
    } else if (p === 'fractionalSecondDigits') {
      const v = new Decimal(tm.millisecond)
        .times(10)
        .pow((fractionalSecondDigits || 0) - 3)
        .floor()
        .toNumber()
      result.push({
        type: 'fractionalSecond',
        value: nf3!.format(v),
      })
    } else if (p === 'dayPeriod') {
      const f = internalSlots.dayPeriod
      // @ts-ignore
      const fv = tm[f]
      result.push({type: p, value: fv})
    } else if (p === 'timeZoneName') {
      const f = internalSlots.timeZoneName
      let fv
      const {timeZoneName, gmtFormat, hourFormat} = dataLocaleData
      const timeZone = internalSlots.timeZone || getDefaultTimeZone()
      const timeZoneData = timeZoneName[timeZone]
      if (timeZoneData && timeZoneData[f as 'short']) {
        const names = timeZoneData[f as 'short']!
        // GH #5114: If in DST and both standard/daylight names are the same,
        // fall back to GMT offset format (matches native browser behavior).
        // This handles locales where CLDR doesn't provide a daylight name.
        // NOTE: This is a formatjs implementation detail - ECMA-402 doesn't
        // explicitly specify behavior for missing DST names in locale data.
        if (tm.inDST && names.length >= 2 && names[0] === names[1]) {
          fv = offsetToGmtString(
            gmtFormat,
            hourFormat,
            tm.timeZoneOffset,
            f as 'long'
          )
        } else {
          fv = names[+tm.inDST]
        }
      } else {
        // Fallback to gmtFormat
        fv = offsetToGmtString(
          gmtFormat,
          hourFormat,
          tm.timeZoneOffset,
          f as 'long'
        )
      }
      result.push({type: p, value: fv})
    } else if (DATE_TIME_PROPS.indexOf(p as 'era') > -1) {
      let fv = ''
      const f = internalSlots[p as 'year'] as
        | 'numeric'
        | '2-digit'
        | 'narrow'
        | 'long'
        | 'short'
      // @ts-ignore
      let v = tm[p]
      if (p === 'year' && v <= 0) {
        v = 1 - v
      }
      if (p === 'month') {
        v++
      }
      const hourCycle = internalSlots.hourCycle
      if (p === 'hour' && (hourCycle === 'h11' || hourCycle === 'h12')) {
        v = v % 12
        if (v === 0 && hourCycle === 'h12') {
          v = 12
        }
      }
      // GH #4535: In h24 format, midnight handling depends on context.
      //
      // LDML Spec (UTS #35): The 'k' symbol (1-24) means 24:00 represents the END of day.
      // "Tuesday 24:00 = Wednesday 00:00" - they represent the same instant.
      // See: https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
      //
      // However, in date ranges, showing 24:00 can be semantically confusing:
      // - Different dates (May 3, 22:00 – May 4, 00:00): Show "00:00" on May 4
      //   because "May 4, 24:00" would actually mean May 5, 00:00
      // - Same date ranges (May 3, 00:00 – 00:45): Show "00:00" for clarity
      //   because the times are at the START of the day, not the end
      //
      // Only convert 0→24 in non-range single-date formatting where 24:00
      // conventionally means "end of day" (e.g., business closing time).
      //
      // Note: ICU4J's SimpleDateFormat always converts 0→24 for 'k' pattern.
      // Our approach is more contextually appropriate for range formatting.
      // See: https://github.com/unicode-org/icu/blob/main/icu4j/main/core/src/main/java/com/ibm/icu/text/SimpleDateFormat.java
      if (p === 'hour' && hourCycle === 'h24') {
        if (v === 0 && !rangeFormatOptions) {
          // Only convert 0 to 24 when NOT formatting a range (rangeFormatOptions is undefined)
          v = 24
        }
      }
      if (f === 'numeric') {
        fv = nf.format(v)
      } else if (f === '2-digit') {
        fv = nf2.format(v)
        if (fv.length > 2) {
          fv = fv.slice(fv.length - 2, fv.length)
        }
      } else if (f === 'narrow' || f === 'short' || f === 'long') {
        if (p === 'era') {
          fv = dataLocaleData[p][f][v as 'BC']
        } else if (p === 'month') {
          // Use stand-alone month form if available and month is displayed alone
          const monthData =
            isMonthStandalone && dataLocaleData.monthStandalone
              ? dataLocaleData.monthStandalone
              : dataLocaleData.month
          fv = monthData[f][v - 1]
        } else {
          fv = dataLocaleData[p as 'weekday'][f][v]
        }
      }
      result.push({
        type: p as Intl.DateTimeFormatPartTypes,
        value: fv,
      })
    } else if (p === 'ampm') {
      const v = tm.hour
      let fv
      if (v > 11) {
        fv = dataLocaleData.pm
      } else {
        fv = dataLocaleData.am
      }
      result.push({
        type: 'dayPeriod',
        value: fv,
      })
    } else if (p === 'relatedYear') {
      const v = tm.relatedYear
      // @ts-ignore
      const fv = nf.format(v)
      result.push({
        // @ts-ignore TODO: Fix TS type
        type: 'relatedYear',
        value: fv,
      })
    } else if (p === 'yearName') {
      const v = tm.yearName
      // @ts-ignore
      const fv = nf.format(v)
      result.push({
        // @ts-ignore TODO: Fix TS type
        type: 'yearName',
        value: fv,
      })
    }
  }
  return result
}
