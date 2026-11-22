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
// Proposal comparison §13.35 step 19.b: pad the consumed fraction to nine digits.
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

type DatePrefix = {
  year: string
  separator: string
  month: string
  day: string
  end: number
}
type TimePrefix = {
  hour: string
  separator: string | undefined
  minute: string | undefined
  second: string | undefined
  fraction: string | undefined
  end: number
}

// Proposal comparison §13.35 step 7: copy bounded field spans from the source string.
function stringPart(value: string, start: number, end = value.length): string {
  let result = ''
  for (let index = start; index < end; index++) result += value[index]
  return result
}
// Proposal comparison §13.35 step 4.a.i: split the lexical body from its bracket suffix.
function bracketIndex(value: string): number {
  for (let index = 0; index < value.length; index++)
    if (value[index] === '[') return index
  return -1
}
// Proposal comparison §13.31 DecimalDigit: recognize one ASCII digit at a bounded index.
function decimalAt(value: string, index: number): boolean {
  return index < value.length && value[index] >= '0' && value[index] <= '9'
}
// Proposal comparison §13.31 Date and Time: check fixed-width ASCII digit spans.
function digitsAt(value: string, index: number, count: number): boolean {
  if (index + count > value.length) return false
  for (let digit = 0; digit < count; digit++)
    if (!decimalAt(value, index + digit)) return false
  return true
}
// Proposal comparison §13.31 DateSpec: read year, separators, month and day.
function datePrefix(value: string): DatePrefix | undefined {
  let index = 0
  if (value.length !== 0 && (value[0] === '+' || value[0] === '-')) index++
  const width = index ? 6 : 4
  if (!digitsAt(value, index, width)) return undefined
  index += width
  const year = stringPart(value, 0, index)
  const separator = index < value.length && value[index] === '-' ? '-' : ''
  if (separator) index++
  if (!digitsAt(value, index, 2)) return undefined
  const month = stringPart(value, index, index + 2)
  index += 2
  if (separator) {
    if (index === value.length || value[index] !== '-') return undefined
    index++
  }
  if (!digitsAt(value, index, 2)) return undefined
  const day = stringPart(value, index, index + 2)
  return {year, separator, month, day, end: index + 2}
}
// Proposal comparison §13.31 DateTimeSeparator: accept space, T or t at this index.
function timeMarker(value: string, index: number): boolean {
  return (
    index < value.length &&
    (value[index] === 'T' || value[index] === 't' || value[index] === ' ')
  )
}
// Proposal comparison §13.31 DateTime: locate the marker in a parsed zoned body.
function hasTimeMarker(value: string): boolean {
  for (let index = 0; index < value.length; index++)
    if (timeMarker(value, index)) return true
  return false
}
// Proposal comparison §13.31 UTCDesignator: recognize Z or z.
function isZ(value: string | undefined): boolean {
  return value === 'Z' || value === 'z'
}
// Proposal comparison §13.35 steps 26–26.a: detect a trailing UTC designator in the body.
function endsInZ(value: string): boolean {
  return value.length !== 0 && isZ(value[value.length - 1])
}
// Proposal comparison §13.35 step 26: strip a detected designator before field parsing.
function withoutZ(value: string): string {
  return endsInZ(value) ? stringPart(value, 0, value.length - 1) : value
}
// Proposal comparison §13.31 TimeSpec: capture clock fields, separators and fraction digits.
function timePrefix(value: string, start: number): TimePrefix | undefined {
  if (!digitsAt(value, start, 2)) return undefined
  const hour = stringPart(value, start, start + 2)
  let index = start + 2
  let separator: string | undefined
  let minute: string | undefined
  let second: string | undefined
  let fraction: string | undefined
  const extended = index < value.length && value[index] === ':'
  const minuteStart = index + (extended ? 1 : 0)
  if (digitsAt(value, minuteStart, 2)) {
    separator = extended ? ':' : ''
    minute = stringPart(value, minuteStart, minuteStart + 2)
    index = minuteStart + 2
    const secondStart = index + (extended ? 1 : 0)
    if (
      (!extended || (index < value.length && value[index] === ':')) &&
      digitsAt(value, secondStart, 2)
    ) {
      second = stringPart(value, secondStart, secondStart + 2)
      index = secondStart + 2
      if (
        index < value.length &&
        (value[index] === '.' || value[index] === ',') &&
        decimalAt(value, index + 1)
      ) {
        const fractionStart = ++index
        while (index - fractionStart < 9 && decimalAt(value, index)) index++
        fraction = stringPart(value, fractionStart, index)
      }
    }
  }
  return {hour, separator, minute, second, fraction, end: index}
}
// Proposal comparison §13.35 step 27.a: find the end of the numeric offset span.
function offsetEnd(value: string, start: number): number | undefined {
  if (start === value.length || (value[start] !== '+' && value[start] !== '-'))
    return undefined
  if (!digitsAt(value, start + 1, 2)) return undefined
  let index = start + 3
  const extended = index < value.length && value[index] === ':'
  const minuteStart = index + (extended ? 1 : 0)
  if (digitsAt(value, minuteStart, 2)) {
    index = minuteStart + 2
    const secondStart = index + (extended ? 1 : 0)
    if (
      (!extended || (index < value.length && value[index] === ':')) &&
      digitsAt(value, secondStart, 2)
    ) {
      index = secondStart + 2
      if (
        index < value.length &&
        (value[index] === '.' || value[index] === ',') &&
        decimalAt(value, index + 1)
      ) {
        const fractionStart = ++index
        while (index - fractionStart < 9 && decimalAt(value, index)) index++
      }
    }
  }
  return index
}
// Proposal comparison §13.35 step 4.a.i: scan a date-time prefix and keep its suffix.
function isoMatch(value: string, instant = false): string[] | null {
  const date = datePrefix(value)
  if (!date) return null
  let index = date.end
  let time: TimePrefix | undefined
  let offset: string | undefined
  if (timeMarker(value, index)) {
    time = timePrefix(value, index + 1)
    if (time) index = time.end
    else if (instant) return null
  } else if (instant) return null
  if (time) {
    if (instant && index < value.length && isZ(value[index]))
      offset = value[index++]
    else {
      const end = offsetEnd(value, index)
      if (end !== undefined) {
        offset = stringPart(value, index, end)
        index = end
      }
    }
  }
  if (instant && offset === undefined) return null
  return [
    value,
    date.year,
    date.separator,
    date.month,
    date.day,
    time?.hour,
    time?.separator,
    time?.minute,
    time?.second,
    time?.fraction,
    offset,
    stringPart(value, index),
  ] as string[]
}
// Proposal comparison §13.31 DateSpecYearMonth: capture the complete short-date body.
function yearMonthMatch(value: string): string[] | null {
  let index = 0
  if (value.length !== 0 && (value[0] === '+' || value[0] === '-')) index++
  const width = index ? 6 : 4
  if (!digitsAt(value, index, width)) return null
  index += width
  const year = stringPart(value, 0, index)
  if (index < value.length && value[index] === '-') index++
  if (!digitsAt(value, index, 2) || index + 2 !== value.length) return null
  return [value, year, stringPart(value, index)]
}
// Proposal comparison §13.31 DateSpecMonthDay: capture the complete month-day body.
function monthDayMatch(value: string): string[] | null {
  let index = value.length >= 2 && value[0] === '-' && value[1] === '-' ? 2 : 0
  if (!digitsAt(value, index, 2)) return null
  const month = stringPart(value, index, index + 2)
  index += 2
  if (index < value.length && value[index] === '-') index++
  if (!digitsAt(value, index, 2) || index + 2 !== value.length) return null
  return [value, month, stringPart(value, index)]
}
// Temporal comparison §4.5.6 step 3.b. Scan the date prefix of a time string.
function dateTimePrefixMatch(value: string): string[] | null {
  const date = datePrefix(value)
  if (!date || !timeMarker(value, date.end)) return null
  return [
    stringPart(value, 0, date.end + 1),
    date.year,
    date.separator,
    date.month,
    date.day,
  ]
}
// Temporal comparison §13.38 step 3. Split date and clock text for zone parsing.
function dateBodyMatch(value: string): string[] | null {
  const date = datePrefix(value)
  if (!date) return null
  if (date.end === value.length)
    return [
      value,
      date.year,
      date.separator,
      date.month,
      date.day,
      undefined,
    ] as string[]
  if (!timeMarker(value, date.end) || date.end + 1 === value.length) return null
  return [
    value,
    date.year,
    date.separator,
    date.month,
    date.day,
    stringPart(value, date.end + 1),
  ]
}
// Temporal comparison §13.35 step 4.a.i. Scan a whole clock and optional offset.
function timeMatch(value: string, allowZ = false): string[] | null {
  const time = timePrefix(value, 0)
  if (!time) return null
  let index = time.end
  let offset: string | undefined
  if (allowZ && index < value.length && isZ(value[index]))
    offset = value[index++]
  else {
    const end = offsetEnd(value, index)
    if (end !== undefined) {
      offset = stringPart(value, index, end)
      index = end
    }
  }
  if (index !== value.length) return null
  return [
    value,
    time.hour,
    time.separator,
    time.minute,
    time.second,
    time.fraction,
    offset,
  ] as string[]
}
// Proposal comparison §11.1.16 steps1–2: consume named identifier grammar only.
// https://tc39.es/proposal-temporal/#sec-parsetimezoneidentifier
export function zoneName(value: string): boolean {
  let first = true
  for (let index = 0; index < value.length; index++) {
    const character = value[index]
    const leading =
      (character >= 'A' && character <= 'Z') ||
      (character >= 'a' && character <= 'z') ||
      character === '.' ||
      character === '_'
    if (character === '/') {
      if (first) return false
      first = true
    } else {
      if (
        !leading &&
        (first ||
          (!decimalAt(value, index) && character !== '+' && character !== '-'))
      )
        return false
      first = false
    }
  }
  return !first
}
// Temporal comparison §13.35 steps 4.a.ii.3.a and 4.a.ii.4.a. Test the ISO calendar token.
function isoCalendar(value: string): boolean {
  return (
    value.length === 7 &&
    (value[0] === 'i' || value[0] === 'I') &&
    (value[1] === 's' || value[1] === 'S') &&
    (value[2] === 'o' || value[2] === 'O') &&
    value[3] === '8' &&
    value[4] === '6' &&
    value[5] === '0' &&
    value[6] === '1'
  )
}
// Temporal comparison §13.36 step 1. Select the date branch for calendar parsing.
function calendarDatePrefix(value: string): boolean {
  const date = datePrefix(value)
  return (
    date !== undefined &&
    (date.end === value.length || timeMarker(value, date.end))
  )
}
// Temporal comparison §6.5.2 steps 5.f and 5.g.i. Extract the trailing offset token.
function suffixOffset(value: string): string | undefined {
  for (let index = 0; index < value.length; index++) {
    if (isZ(value[index]) && index + 1 === value.length) return value[index]
    if (offsetEnd(value, index) === value.length)
      return stringPart(value, index)
  }
  return undefined
}

