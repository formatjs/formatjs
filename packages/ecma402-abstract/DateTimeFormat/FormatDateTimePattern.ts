import {
  arrayEvery,
  arrayIndexOf,
  arraySome,
  bigIntFrom,
  floor,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  type DateTimeFormat,
  type DateTimeFormatLocaleInternalData,
  type IntlDateTimeFormatInternal,
  type IntlDateTimeFormatPart,
  type RangePatterns,
} from '#packages/ecma402-abstract/types/date-time.js'
import {createMemoizedNumberFormat} from '#packages/ecma402-abstract/utils.js'

import {
  ToLocalTime,
  type ToLocalTimeImplDetails,
} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'
import {DATE_TIME_PROPS} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'

export function getDayPeriodName(
  data: DateTimeFormatLocaleInternalData,
  time: {hour: number; minute: number; second: number; millisecond: number},
  width: 'narrow' | 'short' | 'long' = 'short',
  format?: Pick<
    Intl.DateTimeFormatOptions,
    'hour' | 'minute' | 'second' | 'fractionalSecondDigits'
  >
): string {
  const timed = format?.hour !== undefined
  const minute = timed && format.minute === undefined ? 0 : time.minute
  const second = timed && format.second === undefined ? 0 : time.second
  const millisecond =
    timed && format.fractionalSecondDigits === undefined ? 0 : time.millisecond
  const value = ((time.hour * 60 + minute) * 60 + second) * 1000 + millisecond
  const rules = data.dayPeriodRules || []
  // ECMA-402 §11.5.4, step 15.d.iii selects the localized day period and width.
  // LDML variable-period rules 2-4, 8: inclusive start, exclusive end, wrap midnight.
  // https://tc39.es/ecma402/#sec-formatdatetimepattern
  // https://unicode.org/reports/tr35/tr35-dates.html#Variable_periods
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-dates.md#L1360-L1375
  const rule =
    rules.find(rule => rule.at === value) ||
    rules.find(
      rule =>
        rule.from !== undefined &&
        rule.before !== undefined &&
        (rule.from < rule.before
          ? value >= rule.from && value < rule.before
          : value >= rule.from || value < rule.before)
    )
  return (
    (rule && data.dayPeriods?.[width][rule.name]) ||
    (time.hour < 12 ? data.am : data.pm)
  )
}

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
  const absoluteSeconds = Math.abs(Math.trunc(offsetInMs / 1000))
  const seconds = absoluteSeconds % 60
  const mins = Math.floor(absoluteSeconds / 60) % 60
  const hours = Math.floor(absoluteSeconds / 3600)
  const [positivePattern, negativePattern] = hourFormat.split(';')

  let offsetStr = ''
  let pattern = offsetInMs < 0 ? negativePattern : positivePattern
  if (seconds) {
    const separator = /H+([^Hm]*)m+/.exec(pattern)?.[1] ?? ':'
    pattern = pattern.replace(/m+/, match => match + separator + 'ss')
  }
  if (style === 'long') {
    offsetStr = pattern
      .replace('HH', pad(hours))
      .replace('H', String(hours))
      .replace('mm', pad(mins))
      .replace('m', String(mins))
      .replace('ss', pad(seconds))
  } else {
    if (!mins && !seconds) {
      const start = pattern.indexOf('m')
      if (start >= 0) {
        let end = start
        while (pattern[end] === 'm') end++
        pattern =
          pattern.slice(0, pattern.lastIndexOf('H') + 1) + pattern.slice(end)
      }
    }
    offsetStr = pattern
      .replace(/H+/, String(hours))
      .replace(/m+/, pad(mins))
      .replace(/s+/, pad(seconds))
  }

  return gmtFormat
    .replace('{0}', offsetStr)
    .replaceAll('\u200e\u200e', '\u200e')
    .replaceAll('\u200f\u200f', '\u200f')
}

