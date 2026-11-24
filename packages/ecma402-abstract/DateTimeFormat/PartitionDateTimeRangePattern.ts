import {
  TypeErrorConstructor,
  arrayIndexOf,
  arraySome,
  floor,
  mathMax,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
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
import {expandFallbackRangePattern} from '#packages/ecma402-abstract/DateTimeFormat/skeleton.js'
import {calendarLocaleData} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'

// ECMA-402 §11.5.8 step 15 follows Table 6. The default row is fallback only.
// https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
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

const DATE_FIELDS = [
  '{era}',
  '{year}',
  '{relatedYear}',
  '{yearName}',
  '{month}',
  '{day}',
  '{weekday}',
]
const stringIncludes = Function.prototype.call.bind(
  String.prototype.includes
) as (value: string, search: string) => boolean

function expandRangePattern(
  parts: RangePatterns['patternParts'],
  pattern: string
): string {
  // ECMA-402 §11.5.8 steps 19.a–b: read the private pattern records in order.
  let expanded = ''
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index].pattern
    expanded += part === '{0}' || part === '{1}' ? pattern : part
  }
  return expanded
}

export function PartitionDateTimeRangePattern(
  dtf: Intl.DateTimeFormat,
  x: DateTimeFormattable,
  y: DateTimeFormattable,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): IntlDateTimeFormatPart[] {
  // Temporal §15.6.8 step 7 rejects mismatched Temporal endpoint types.
  // https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern
  // §15.6.13 steps 1–7 compare the types identified by their internal slots.
  // https://tc39.es/proposal-temporal/#sec-temporal-sametemporaltype
  const firstTemporal = isTemporalDateTimeValue(x)
  const secondTemporal = isTemporalDateTimeValue(y)
  if (
    firstTemporal !== secondTemporal ||
    (firstTemporal && secondTemporal && x.kind !== y.kind)
  ) {
    throw new TypeErrorConstructor(
      'Range endpoints must have the same Temporal type'
    )
  }
  const slots = implDetails.getInternalSlots(dtf)
  // ECMA-402 §11.5.8 steps 1–6 clip both endpoints and convert them to nanoseconds.
  // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
  const first = HandleDateTimeValue(slots, x)
  const second = HandleDateTimeValue(slots, y)
  // ECMA-402 §11.5.8 steps 9–11 use the selected format and hour cycle.
  // Temporal §15.6.8 steps 15–16 require both endpoints to use the same format.
  // https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern
  const internalSlots = first.format
  implDetails = {...implDetails, getInternalSlots: () => internalSlots}
  const {tzData, calendarData, localeData} = implDetails
  const dataLocale = internalSlots.dataLocale
  const dataLocaleData = calendarLocaleData(
    localeData[dataLocale],
    internalSlots.calendar
  )
  /** IMPL END */
  // §15.6.8 steps 12–13 use the formatter zone. §15.6.4 step 12 renders
  // Plain values in UTC. Compare in UTC too to preserve distinct wall times.
  // https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern
  const tm1 = ToLocalTime(
    first.epochNanoseconds,
    // @ts-ignore
    internalSlots.calendar,
    first.isPlain
      ? '+00:00'
      : (internalSlots.dataTimeZone ?? internalSlots.timeZone),
    {tzData, calendarData}
  )
  const tm2 = ToLocalTime(
    second.epochNanoseconds,
    // @ts-ignore
    internalSlots.calendar,
    first.isPlain
      ? '+00:00'
      : (internalSlots.dataTimeZone ?? internalSlots.timeZone),
    {tzData, calendarData}
  )
  const {pattern, rangePatterns} = internalSlots
  const parts = PartitionPattern<IntlDateTimeFormatPartType>(pattern)
  let lastField = -1
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    const field =
      part.type === 'weekday'
        ? 'day'
        : part.type === 'relatedYear' || part.type === 'yearName'
          ? 'year'
          : part.type
    lastField = mathMax(
      lastField,
      arrayIndexOf(TABLE_2_FIELDS, field as TABLE_2)
    )
  }

  // ECMA-402 §11.5.8, steps 15–16 compare relevant fields and collapse
  // equal ranges. Use fallback intervals through displayed precision;
  // smaller undisplayed fields must not make the endpoints differ.
  // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
  let differentField: TABLE_2 | undefined
  for (let index = 0; index <= lastField; index++) {
    const field = TABLE_2_FIELDS[index]
    // Temporal amendment §15.6.8 steps 23.c–d.i: keep scanning displayed fields
    // past absent period fields. An equal date prefix can still hide unequal seconds.
    // https://tc39.es/proposal-temporal/#sec-partitiondatetimerangepattern
    if (
      (field === 'ampm' || field === 'dayPeriod') &&
      !arraySome(parts, part => part.type === field)
    ) {
      continue
    }
    let equal
    // Temporal comparison §15.6.8 steps 23.d.ii, 23.d.iii, 23.d.iv and 23.d.v
    // dispatch the encountered field by its private table key.
    if (field === 'ampm') {
      // Step 15.d.ii: noon starts at hour 12, including an 11 AM endpoint.
      // Temporal comparison §15.6.8 steps 23.d.ii.1–2 encode am/pm as Booleans.
      equal = tm1.hour < 12 === tm2.hour < 12
    } else if (field === 'dayPeriod') {
      // ECMA-402 §11.5.8 step 15.d.iii compares localized day periods.
      // Stand-alone periods still compare even when there is no hour field.
      const first = getDayPeriodName(
        dataLocaleData,
        tm1,
        internalSlots.dayPeriod,
        internalSlots
      )
      const second = getDayPeriodName(
        dataLocaleData,
        tm2,
        internalSlots.dayPeriod,
        internalSlots
      )
      equal = first === second
    } else if (field === 'fractionalSecondDigits') {
      // Temporal comparison §15.6.8 step 23.d.iv.1 uses the requested
      // precision carried unchanged into this selected format.
      // ECMA-402 §11.5.8 steps 15.d.iv.3–5: floor at the selected precision.
      // Temporal comparison §15.6.8 steps 23.d.iv.2, 23.d.iv.2.a and 23.d.iv.3–5.
      const digits = internalSlots.fractionalSecondDigits ?? 3
      equal =
        floor(tm1.millisecond * 10 ** (digits - 3)) ===
        floor(tm2.millisecond * 10 ** (digits - 3))
    } else {
      // Temporal comparison §15.6.8 steps 23.d.v.1–2 read the two own fields.
      equal = tm1[field] === tm2[field]
    }
    // Temporal comparison §15.6.8 step 23.d.vi compares the prepared values;
    // numeric equality includes both signs of zero from calendar providers.
    if (!equal) {
      // ECMA-402 §11.5.8 step 15.d.vi stops comparing on the first difference.
      differentField = field
      break
    }
  }
  // Temporal comparison §15.6.8 step 24: undefined encodes no unequal
  // encountered field; full field coverage remains a separate premise.
  if (differentField === undefined) {
    // ECMA-402 §11.5.8 step 16.b: pass the selected local time privately.
    // Temporal comparison §15.6.8 step 24.b reuses the rendering local time.
    // Both render paths use +00:00 for Plain endpoints.
    const rangeFormatOptions = {__proto__: null, localTime: tm1}
    // Temporal comparison §15.6.8 step 24.a reuses the formatter's fresh List.
    // The records stay private until the public wrapper creates its own parts.
    const result = FormatDateTimePattern(
      dtf,
      parts,
      first.epochNanoseconds,
      first.isPlain,
      {
        ...implDetails,
        rangeFormatOptions,
      }
    )
    // ECMA-402 §11.5.8 step 16.c.i: create private records without setters.
    // Temporal comparison §15.6.8 steps 24.c, 24.c.i and 24.d.
    // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
    for (let index = 0; index < result.length; index++)
      setDataProperty(result[index], 'source', RangePatternType.shared)
    return result
  }

  // Some combined-style intervals contain only the time pattern.
  const selected = rangePatterns[differentField]
  let rangePattern = selected
  if (
    !selected ||
    arraySome(
      DATE_FIELDS,
      field =>
        stringIncludes(pattern, field) &&
        !arraySome(
          selected.patternParts,
          part =>
            part.pattern === '{0}' ||
            part.pattern === '{1}' ||
            stringIncludes(part.pattern, field)
        )
    )
  ) {
    rangePattern = rangePatterns.default
  }
  if (!rangePattern) {
    // ECMA-402 §11.5.8 step 18.a uses the default only for an unmatched range.
    // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
    const parsed = PartitionPattern<'0' | '1' | 'literal'>(
      dataLocaleData.intervalFormatFallback
    )
    const patternParts: RangePatterns['patternParts'] = []
    for (let index = 0; index < parsed.length; index++) {
      const part = parsed[index]
      setDataProperty(patternParts, index, {
        source:
          part.type === 'literal'
            ? RangePatternType.shared
            : part.type === '0'
              ? RangePatternType.startRange
              : RangePatternType.endRange,
        pattern: part.type === 'literal' ? part.value! : pattern,
      })
    }
    rangePattern = {__proto__: null, patternParts} as RangePatterns
  }
  const result: IntlDateTimeFormatPart[] = []
  const rangeParts = expandFallbackRangePattern(
    rangePattern.patternParts,
    pattern
  )
  const contextParts = PartitionPattern<IntlDateTimeFormatPartType>(
    expandRangePattern(rangeParts, pattern)
  )
  // ECMA-402 §11.5.8 step 19.e: keep optional formatter inputs private.
  const rangeFormatOptions = {
    __proto__: null,
    patternParts: contextParts,
    format: rangePattern,
  }
  const rangeImplDetails = {...implDetails, rangeFormatOptions}
  for (let index = 0; index < rangeParts.length; index++) {
    const part = rangeParts[index]
    const {source} = part
    // Steps 19.a–f keep each record's source when expanding a fallback endpoint.
    // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
    const partPattern =
      part.pattern === '{0}' || part.pattern === '{1}' ? pattern : part.pattern
    if (!stringIncludes(partPattern, '{')) {
      setDataProperty(result, result.length, {
        type: 'literal',
        value: partPattern,
        source,
      })
      continue
    }
    const value =
      source === RangePatternType.endRange
        ? second.epochNanoseconds
        : first.epochNanoseconds
    // ECMA-402 §11.5.8 step 19.e: private local-time input ignores setters.
    setDataProperty(
      rangeFormatOptions,
      'localTime',
      source === RangePatternType.endRange ? tm2 : tm1
    )
    const formatted = FormatDateTimePattern(
      dtf,
      PartitionPattern<IntlDateTimeFormatPartType>(partPattern),
      value,
      first.isPlain,
      rangeImplDetails
    )
    for (let index = 0; index < formatted.length; index++) {
      const item = formatted[index]
      // ECMA-402 §11.5.8 step 19.f.i: own source on each private record.
      setDataProperty(item, 'source', source)
      setDataProperty(result, result.length, item)
    }
  }
  return result
}
