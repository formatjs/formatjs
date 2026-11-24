import {
  arrayEvery,
  mathAbs,
  mathTrunc,
  arrayIndexOf,
  arraySome,
  bigIntFrom,
  floor,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  type DateTimeFormat,
  type DateTimeFormatLocaleInternalData,
  type IntlDateTimeFormatInternal,
  type IntlDateTimeFormatPart,
  type RangePatterns,
} from '#packages/ecma402-abstract/types/date-time.js'
import {
  createMemoizedNumberFormatForConstructor,
  getNumberFormatIntrinsic,
} from '#packages/ecma402-abstract/utils.js'

import {
  ToLocalTime,
  type ToLocalTimeImplDetails,
} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'
import {
  calendarLocaleData,
  DATE_TIME_PROPS,
} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'

const apply = Reflect.apply
const find = Array.prototype.find
const stringSlice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number,
  end?: number
) => string
const stringIndexOf = Function.prototype.call.bind(
  String.prototype.indexOf
) as (value: string, search: string, position?: number) => number

// Locale data is a set of private Records, so absent fields stay absent.
// https://tc39.es/ecma402/#sec-intl.datetimeformat-internal-slots
function ownField<T extends object, K extends keyof T>(
  record: T | undefined,
  key: K
): T[K] | undefined {
  return record && HasOwnProperty(record, ToString(key))
    ? record[key]
    : undefined
}

// ECMA-402 §11.5.4 step 15.f.x.i uses the field value when its name is missing.
// https://tc39.es/ecma402/#sec-formatdatetimepattern
function localizedName<K extends string | number>(
  names: {[key in K]?: string},
  index: K,
  value: string | number
): string {
  return ownField(names, index) ?? ToString(value)
}

function insertLocaleValue(pattern: string, value: string): string {
  const index = stringIndexOf(pattern, '{0}')
  return index < 0
    ? pattern
    : stringSlice(pattern, 0, index) + value + stringSlice(pattern, index + 3)
}

export function getDayPeriodName(
  data: DateTimeFormatLocaleInternalData,
  time: {hour: number; minute: number; second: number; millisecond: number},
  width: 'narrow' | 'short' | 'long' = 'short',
  format?: Pick<
    Intl.DateTimeFormatOptions,
    'hour' | 'minute' | 'second' | 'fractionalSecondDigits'
  >
): string {
  const timed = ownField(format, 'hour') !== undefined
  const minute =
    timed && ownField(format, 'minute') === undefined ? 0 : time.minute
  const second =
    timed && ownField(format, 'second') === undefined ? 0 : time.second
  const millisecond =
    timed && ownField(format, 'fractionalSecondDigits') === undefined
      ? 0
      : time.millisecond
  const value = ((time.hour * 60 + minute) * 60 + second) * 1000 + millisecond
  const rules = ownField(data, 'dayPeriodRules') ?? []
  // Temporal comparison §15.6.8 steps 23.d.iii.1–2 use this locale policy.
  // ECMA-402 §11.5.4, step 15.d.iii selects the localized day period and width.
  // LDML variable-period rules 2-4, 8: inclusive start, exclusive end, wrap midnight.
  // https://tc39.es/ecma402/#sec-formatdatetimepattern
  // https://unicode.org/reports/tr35/tr35-dates.html#Variable_periods
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-dates.md#L1360-L1375
  const rule =
    apply(find, rules, [
      (rule: NonNullable<typeof rules>[number]) =>
        ownField(rule, 'at') === value,
    ]) ||
    apply(find, rules, [
      (rule: NonNullable<typeof rules>[number]) => {
        const from = ownField(rule, 'from')
        const before = ownField(rule, 'before')
        return (
          from !== undefined &&
          before !== undefined &&
          (from < before
            ? value >= from && value < before
            : value >= from || value < before)
        )
      },
    ])
  const names = ownField(ownField(data, 'dayPeriods'), width)
  return (
    (rule && ownField(names, rule.name)) || (time.hour < 12 ? data.am : data.pm)
  )
}