// Temporal comparison §13.35 step4.a.ii: calendar and critical annotation rules.
// https://tc39.es/proposal-temporal/#sec-temporal-parseisodatetime
function validateAnnotations(value: string): {
  timeZone?: string
  calendar?: string
} {
  let timeZone: string | undefined, calendar: string | undefined
  let calendarSeen = false,
    criticalCalendar = false,
    annotationSeen = false,
    zoneSeen = false,
    index = 0
  while (index < value.length) {
    if (value[index++] !== '[')
      throw new RangeErrorConstructor('Invalid annotation')
    const critical = index < value.length && value[index] === '!'
    if (critical) index++
    const start = index
    let equals = -1
    while (index < value.length && value[index] !== ']') {
      if (value[index] === '[')
        throw new RangeErrorConstructor('Invalid annotation')
      if (value[index] === '=') {
        if (equals !== -1) throw new RangeErrorConstructor('Invalid annotation')
        equals = index
      }
      index++
    }
    if (index === value.length || index === start)
      throw new RangeErrorConstructor('Invalid annotation')
    const text = stringPart(value, start, index++)
    if (equals !== -1) {
      const key = stringPart(value, start, equals)
      if (key.length === 0)
        throw new RangeErrorConstructor('Invalid annotation')
      for (let position = 0; position < key.length; position++) {
        const character = key[position]
        const lower =
          (character >= 'a' && character <= 'z') || character === '_'
        if (
          !lower &&
          (position === 0 || (!decimalAt(key, position) && character !== '-'))
        )
          throw new RangeErrorConstructor('Invalid annotation')
      }
      const contents = stringPart(value, equals + 1, index - 1)
      let segment = false
      for (let position = 0; position < contents.length; position++) {
        const character = contents[position]
        if (character === '-') {
          if (!segment) throw new RangeErrorConstructor('Invalid annotation')
          segment = false
        } else {
          if (
            !(
              (character >= 'a' && character <= 'z') ||
              (character >= 'A' && character <= 'Z') ||
              decimalAt(contents, position)
            )
          )
            throw new RangeErrorConstructor('Invalid annotation')
          segment = true
        }
      }
      if (!segment) throw new RangeErrorConstructor('Invalid annotation')
      annotationSeen = true
      if (key === 'u-ca') {
        if (calendarSeen && (critical || criticalCalendar))
          throw new RangeErrorConstructor(
            'Duplicate critical calendar annotation'
          )
        calendar ??= contents
        calendarSeen = true
        criticalCalendar ||= critical
      } else if (critical)
        throw new RangeErrorConstructor('Unknown critical annotation')
    } else {
      if (zoneSeen || annotationSeen)
        throw new RangeErrorConstructor('Unexpected timezone annotation')
      zoneSeen = true
      timeZone = text
      if (text[0] === '+' || text[0] === '-') parseOffsetNanoseconds(text, true)
      else if (!zoneName(text))
        throw new RangeErrorConstructor('Invalid timezone annotation')
    }
  }
  return {timeZone, calendar}
}