// ECMA-402 §11.5.4, step 15.f.ix: preserve the final two code points.
function lastTwoCodePoints(value: string): string {
  let start = value.length
  for (let count = 0; count < 2 && start > 0; count++) {
    start--
    if (
      value[start] >= '\udc00' &&
      value[start] <= '\udfff' &&
      start > 0 &&
      value[start - 1] >= '\ud800' &&
      value[start - 1] <= '\udbff'
    )
      start--
  }
  let result = ''
  for (let index = start; index < value.length; index++) result += value[index]
  return result
}

export interface FormatDateTimePatternImplDetails {
  getInternalSlots(
    dtf: Intl.DateTimeFormat | DateTimeFormat
  ): IntlDateTimeFormatInternal
  localeData: Record<string, DateTimeFormatLocaleInternalData>
  getDefaultTimeZone(): string
  // Preserve the complete pattern when formatting one range record.
  rangeFormatOptions?: {
    format?: RangePatterns
    patternParts?: IntlDateTimeFormatPart[]
    localTime?: ReturnType<typeof ToLocalTime>
    numberFormatters?: ReturnType<typeof createNumberFormatters>
  }
}

type NumberFormatters = {
  nf: Intl.NumberFormat
  nf2: Intl.NumberFormat
  nf3: Intl.NumberFormat | undefined
}
const numberFormattersCache = new WeakMap<
  IntlDateTimeFormatInternal,
  Pick<
    IntlDateTimeFormatInternal,
    'locale' | 'numberingSystem' | 'fractionalSecondDigits'
  > & {formatters: NumberFormatters}
>()

function createNumberFormatters(
  internalSlots: IntlDateTimeFormatInternal,
  fractionalSecondDigits: IntlDateTimeFormatInternal['fractionalSecondDigits'] = internalSlots.fractionalSecondDigits
): NumberFormatters {
  const {locale, numberingSystem} = internalSlots
  const cached = numberFormattersCache.get(internalSlots)
  if (
    cached &&
    cached.locale === locale &&
    cached.numberingSystem === numberingSystem &&
    cached.fractionalSecondDigits === fractionalSecondDigits
  )
    return cached.formatters
  const nfOptions = Object.create(null)
  nfOptions.numberingSystem = internalSlots.numberingSystem
  nfOptions.useGrouping = false

  const nf = createMemoizedNumberFormat(locale, nfOptions)
  const nf2Options = Object.create(null)
  nf2Options.minimumIntegerDigits = 2
  nf2Options.numberingSystem = internalSlots.numberingSystem
  nf2Options.useGrouping = false
  const nf2 = createMemoizedNumberFormat(locale, nf2Options)
  let nf3: Intl.NumberFormat | undefined
  if (fractionalSecondDigits !== undefined) {
    const nf3Options = Object.create(null)
    nf3Options.minimumIntegerDigits = fractionalSecondDigits
    nf3Options.numberingSystem = internalSlots.numberingSystem
    nf3Options.useGrouping = false
    nf3 = createMemoizedNumberFormat(locale, nf3Options)
  }
  const formatters = {nf, nf2, nf3}
  numberFormattersCache.set(internalSlots, {
    locale,
    numberingSystem,
    fractionalSecondDigits,
    formatters,
  })
  return formatters
}