// ECMA-402 §11.5.4 step 15.e.iv uses the localized time-zone representation.
// LDML localized GMT formats use decimal digits and distinct short/long widths.
// https://tc39.es/ecma402/#sec-formatdatetimepattern
// https://unicode.org/reports/tr35/tr35-dates.html#Time_Zone_Format_Terminology
function offsetToGmtString(
  gmtFormat: string,
  hourFormat: string,
  offsetInMs: number,
  style: 'long' | 'short',
  {nf, nf2}: Pick<NumberFormatters, 'nf' | 'nf2'>
) {
  const absoluteSeconds = mathAbs(mathTrunc(offsetInMs / 1000))
  const seconds = absoluteSeconds % 60
  const mins = floor(absoluteSeconds / 60) % 60
  const hours = floor(absoluteSeconds / 3600)
  // CLDR hourFormat has positive;negative patterns. Keep only first two fields.
  const firstSeparator = stringIndexOf(hourFormat, ';')
  const secondSeparator =
    firstSeparator < 0 ? -1 : stringIndexOf(hourFormat, ';', firstSeparator + 1)
  const positivePattern =
    firstSeparator < 0 ? hourFormat : stringSlice(hourFormat, 0, firstSeparator)
  const negativePattern =
    firstSeparator < 0
      ? undefined
      : stringSlice(
          hourFormat,
          firstSeparator + 1,
          secondSeparator < 0 ? undefined : secondSeparator
        )

  const pattern = offsetInMs < 0 ? negativePattern : positivePattern
  if (!pattern || stringIndexOf(gmtFormat, '{0}') < 0) return undefined
  const hourStart = stringIndexOf(pattern, 'H')
  if (hourStart < 0) return undefined
  let hourEnd = hourStart + 1
  while (hourEnd < pattern.length && pattern[hourEnd] === 'H') hourEnd++
  const minuteStart = stringIndexOf(pattern, 'm')
  if (
    minuteStart < 0
      ? style === 'long' || mins !== 0 || seconds !== 0
      : minuteStart < hourEnd
  )
    return undefined
  const formatHours = style === 'long' ? nf2 : nf
  let offset = stringSlice(pattern, 0, hourStart) + formatHours(hours)
  if (minuteStart < 0) {
    offset += stringSlice(pattern, hourEnd)
  } else {
    let minuteEnd = minuteStart + 1
    while (minuteEnd < pattern.length && pattern[minuteEnd] === 'm') minuteEnd++
    const separator = stringSlice(pattern, hourEnd, minuteStart)
    if (style === 'long' || mins || seconds) offset += separator + nf2(mins)
    if (seconds) offset += separator + nf2(seconds)
    offset += stringSlice(pattern, minuteEnd)
  }

  const result = insertLocaleValue(gmtFormat, offset)
  if (
    stringIndexOf(result, '\u200e') < 0 &&
    stringIndexOf(result, '\u200f') < 0
  )
    return result
  let normalized = ''
  for (let index = 0; index < result.length; index++) {
    const char = result[index]
    normalized += char
    if (
      (char === '\u200e' || char === '\u200f') &&
      index + 1 < result.length &&
      result[index + 1] === char
    )
      index++
  }
  return normalized
}