// Temporal comparison §8.5.3 steps3–10: parse the instant and subtract its exact offset
// https://tc39.es/proposal-temporal/#sec-temporal-totemporalinstant
export function parseInstantString(value: string): bigint {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.parseInstant(value)
  const match = isoMatch(value, true)
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
    millisecond: +stringPart(fraction, 0, 3),
    microsecond: +stringPart(fraction, 3, 6),
    nanosecond: +stringPart(fraction, 6, 9),
  })
  return local - (isZ(match[10]) ? 0n : parseOffsetNanoseconds(match[10]))
}

// Temporal comparison §3.5.8 steps 1–3. Check day bounds and reject a negative zero year token.
function isValidDate(year: string, month: string, day: string): boolean {
  const y = +year,
    m = +month,
    d = +day
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
  // ECMA-262 preview §§22.4.1.1–2: bound the month/day pair and allow February 29 only in leap years.
  // https://tc39.es/ecma262/pr/3966/#sec-rfc9557grammar-static-semantics-isvalidmonthday
  // https://tc39.es/ecma262/pr/3966/#sec-rfc9557grammar-static-semantics-isvaliddate
  const maximum =
    m === 2 ? 28 + numberFrom(leap) : arrayIncludes([4, 6, 9, 11], m) ? 30 : 31
  // ECMA-262 preview §22.4.1.3 rejects invalid dates and the negative-zero year.
  // https://tc39.es/ecma262/pr/3966/#sec-rfc9557grammar-static-semantics-early-errors
  return year !== '-000000' && m >= 1 && m <= 12 && d >= 1 && d <= maximum
}

