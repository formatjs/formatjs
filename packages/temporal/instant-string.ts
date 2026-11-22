import {UTCOffsetNanoseconds} from '#packages/ecma262-abstract/UTCOffsetNanoseconds.js'
import {
  RangeErrorConstructor,
  arrayIncludes,
  bigIntFrom,
  mathMin,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  isoToEpochNanoseconds,
  type ISODateTime,
} from '#packages/temporal/kernel.js'
import {nativeTemporal} from '#packages/temporal/native.js'

// ECMA-262 §21.4.1.33.2 steps 15.a, 16.b–16.d:
// https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring
// Parsers supply at most nine ASCII digits; absent fractions represent zero.
function fractionDigits(value = ''): string {
  while (value.length < 9) value += '0'
  return value
}

// ECMA-262 §21.4.1.33.1 steps 1–3: recognize the complete UTCOffset grammar.
// https://tc39.es/ecma262/#sec-istimezoneoffsetstring
export function isTimeZoneOffsetString(value: string): boolean {
  return UTCOffsetNanoseconds(value, false) !== undefined
}

// ECMA-262 §21.4.1.33.2: valid strings return the specified integer exactly.
// https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring
// The throwing wrapper also serves callers that combine recognition and parsing.
export function parseOffsetNanoseconds(
  value: string,
  annotation = false
): bigint {
  const result = UTCOffsetNanoseconds(value, annotation)
  if (result === undefined)
    throw new RangeErrorConstructor('Invalid UTC offset')
  return bigIntFrom(result)
}

