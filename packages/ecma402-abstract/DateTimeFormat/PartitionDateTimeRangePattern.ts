import {SameValue} from '#packages/ecma262-abstract/SameValue.js'
import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import {
  type IntlDateTimeFormatPart,
  type IntlDateTimeFormatPartType,
  RangePatternType,
  type RangePatterns,
  type TABLE_2,
} from '#packages/ecma402-abstract/types/date-time.js'
import {
  HandleDateTimeValue,
  isTemporalDateTimeValue,
  type DateTimeFormattable,
} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {
  FormatDateTimePattern,
  getDayPeriodName,
  type FormatDateTimePatternImplDetails,
} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {
  ToLocalTime,
  type ToLocalTimeImplDetails,
} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'

const TABLE_2_FIELDS: Array<TABLE_2> = [
  'era',
  'year',
  'month',
  'day',
  'ampm',
  'dayPeriod',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
]

export function PartitionDateTimeRangePattern(
  dtf: Intl.DateTimeFormat,
  x: DateTimeFormattable,
  y: DateTimeFormattable,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): IntlDateTimeFormatPart[] {
  const firstTemporal = isTemporalDateTimeValue(x)
  const secondTemporal = isTemporalDateTimeValue(y)
  if (
    firstTemporal !== secondTemporal ||
    (firstTemporal && secondTemporal && x.kind !== y.kind)
  ) {
    throw new TypeError('Range endpoints must have the same Temporal type')
  }
  const slots = implDetails.getInternalSlots(dtf)
  const first = HandleDateTimeValue(slots, x)
  const second = HandleDateTimeValue(slots, y)
  const internalSlots = first.format
  implDetails = {...implDetails, getInternalSlots: () => internalSlots}
  const {tzData, calendarData, localeData} = implDetails
  const dataLocale = internalSlots.dataLocale
  const rootLocaleData = localeData[dataLocale]
  const dataLocaleData =
    rootLocaleData.calendarData?.[internalSlots.calendar!] ?? rootLocaleData
  /** IMPL END */
  const tm1 = ToLocalTime(
    first.epochNanoseconds,
    // @ts-ignore
    internalSlots.calendar,
    first.isPlain ? '+00:00' : internalSlots.timeZone,
    {tzData, calendarData}
  )
  const tm2 = ToLocalTime(
    second.epochNanoseconds,
    // @ts-ignore
    internalSlots.calendar,
    first.isPlain ? '+00:00' : internalSlots.timeZone,
    {tzData, calendarData}
  )
  const {pattern, rangePatterns} = internalSlots
  const parts = PartitionPattern<IntlDateTimeFormatPartType>(pattern)
  let lastField = -1
  for (const part of parts) {
    const field =
      part.type === 'weekday'
        ? 'day'
        : part.type === 'relatedYear' || part.type === 'yearName'
          ? 'year'
          : part.type
    lastField = Math.max(lastField, TABLE_2_FIELDS.indexOf(field as TABLE_2))
  }

  const fallback: RangePatterns = rangePatterns.default || {
    patternParts: PartitionPattern<'0' | '1' | 'literal'>(
      dataLocaleData.intervalFormatFallback
    ).map(part => ({
      source:
        part.type === 'literal'
          ? RangePatternType.shared
          : part.type === '0'
            ? RangePatternType.startRange
            : RangePatternType.endRange,
      pattern: part.type === 'literal' ? part.value! : pattern,
    })),
  }

  // ECMA-402 §11.5.9, steps 15–16 compare relevant fields and collapse
  // equal ranges. Use fallback intervals through displayed precision;
  // smaller undisplayed fields must not make the endpoints differ.
  // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L1537-L1577
  let rangePattern: RangePatterns | undefined
  for (let index = 0; index <= lastField; index++) {
    const field = TABLE_2_FIELDS[index]
    let equal
    if (field === 'ampm') {
      // Step 15.d.ii: noon starts at hour 12, including an 11 AM endpoint.
      equal = tm1.hour < 12 === tm2.hour < 12
    } else if (field === 'dayPeriod') {
      const first = getDayPeriodName(
        dataLocaleData,
        tm1,
        internalSlots.dayPeriod
      )
      const second = getDayPeriodName(
        dataLocaleData,
        tm2,
        internalSlots.dayPeriod
      )
      equal = first === second
    } else if (field === 'fractionalSecondDigits') {
      const digits = internalSlots.fractionalSecondDigits ?? 3
      equal =
        Math.floor(tm1.millisecond * 10 ** (digits - 3)) ===
        Math.floor(tm2.millisecond * 10 ** (digits - 3))
    } else {
      equal = SameValue(tm1[field], tm2[field])
    }
    if (!equal) {
      // CLDR may provide an hour interval but no separate AM/PM interval.
      rangePattern =
        rangePatterns[field] ||
        (field === 'ampm' ? rangePatterns.hour : undefined) ||
        fallback
      break
    }
  }
  if (rangePattern === undefined) {
    const result = FormatDateTimePattern(
      dtf,
      parts,
      first.epochNanoseconds,
      first.isPlain,
      {
        ...implDetails,
        rangeFormatOptions: {localTime: tm1},
      }
    )
    for (const part of result) part.source = RangePatternType.shared
    return result
  }

  const result: IntlDateTimeFormatPart[] = []
  const contextParts = PartitionPattern<IntlDateTimeFormatPartType>(
    rangePattern.patternParts
      .map(part =>
        part.pattern === '{0}' || part.pattern === '{1}'
          ? pattern
          : part.pattern
      )
      .join('')
  )
  const rangeFormatOptions: NonNullable<
    FormatDateTimePatternImplDetails['rangeFormatOptions']
  > = {patternParts: contextParts}
  const rangeImplDetails = {...implDetails, rangeFormatOptions}
  for (const part of rangePattern.patternParts) {
    const {source} = part
    // Steps 19.a and 19.f use each pattern without changing locale data.
    // Resolve fallback placeholders per call; other formatters share records.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L1577-L1587
    const partPattern =
      part.pattern === '{0}' || part.pattern === '{1}' ? pattern : part.pattern
    if (!partPattern.includes('{')) {
      result.push({type: 'literal', value: partPattern, source})
      continue
    }
    const value =
      source === RangePatternType.endRange
        ? second.epochNanoseconds
        : first.epochNanoseconds
    rangeFormatOptions.localTime =
      source === RangePatternType.endRange ? tm2 : tm1
    const formatted = FormatDateTimePattern(
      dtf,
      PartitionPattern<IntlDateTimeFormatPartType>(partPattern),
      value,
      first.isPlain,
      rangeImplDetails
    )
    for (const item of formatted) {
      item.source = source
      result.push(item)
    }
  }
  return result
}