// ECMA-402 §11.5.4, step 15.f.ix: preserve the final two code points.
export function lastTwoCodePoints(value: string): string {
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

type NumericFormat = (value: number) => string
const numericDescriptor = Object.getOwnPropertyDescriptor
const numericPrototype = Object.getPrototypeOf
const numericFormatGetters = new WeakMap<
  object,
  (this: Intl.NumberFormat) => NumericFormat
>()
const getNumericFormatGetter =
  numericFormatGetters.get.bind(numericFormatGetters)
const setNumericFormatGetter =
  numericFormatGetters.set.bind(numericFormatGetters)

function numericFormatGetter(Constructor: typeof Intl.NumberFormat) {
  let prototype = Constructor.prototype
  while (prototype !== null) {
    const cached = getNumericFormatGetter(prototype)
    if (cached) return cached
    const descriptor = numericDescriptor(prototype, 'format')
    const getter = descriptor && numericDescriptor(descriptor, 'get')?.value
    if (typeof getter === 'function') {
      setNumericFormatGetter(prototype, getter)
      return getter as (this: Intl.NumberFormat) => NumericFormat
    }
    prototype = numericPrototype(prototype)
  }
  return undefined
}
const initialNumericProvider = getNumberFormatIntrinsic()
if (typeof initialNumericProvider === 'function')
  numericFormatGetter(initialNumericProvider)

type NumberFormatters = {
  nf: NumericFormat
  nf2: NumericFormat
  nf3: NumericFormat | undefined
}
// Proposal comparison §15.6.4 steps2,6,11.b: private option records.
// https://tc39.es/proposal-temporal/#sec-formatdatetimepattern
const createOptions = Object.create
const numberFormattersCache = new WeakMap<
  IntlDateTimeFormatInternal,
  Pick<
    IntlDateTimeFormatInternal,
    'locale' | 'numberingSystem' | 'fractionalSecondDigits'
  > & {formatters: NumberFormatters}
>()
const getNumberFormatters = numberFormattersCache.get.bind(
  numberFormattersCache
)
const setNumberFormatters = numberFormattersCache.set.bind(
  numberFormattersCache
)

function createNumberFormatters(
  internalSlots: IntlDateTimeFormatInternal,
  fractionalSecondDigits: IntlDateTimeFormatInternal['fractionalSecondDigits'] = internalSlots.fractionalSecondDigits
): NumberFormatters {
  const {locale, numberingSystem} = internalSlots
  const cached = getNumberFormatters(internalSlots)
  if (
    cached &&
    cached.locale === locale &&
    cached.numberingSystem === numberingSystem &&
    cached.fractionalSecondDigits === fractionalSecondDigits
  )
    return cached.formatters
  // Comparison §15.6.4 steps5,10,11.f: preserve lazy supplied-provider selection.
  const NumberFormat = getNumberFormatIntrinsic()
  const createNumberFormat =
    createMemoizedNumberFormatForConstructor(NumberFormat)
  // Temporal comparison §15.6.4 steps16.c.iv,16.f.viii.1,16.f.ix.1,16.h.ii:
  // FormatNumeric uses the selected provider's intrinsic bound format getter.
  const formatGetter = numericFormatGetter(NumberFormat)!
  const boundFormat = (formatter: Intl.NumberFormat): NumericFormat =>
    apply(formatGetter, formatter, [])
  const nfOptions = createOptions(null)
  nfOptions.numberingSystem = internalSlots.numberingSystem
  nfOptions.useGrouping = false

  const nf = boundFormat(createNumberFormat(locale, nfOptions))
  const nf2Options = createOptions(null)
  nf2Options.minimumIntegerDigits = 2
  nf2Options.numberingSystem = internalSlots.numberingSystem
  nf2Options.useGrouping = false
  const nf2 = boundFormat(createNumberFormat(locale, nf2Options))
  let nf3: NumericFormat | undefined
  if (fractionalSecondDigits !== undefined) {
    const nf3Options = createOptions(null)
    nf3Options.minimumIntegerDigits = fractionalSecondDigits
    nf3Options.numberingSystem = internalSlots.numberingSystem
    nf3Options.useGrouping = false
    nf3 = boundFormat(createNumberFormat(locale, nf3Options))
  }
  const formatters = {nf, nf2, nf3}
  setNumberFormatters(internalSlots, {
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
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): IntlDateTimeFormatPart[] {
  /** IMPL START */
  const {
    getInternalSlots,
    localeData,
    getDefaultTimeZone,
    tzData,
    calendarData,
  } = implDetails
  const internalSlots = getInternalSlots(dtf)
  // ECMA-402 §11.5.4 formats the selected record. §11.5.8 step 19.e
  // supplies the range record, which exists only for range formatting.
  // https://tc39.es/ecma402/#sec-formatdatetimepattern
  // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
  const rangeFormatOptions = ownField(implDetails, 'rangeFormatOptions')
  const format = ownField(rangeFormatOptions, 'format')
  const dataLocale = internalSlots.dataLocale
  const dataLocaleData = calendarLocaleData(
    localeData[dataLocale],
    internalSlots.calendar
  )
  /** IMPL END */

  // ECMA-402 §11.5.4, steps 1-11 use identical NumberFormat options for
  // every call with this profile. Retain the existing memoized formatters.
  // https://tc39.es/ecma402/#sec-formatdatetimepattern
  // Optional precision comes from own fields of the private format records.
  const fractionalSecondDigits =
    ownField(format, 'fractionalSecondDigits') ??
    ownField(internalSlots, 'fractionalSecondDigits')
  const numberFormatters =
    ownField(rangeFormatOptions, 'numberFormatters') ??
    createNumberFormatters(internalSlots, fractionalSecondDigits)
  if (rangeFormatOptions)
    setDataProperty(rangeFormatOptions, 'numberFormatters', numberFormatters)
  const {nf, nf2, nf3} = numberFormatters
  // ECMA-402 §11.5.4, step 12: reuse the identical endpoint conversion from
  // PartitionDateTimeRangePattern (§11.5.8) within this call.
  // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
  // https://tc39.es/ecma402/#sec-formatdatetimepattern
  const tm =
    ownField(rangeFormatOptions, 'localTime') ??
    ToLocalTime(
      epochNanoseconds,
      // @ts-ignore
      internalSlots.calendar,
      isPlain
        ? '+00:00'
        : (internalSlots.dataTimeZone ?? internalSlots.timeZone),
      {tzData, calendarData}
    )
  // Temporal comparison §15.6.8 step 24.a uses this fresh List for collapse.
  const result: Intl.DateTimeFormatPart[] = []

  // Check if month is stand-alone (no other date fields like day, year, weekday)
  // Month grammar depends on the complete date pattern, including shared fields.
  // ECMA-402 §11.5.4, step 15.f.x: https://tc39.es/ecma402/#sec-formatdatetimepattern
  const contextParts =
    ownField(rangeFormatOptions, 'patternParts') ?? patternParts
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
  // Private range records and own selected-format flags carry CLDR grammar.
  // ECMA-402 §11.5.4 step 15.f.x uses the resulting localized field string.
  const primaryFormat = internalSlots.format
  const isMonthStandalone =
    ownField(format, 'monthStandalone') ??
    ownField(primaryFormat, 'monthStandalone') ??
    (hasMonth && !hasOtherDateFields)
  // Weekday is stand-alone only when it is the sole field, as in the CLDR `E`
  // skeleton (`ccc`). With a day or a time it keeps the format form (`Ed`, `EHm`).
  // https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
  const isWeekdayStandalone =
    ownField(format, 'weekdayStandalone') ??
    ownField(primaryFormat, 'weekdayStandalone') ??
    (arraySome(contextParts, part => part.type === 'weekday') &&
      arrayEvery(
        contextParts,
        part => part.type === 'weekday' || part.type === 'literal'
      ))

  for (let index = 0; index < patternParts.length; index++) {
    const patternPart = patternParts[index]
    const p = patternPart.type
    if (p === 'literal') {
      // ECMA-402 §11.5.4 step 15.b preserves the CLDR literal verbatim.
      // The pinned hanidec test expects ASCII space before AM. CLDR uses U+202F.
      // https://github.com/tc39/test262/blob/2a1ade303f72d3de80565c921d685222405c32ce/test/intl402/DateTimeFormat/prototype/format/numbering-system.js#L26
      // https://tc39.es/ecma402/#sec-formatdatetimepattern
      setDataProperty(result, `${result.length}`, {
        type: 'literal',
        value: patternPart.value!,
      })
    } else if (p === 'fractionalSecondDigits') {
      // ECMA-402 §11.5.4 step 15.c truncates and formats local milliseconds.
      const v = floor(
        tm.millisecond / 10 ** (3 - (fractionalSecondDigits || 0))
      )
      setDataProperty(result, `${result.length}`, {
        type: 'fractionalSecond',
        value: nf3!(v),
      })
    } else if (p === 'dayPeriod') {
      setDataProperty(result, `${result.length}`, {
        type: p,
        value: getDayPeriodName(
          dataLocaleData,
          tm,
          ownField(format, 'dayPeriod') ?? internalSlots.dayPeriod,
          format ? {...internalSlots, ...format} : internalSlots
        ),
      })
    } else if (p === 'timeZoneName') {
      const f = ownField(format, 'timeZoneName') ?? internalSlots.timeZoneName
      const {timeZoneName, gmtFormat, hourFormat} = dataLocaleData
      const timeZone =
        internalSlots.dataTimeZone ??
        (internalSlots.timeZone || getDefaultTimeZone())
      const zoneNames = ownField(timeZoneName, timeZone)
      // ICU metazone name data starts at 1970; UTC names are invariant.
      const timeZoneData =
        epochNanoseconds >= bigIntFrom(0) || timeZone === 'UTC'
          ? zoneNames
          : undefined
      const specific =
        f === 'long'
          ? ownField(zoneNames, tm.inDST ? 'longDaylight' : 'longStandard')
          : f === 'short'
            ? ownField(zoneNames, tm.inDST ? 'shortDaylight' : 'shortStandard')
            : undefined
      const generic =
        f === 'shortGeneric' || f === 'longGeneric'
          ? ownField(timeZoneData, f)
          : undefined
      const names =
        f === 'short' || f === 'long' ? ownField(timeZoneData, f) : undefined
      // GH #5114: Identical standard/daylight names leave DST without a label.
      const name =
        specific ||
        generic ||
        (names && !(tm.inDST && names[0] === names[1])
          ? names[+tm.inDST]
          : undefined)
      // ECMA-402 §11.5.4 step 15.e.iv falls back to [[TimeZone]].
      // https://tc39.es/ecma402/#sec-formatdatetimepattern
      const value =
        name ||
        (offsetToGmtString(
          gmtFormat,
          hourFormat,
          tm.timeZoneOffset,
          f === 'long' || f === 'longGeneric' || f === 'longOffset'
            ? 'long'
            : 'short',
          numberFormatters
        ) ??
          internalSlots.timeZone ??
          timeZone)
      setDataProperty(result, `${result.length}`, {type: p, value})
    } else if (arrayIndexOf(DATE_TIME_PROPS, p as 'era') > -1) {
      let fv = ''
      let f = (ownField(format, p as 'year') ?? internalSlots[p as 'year']) as
        | 'numeric'
        | '2-digit'
        | 'narrow'
        | 'long'
        | 'short'
      // @ts-ignore
      let v = tm[p]
      // ECMA-402 §11.5.4 step 15.f.iv applies to every calendar.
      if (p === 'year' && v <= 0) {
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
        fv = nf(v)
      } else if (f === '2-digit') {
        fv = nf2(v)
        if (fv.length > 2) {
          // ECMA-402 §11.5.4, steps 15.f.ix.2–4: keep the last two code points.
          // https://tc39.es/ecma402/#sec-formatdatetimepattern
          fv = lastTwoCodePoints(fv)
        }
      } else if (f === 'narrow' || f === 'short' || f === 'long') {
        if (p === 'era') {
          fv = localizedName(dataLocaleData[p][f], v as string, v)
        } else if (p === 'month') {
          // ECMA-402 §11.5.4 step 15.f.x reads the available locale fields.
          const monthData =
            (isMonthStandalone
              ? ownField(dataLocaleData, 'monthStandalone')
              : undefined) ?? dataLocaleData.month
          fv = localizedName(monthData[f], tm.monthNameIndex ?? v - 1, v)
        } else {
          const weekdayData =
            (p === 'weekday' && isWeekdayStandalone
              ? ownField(dataLocaleData, 'weekdayStandalone')
              : undefined) ?? dataLocaleData[p as 'weekday']
          fv = localizedName(weekdayData[f], v as number, v)
        }
      }
      const leapPatterns =
        p === 'month' && tm.leapMonth
          ? ownField(dataLocaleData, 'leapMonthPatterns')
          : undefined
      if (leapPatterns) {
        const leapPattern =
          f === 'numeric' || f === '2-digit'
            ? leapPatterns.numeric
            : (isMonthStandalone
                ? leapPatterns.standalone
                : leapPatterns.format
              )[f]
        fv = insertLocaleValue(leapPattern, fv)
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
      const fv = nf(v)
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