/** ECMA-402 §11.5.4. Receives already partitioned private pattern records. */
export function FormatDateTimePattern(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  patternParts: IntlDateTimeFormatPart[],
  epochNanoseconds: bigint,
  isPlain: boolean,
  {
    getInternalSlots,
    localeData,
    getDefaultTimeZone,
    tzData,
    calendarData,
    rangeFormatOptions,
  }: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): IntlDateTimeFormatPart[] {
  /** IMPL START */
  const internalSlots = getInternalSlots(dtf)
  const format = rangeFormatOptions?.format
  const dataLocale = internalSlots.dataLocale
  const rootLocaleData = localeData[dataLocale]
  const dataLocaleData =
    rootLocaleData.calendarData?.[internalSlots.calendar!] ?? rootLocaleData
  /** IMPL END */

  // ECMA-402 §11.5.4, steps 1-11 use identical NumberFormat options for
  // every call with this profile. Retain the existing memoized formatters.
  // https://tc39.es/ecma402/#sec-formatdatetimepattern
  const fractionalSecondDigits =
    format?.fractionalSecondDigits ?? internalSlots.fractionalSecondDigits
  const numberFormatters =
    rangeFormatOptions?.numberFormatters ||
    createNumberFormatters(internalSlots, fractionalSecondDigits)
  if (rangeFormatOptions) rangeFormatOptions.numberFormatters = numberFormatters
  const {nf, nf2, nf3} = numberFormatters
  // ECMA-402 §11.5.4, step 12: reuse the identical endpoint conversion from
  // PartitionDateTimeRangePattern (§11.5.8) within this call.
  // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
  // https://tc39.es/ecma402/#sec-formatdatetimepattern
  const tm =
    rangeFormatOptions?.localTime ??
    ToLocalTime(
      epochNanoseconds,
      // @ts-ignore
      internalSlots.calendar,
      isPlain
        ? '+00:00'
        : (internalSlots.dataTimeZone ?? internalSlots.timeZone),
      {tzData, calendarData}
    )
  const result: Intl.DateTimeFormatPart[] = []

  // Check if month is stand-alone (no other date fields like day, year, weekday)
  // Month grammar depends on the complete date pattern, including shared fields.
  // ECMA-402 §11.5.4, step 15.f.x: https://tc39.es/ecma402/#sec-formatdatetimepattern
  const contextParts = rangeFormatOptions?.patternParts || patternParts
  const hasMonth = arraySome(contextParts, part => part.type === 'month')
  const hasOtherDateFields = arraySome(
    contextParts,
    part =>
      part.type === 'day' ||
      part.type === 'year' ||
      part.type === 'relatedYear' ||
      part.type === 'yearName' ||
      part.type === 'weekday' ||
      part.type === 'era'
  )
  const isMonthStandalone =
    format?.monthStandalone ??
    internalSlots.format?.monthStandalone ??
    (hasMonth && !hasOtherDateFields)
  // Weekday is stand-alone only when it is the sole field, as in the CLDR `E`
  // skeleton (`ccc`). With a day or a time it keeps the format form (`Ed`, `EHm`).
  // https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
  const isWeekdayStandalone =
    format?.weekdayStandalone ??
    internalSlots.format?.weekdayStandalone ??
    (arraySome(contextParts, part => part.type === 'weekday') &&
      arrayEvery(
        contextParts,
        part => part.type === 'weekday' || part.type === 'literal'
      ))

  for (let index = 0; index < patternParts.length; index++) {
    const patternPart = patternParts[index]
    const p = patternPart.type
    if (p === 'literal') {
      setDataProperty(result, `${result.length}`, {
        type: 'literal',
        value: patternPart.value!,
      })
    } else if (p === 'fractionalSecondDigits') {
      const v = floor(
        tm.millisecond / 10 ** (3 - (fractionalSecondDigits || 0))
      )
      setDataProperty(result, `${result.length}`, {
        type: 'fractionalSecond',
        value: nf3!.format(v),
      })
    } else if (p === 'dayPeriod') {
      setDataProperty(result, `${result.length}`, {
        type: p,
        value: getDayPeriodName(
          dataLocaleData,
          tm,
          format?.dayPeriod ?? internalSlots.dayPeriod,
          format ? {...internalSlots, ...format} : internalSlots
        ),
      })
    } else if (p === 'timeZoneName') {
      const f = format?.timeZoneName ?? internalSlots.timeZoneName
      let fv
      const {timeZoneName, gmtFormat, hourFormat} = dataLocaleData
      const timeZone =
        internalSlots.dataTimeZone ??
        (internalSlots.timeZone || getDefaultTimeZone())
      // ICU metazone name data starts at 1970; UTC names are invariant.
      const timeZoneData =
        epochNanoseconds >= bigIntFrom(0) || timeZone === 'UTC'
          ? timeZoneName[timeZone]
          : undefined
      const zoneNames = timeZoneName[timeZone]
      const specific =
        f === 'long'
          ? zoneNames?.[tm.inDST ? 'longDaylight' : 'longStandard']
          : f === 'short'
            ? zoneNames?.[tm.inDST ? 'shortDaylight' : 'shortStandard']
            : undefined
      if (specific) {
        fv = specific
      } else if (f === 'shortGeneric' || f === 'longGeneric') {
        fv =
          timeZoneData?.[f] ||
          offsetToGmtString(
            gmtFormat,
            hourFormat,
            tm.timeZoneOffset,
            f === 'longGeneric' ? 'long' : 'short'
          )
      } else if ((f === 'short' || f === 'long') && timeZoneData?.[f]) {
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
          f === 'long' || f === 'longOffset' ? 'long' : 'short'
        )
      }
      setDataProperty(result, `${result.length}`, {type: p, value: fv})
    } else if (arrayIndexOf(DATE_TIME_PROPS, p as 'era') > -1) {
      let fv = ''
      let f = (format?.[p as 'year'] ?? internalSlots[p as 'year']) as
        | 'numeric'
        | '2-digit'
        | 'narrow'
        | 'long'
        | 'short'
      // @ts-ignore
      let v = tm[p]
      if (
        p === 'year' &&
        v <= 0 &&
        (internalSlots.calendar === 'gregory' ||
          internalSlots.calendar === 'iso8601')
      ) {
        v = 1 - v
      }
      if (p === 'month') {
        v = (tm.monthNumber ?? v) + 1
      }
      const hourCycle = internalSlots.hourCycle
      if (p === 'hour' && (hourCycle === 'h11' || hourCycle === 'h12')) {
        v = v % 12
        if (v === 0 && hourCycle === 'h12') {
          v = 12
        }
      }
      // ECMA-402 §11.5.4, step 15.f.vii.1 applies to single dates and ranges.
      // https://tc39.es/ecma402/#sec-formatdatetimepattern
      if (p === 'hour' && hourCycle === 'h24' && v === 0) {
        v = 24
      }
      if (f === 'numeric') {
        fv = nf.format(v)
      } else if (f === '2-digit') {
        fv = nf2.format(v)
        if (fv.length > 2) {
          // ECMA-402 §11.5.4, steps 15.f.ix.2–4: keep the last two code points.
          // https://tc39.es/ecma402/#sec-formatdatetimepattern
          fv = lastTwoCodePoints(fv)
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
          fv = monthData[f][tm.monthNameIndex ?? v - 1]
        } else {
          // Use stand-alone weekday form if available and weekday is displayed alone
          const weekdayData =
            p === 'weekday' &&
            isWeekdayStandalone &&
            dataLocaleData.weekdayStandalone
              ? dataLocaleData.weekdayStandalone
              : dataLocaleData[p as 'weekday']
          fv = weekdayData[f][v]
        }
      }
      if (p === 'month' && tm.leapMonth && dataLocaleData.leapMonthPatterns) {
        const patterns = dataLocaleData.leapMonthPatterns
        const leapPattern =
          f === 'numeric' || f === '2-digit'
            ? patterns.numeric
            : (isMonthStandalone ? patterns.standalone : patterns.format)[f]
        fv = leapPattern.replace('{0}', fv)
      }
      setDataProperty(result, `${result.length}`, {
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
      setDataProperty(result, `${result.length}`, {
        type: 'dayPeriod',
        value: fv,
      })
    } else if (p === 'relatedYear') {
      const v = tm.relatedYear
      // @ts-ignore
      const fv = nf.format(v)
      setDataProperty(result, `${result.length}`, {
        // @ts-ignore TODO: Fix TS type
        type: 'relatedYear',
        value: fv,
      })
    } else if (p === 'yearName') {
      const v = tm.yearName
      // @ts-ignore
      const fv = dataLocaleData.yearNames![v!]
      setDataProperty(result, `${result.length}`, {
        // @ts-ignore TODO: Fix TS type
        type: 'yearName',
        value: fv,
      })
    } else {
      // ECMA-402 §11.5.4, step 15.j: ILND fallback for an unknown field.
      setDataProperty(result, `${result.length}`, {
        type: 'unknown',
        value: `${p}:${epochNanoseconds}`,
      })
    }
  }
  return result
}