function validateAnnotations(value: string): {
  timeZone?: string
  calendar?: string
} {
  let timeZone: string | undefined, calendar: string | undefined
  let calendarSeen = false,
    criticalCalendar = false,
    annotationSeen = false,
    zoneSeen = false
  while (value) {
    const match = /^\[(!?)([^[\]]+)\]/.exec(value)
    if (!match) throw new RangeErrorConstructor('Invalid annotation')
    const critical = match[1] === '!'
    const text = match[2]
    if (text.includes('=')) {
      const annotation =
        /^([a-z_][a-z_0-9-]*)=([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)$/.exec(text)
      if (!annotation || annotation[0] !== text)
        throw new RangeErrorConstructor('Invalid annotation')
      annotationSeen = true
      if (annotation[1] === 'u-ca') {
        if (calendarSeen && (critical || criticalCalendar))
          throw new RangeErrorConstructor(
            'Duplicate critical calendar annotation'
          )
        calendar ??= annotation[2]
        calendarSeen = true
        criticalCalendar ||= critical
      } else if (critical)
        throw new RangeErrorConstructor('Unknown critical annotation')
    } else {
      if (zoneSeen || annotationSeen)
        throw new RangeErrorConstructor('Unexpected timezone annotation')
      zoneSeen = true
      timeZone = text
      if (/^[+-]/.test(text)) parseOffsetNanoseconds(text, true)
      else if (
        !/^[A-Za-z._][A-Za-z._0-9+-]*(?:\/[A-Za-z._][A-Za-z._0-9+-]*)*(?![\s\S])/.test(
          text
        )
      )
        throw new RangeErrorConstructor('Invalid timezone annotation')
    }
    value = value.slice(match[0].length)
  }
  return {timeZone, calendar}
}

export function parseInstantString(value: string): bigint {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.parseInstant(value)
  const match =
    /^([+-]\d{6}|\d{4})(-?)(\d{2})\2(\d{2})[Tt ](\d{2})(?:(:?)(\d{2})(?:\6(\d{2})(?:[.,](\d{1,9}))?)?)?([Zz]|[+-]\d{2}(?::?\d{2}(?::?\d{2}(?:[.,]\d{1,9})?)?)?)([\s\S]*)$/.exec(
      value
    )
  if (!match || match[1] === '-000000')
    throw new RangeErrorConstructor('Invalid instant string')
  validateAnnotations(match[11])
  const fraction = fractionDigits(match[9])
  const second = +(match[8] ?? 0)
  const local = isoToEpochNanoseconds({
    year: +match[1],
    month: +match[3],
    day: +match[4],
    hour: +match[5],
    minute: +(match[7] ?? 0),
    second: second === 60 ? 59 : second,
    millisecond: +fraction.slice(0, 3),
    microsecond: +fraction.slice(3, 6),
    nanosecond: +fraction.slice(6, 9),
  })
  return (
    local - (/^[Zz]$/.test(match[10]) ? 0n : parseOffsetNanoseconds(match[10]))
  )
}

function isValidDate(year: string, month: string, day: string): boolean {
  const y = +year,
    m = +month,
    d = +day
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
  const maximum =
    m === 2 ? 28 + numberFrom(leap) : arrayIncludes([4, 6, 9, 11], m) ? 30 : 31
  return year !== '-000000' && m >= 1 && m <= 12 && d >= 1 && d <= maximum
}

export interface ParsedDateFields extends Required<ISODateTime> {
  calendar: string
}
export function parseISODateParts(value: string): ParsedDateFields {
  const match =
    /^([+-]\d{6}|\d{4})(-?)(\d{2})\2(\d{2})(?:[Tt ](\d{2})(?:(:?)(\d{2})(?:\6(\d{2})(?:[.,](\d{1,9}))?)?)?([+-]\d{2}(?::?\d{2}(?::?\d{2}(?:[.,]\d{1,9})?)?)?)?)?([\s\S]*)$/.exec(
      value
    )
  if (!match || !isValidDate(match[1], match[3], match[4]))
    throw new RangeErrorConstructor('Invalid ISO date/time')
  const annotations = validateAnnotations(match[11])
  if (match[10]) parseOffsetNanoseconds(match[10])
  const hour = +(match[5] ?? 0),
    minute = +(match[7] ?? 0),
    second = +(match[8] ?? 0)
  if (hour > 23 || minute > 59 || second > 60)
    throw new RangeErrorConstructor('Invalid ISO time')
  const fraction = fractionDigits(match[9])
  return {
    year: +match[1],
    month: +match[3],
    day: +match[4],
    hour,
    minute,
    second: mathMin(59, second),
    millisecond: +fraction.slice(0, 3),
    microsecond: +fraction.slice(3, 6),
    nanosecond: +fraction.slice(6, 9),
    calendar: annotations.calendar ?? 'iso8601',
  }
}
export function parseShortDateString(
  value: string,
  kind: 'year-month' | 'month-day'
): {year: number; month: number; day: number; calendar: string} {
  const index = value.indexOf('['),
    body = index < 0 ? value : value.slice(0, index)
  const annotation = validateAnnotations(index < 0 ? '' : value.slice(index))
  const short =
    kind === 'year-month'
      ? /^([+-]\d{6}|\d{4})-?(\d{2})$/.exec(body)
      : /^(?:--)?(\d{2})-?(\d{2})$/.exec(body)
  if (short) {
    if (
      annotation.calendar !== undefined &&
      annotation.calendar.toLowerCase() !== 'iso8601'
    )
      throw new RangeErrorConstructor('Short ISO date requires ISO calendar')
    const year = kind === 'year-month' ? short[1] : '1972',
      month = kind === 'year-month' ? short[2] : short[1],
      day = kind === 'year-month' ? '01' : short[2]
    if (!isValidDate(year, month, day))
      throw new RangeErrorConstructor('Invalid ISO date')
    return {year: +year, month: +month, day: +day, calendar: 'iso8601'}
  }
  return parseISODateParts(value)
}
export function parseCalendarString(value: string): string {
  const index = value.indexOf('['),
    body = index < 0 ? value : value.slice(0, index)
  const annotation = validateAnnotations(index < 0 ? '' : value.slice(index))
  const ym = /^([+-]\d{6}|\d{4})-?(\d{2})$/.exec(body),
    md = /^(?:--)?(\d{2})-?(\d{2})$/.exec(body)
  if (
    (ym && isValidDate(ym[1], ym[2], '01')) ||
    (md && isValidDate('1972', md[1], md[2]))
  ) {
    if (
      annotation.calendar !== undefined &&
      annotation.calendar.toLowerCase() !== 'iso8601'
    )
      throw new RangeErrorConstructor('Short ISO date requires ISO calendar')
  } else if (/^([+-]\d{6}|\d{4})(-?)(\d{2})\2(\d{2})(?:[Tt ]|$)/.test(body))
    // ParseTemporalCalendarString 1619: parse fields without creating a bounded date.
    parseISODateParts(body.replace(/[Zz]$/, ''))
  else parsePlainTimeString(body)
  return annotation.calendar ?? 'iso8601'
}

export function parsePlainTimeString(value: string): bigint {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.parsePlainTime(value)
  const index = value.indexOf('[')
  let body = index < 0 ? value : value.slice(0, index)
  validateAnnotations(index < 0 ? '' : value.slice(index))
  const date = /^([+-]\d{6}|\d{4})(-?)(\d{2})\2(\d{2})[Tt ]/.exec(body)
  if (date) {
    if (!isValidDate(date[1], date[3], date[4]))
      throw new RangeErrorConstructor('Invalid ISO date')
    body = body.slice(date[0].length)
  } else if (/^[Tt]/.test(body)) body = body.slice(1)
  else {
    const ym = /^(\d{4})-?(\d{2})$/.exec(body)
    const md = /^(\d{2})-?(\d{2})$/.exec(body)
    if (
      (ym && isValidDate(ym[1], ym[2], '01')) ||
      (md && isValidDate('1972', md[1], md[2]))
    )
      throw new RangeErrorConstructor('Ambiguous ISO time')
  }
  const match =
    /^(\d{2})(?:(:?)(\d{2})(?:\2(\d{2})(?:[.,](\d{1,9}))?)?)?([+-]\d{2}(?::?\d{2}(?::?\d{2}(?:[.,]\d{1,9})?)?)?)?$/.exec(
      body
    )
  if (
    !match ||
    match[0] !== body ||
    +match[1] > 23 ||
    +(match[3] ?? 0) > 59 ||
    +(match[4] ?? 0) > 60
  )
    throw new RangeErrorConstructor('Invalid ISO time')
  if (match[6]) parseOffsetNanoseconds(match[6])
  return (
    bigIntFrom(
      +match[1] * 3600 + +(match[3] ?? 0) * 60 + mathMin(59, +(match[4] ?? 0))
    ) *
      1_000_000_000n +
    bigIntFrom(fractionDigits(match[5]))
  )
}

export function parseTimeZoneString(value: string): string {
  if (isTimeZoneOffsetString(value)) {
    parseOffsetNanoseconds(value, true)
    return value
  }
  if (
    /^[A-Za-z._][A-Za-z._0-9+-]*(?:\/[A-Za-z._][A-Za-z._0-9+-]*)*(?![\s\S])/.test(
      value
    )
  )
    return value
  const index = value.indexOf('[')
  const body = index < 0 ? value : value.slice(0, index)
  const annotations = validateAnnotations(index < 0 ? '' : value.slice(index))
  let time: string | undefined, offset: string | undefined
  const date =
    /^([+-]\d{6}|\d{4})(-?)(\d{2})\2(\d{2})(?:[Tt ]([\s\S]+))?$/.exec(body)
  if (date && date[0] === body) {
    if (!isValidDate(date[1], date[3], date[4]))
      throw new RangeErrorConstructor('Invalid ISO date')
    time = date[5]
  } else {
    let yearMonth = /^([+-]\d{6}|\d{4})-?(\d{2})$/.exec(body)
    let monthDay = /^(?:--)?(\d{2})-?(\d{2})$/.exec(body)
    if (yearMonth && !isValidDate(yearMonth[1], yearMonth[2], '01'))
      yearMonth = null
    if (monthDay && !isValidDate('1972', monthDay[1], monthDay[2]))
      monthDay = null
    if (
      (yearMonth && yearMonth[0] === body) ||
      (monthDay && monthDay[0] === body)
    ) {
      if (
        annotations.calendar !== undefined &&
        annotations.calendar.toLowerCase() !== 'iso8601'
      )
        throw new RangeErrorConstructor('Short ISO date requires ISO calendar')
    } else time = /^[Tt]/.test(body) ? body.slice(1) : body
  }
  if (time !== undefined) {
    const match =
      /^(\d{2})(?:(:?)(\d{2})(?:\2(\d{2})(?:[.,](\d{1,9}))?)?)?([Zz]|[+-]\d{2}(?::?\d{2}(?::?\d{2}(?:[.,]\d{1,9})?)?)?)?$/.exec(
        time
      )
    if (
      !match ||
      match[0] !== time ||
      +match[1] > 23 ||
      +(match[3] ?? 0) > 59 ||
      +(match[4] ?? 0) > 60
    )
      throw new RangeErrorConstructor('Invalid ISO time')
    offset = match[6]
    if (offset && !/^[Zz]$/.test(offset)) parseOffsetNanoseconds(offset)
    if (!date && offset && /^[Zz]$/.test(offset))
      throw new RangeErrorConstructor('Time-only string cannot use Z')
  }
  if (annotations.timeZone !== undefined) return annotations.timeZone
  if (offset && /^[Zz]$/.test(offset)) return 'UTC'
  if (offset !== undefined) {
    parseOffsetNanoseconds(offset, true)
    return offset
  }
  throw new RangeErrorConstructor(
    'Timezone string needs an offset or annotation'
  )
}

export function parseZonedDateTimeString(value: string): {
  fields: ParsedDateFields
  timeZone: string
  offset: string | undefined
  localNanoseconds?: bigint
  validatedTimeZone?: string
} {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.parseZonedFields(value)
  const index = value.indexOf('[')
  if (index < 0) throw new RangeErrorConstructor('Timezone annotation required')
  const body = value.slice(0, index),
    annotations = validateAnnotations(value.slice(index))
  if (annotations.timeZone === undefined)
    throw new RangeErrorConstructor('Timezone annotation required')
  const offset =
    /([Zz]|[+-]\d{2}(?::?\d{2}(?::?\d{2}(?:[.,]\d{1,9})?)?)?)$/.exec(body)?.[1]
  // Keep local fields independent of any supplied UTC offset.
  if (/[Zz]$/.test(body) && !/[Tt ]/.test(body))
    throw new RangeErrorConstructor('Offset requires time')
  const fields = parseISODateParts(
    body.replace(/[Zz]$/, '') + value.slice(index)
  )
  return {
    fields,
    timeZone: annotations.timeZone,
    offset: /[Tt ]/.test(body) ? offset : undefined,
  }
}