export interface ParsedDateFields extends Required<ISODateTime> {
  calendar: string
}
// Temporal comparison §13.35 steps7–29: project validated date/time syntax and annotations
// https://tc39.es/proposal-temporal/#sec-temporal-parseisodatetime
export function parseISODateParts(value: string): ParsedDateFields {
  const match = isoMatch(value)
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
    millisecond: +stringPart(fraction, 0, 3),
    microsecond: +stringPart(fraction, 3, 6),
    nanosecond: +stringPart(fraction, 6, 9),
    calendar: annotations.calendar ?? 'iso8601',
  }
}
// Temporal comparison §13.35 steps4.a.ii.3–4/7–29: short-date calendar restrictions and field defaults
// https://tc39.es/proposal-temporal/#sec-temporal-parseisodatetime
export function parseShortDateString(
  value: string,
  kind: 'year-month' | 'month-day'
): {year: number; month: number; day: number; calendar: string} {
  const index = bracketIndex(value),
    body = index < 0 ? value : stringPart(value, 0, index)
  const annotation = validateAnnotations(
    index < 0 ? '' : stringPart(value, index)
  )
  const short =
    kind === 'year-month' ? yearMonthMatch(body) : monthDayMatch(body)
  if (short) {
    if (annotation.calendar !== undefined && !isoCalendar(annotation.calendar))
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
// Temporal comparison §13.36 steps1–5: calendar extraction without constructing a bounded date
// https://tc39.es/proposal-temporal/#sec-temporal-parsetemporalcalendarstring
export function parseCalendarString(value: string): string {
  const index = bracketIndex(value),
    body = index < 0 ? value : stringPart(value, 0, index)
  const annotation = validateAnnotations(
    index < 0 ? '' : stringPart(value, index)
  )
  const ym = yearMonthMatch(body),
    md = monthDayMatch(body)
  if (
    (ym && isValidDate(ym[1], ym[2], '01')) ||
    (md && isValidDate('1972', md[1], md[2]))
  ) {
    if (annotation.calendar !== undefined && !isoCalendar(annotation.calendar))
      throw new RangeErrorConstructor('Short ISO date requires ISO calendar')
  } else if (calendarDatePrefix(body))
    // Comparison §13.36 step1: parse fields without creating a bounded date.
    parseISODateParts(withoutZ(body))
  else parsePlainTimeString(body)
  return annotation.calendar ?? 'iso8601'
}

// Temporal comparison §13.35 steps7–23: validated clock fields and exact fraction composition
// https://tc39.es/proposal-temporal/#sec-temporal-parseisodatetime
export function parsePlainTimeString(value: string): bigint {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.parsePlainTime(value)
  const index = bracketIndex(value)
  let body = index < 0 ? value : stringPart(value, 0, index)
  validateAnnotations(index < 0 ? '' : stringPart(value, index))
  // ECMA-262 preview §22.4.1 parses TemporalTimeString as a time or a date with a required clock.
  // https://tc39.es/ecma262/pr/3966/#sec-rfc9557-grammar
  const date = dateTimePrefixMatch(body)
  if (date) {
    if (!isValidDate(date[1], date[3], date[4]))
      throw new RangeErrorConstructor('Invalid ISO date')
    body = stringPart(body, date[0].length)
  } else if (body.length !== 0 && (body[0] === 'T' || body[0] === 't'))
    body = stringPart(body, 1)
  else {
    // ECMA-262 preview §22.4.1.3 rejects an undesignated clock that also parses as a short date.
    // https://tc39.es/ecma262/pr/3966/#sec-rfc9557grammar-static-semantics-early-errors
    const ym =
      body.length !== 0 && body[0] !== '+' && body[0] !== '-'
        ? yearMonthMatch(body)
        : null
    const md = body.length !== 0 && body[0] !== '-' ? monthDayMatch(body) : null
    if (
      (ym && isValidDate(ym[1], ym[2], '01')) ||
      (md && isValidDate('1972', md[1], md[2]))
    )
      throw new RangeErrorConstructor('Ambiguous ISO time')
  }
  const match = timeMatch(body)
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

// Temporal comparison §13.38 steps1–8: prefer annotation, then Z, then numeric offset
// https://tc39.es/proposal-temporal/#sec-temporal-parsetemporaltimezonestring
export function parseTimeZoneString(value: string): string {
  if (isTimeZoneOffsetString(value)) {
    parseOffsetNanoseconds(value, true)
    return value
  }
  if (zoneName(value)) return value
  const index = bracketIndex(value)
  const body = index < 0 ? value : stringPart(value, 0, index)
  const annotations = validateAnnotations(
    index < 0 ? '' : stringPart(value, index)
  )
  let time: string | undefined, offset: string | undefined
  const date = dateBodyMatch(body)
  if (date && date[0] === body) {
    if (!isValidDate(date[1], date[3], date[4]))
      throw new RangeErrorConstructor('Invalid ISO date')
    time = date[5]
  } else {
    let yearMonth = yearMonthMatch(body)
    let monthDay = monthDayMatch(body)
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
        !isoCalendar(annotations.calendar)
      )
        throw new RangeErrorConstructor('Short ISO date requires ISO calendar')
    } else
      time =
        body.length !== 0 && (body[0] === 'T' || body[0] === 't')
          ? stringPart(body, 1)
          : body
  }
  if (time !== undefined) {
    const match = timeMatch(time, true)
    if (
      !match ||
      match[0] !== time ||
      +match[1] > 23 ||
      +(match[3] ?? 0) > 59 ||
      +(match[4] ?? 0) > 60
    )
      throw new RangeErrorConstructor('Invalid ISO time')
    offset = match[6]
    if (offset && !isZ(offset)) parseOffsetNanoseconds(offset)
    if (!date && offset && isZ(offset))
      throw new RangeErrorConstructor('Time-only string cannot use Z')
  }
  if (annotations.timeZone !== undefined) return annotations.timeZone
  if (offset && isZ(offset)) return 'UTC'
  if (offset !== undefined) {
    parseOffsetNanoseconds(offset, true)
    return offset
  }
  throw new RangeErrorConstructor(
    'Timezone string needs an offset or annotation'
  )
}

// Temporal comparison §13.35 steps24–29: retain annotation and raw offset beside local fields
// https://tc39.es/proposal-temporal/#sec-temporal-parseisodatetime
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
  const index = bracketIndex(value)
  if (index < 0) throw new RangeErrorConstructor('Timezone annotation required')
  const body = stringPart(value, 0, index),
    annotations = validateAnnotations(stringPart(value, index))
  if (annotations.timeZone === undefined)
    throw new RangeErrorConstructor('Timezone annotation required')
  const offset = suffixOffset(body)
  // Keep local fields independent of any supplied UTC offset.
  if (endsInZ(body) && !hasTimeMarker(body))
    throw new RangeErrorConstructor('Offset requires time')
  const fields = parseISODateParts(withoutZ(body) + stringPart(value, index))
  return {
    fields,
    timeZone: annotations.timeZone,
    offset: hasTimeMarker(body) ? offset : undefined,
  }
}
