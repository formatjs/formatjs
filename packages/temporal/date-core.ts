import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'
import {
  DayFromYear,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'
import {
  calendarToEpochDay,
  calendarFromEpochDay,
  calendarFromEpochDayRaw,
  daysInMonth,
  monthsInYear,
  calendarStartOfYear,
  addCalendarDate,
  addCalendarDateRaw,
  calendarToEpochDayRaw,
  type CalendarId,
  type Overflow,
  type CalendarDate,
} from '#packages/temporal/calendar.js'
import {
  isoToEpochNanoseconds,
  epochNanosecondsToISO,
} from '#packages/temporal/kernel.js'
import {optionsObject} from '#packages/temporal/rounding.js'
import {
  getDateSlot,
  getZonedSlot,
  getDateTimeSlot,
  getTimeSlot,
  getYearMonthSlot,
  getMonthDaySlot,
  type DateSlot,
} from '#packages/temporal/plain-slots.js'
import {
  zeroDuration,
  balanceDurationTime,
  type DurationFields,
} from '#packages/temporal/duration-core.js'
import {
  roundDuration,
  timeUnitNanoseconds,
  type TimeUnit,
  type RoundingMode,
} from '#packages/temporal/rounding.js'
import {parseCalendarString} from '#packages/temporal/instant-string.js'

export const nsPerDay = 86_400_000_000_000n
export const clockNames = [
  'hour',
  'minute',
  'second',
  'millisecond',
  'microsecond',
  'nanosecond',
] as const
export const clockBounds: readonly number[] = [23, 59, 59, 999, 999, 999]
export const clockFactors: readonly bigint[] = [
  3_600_000_000_000n,
  60_000_000_000n,
  1_000_000_000n,
  1_000_000n,
  1000n,
  1n,
]
export function object(value: unknown): value is Record<string, unknown> {
  return (
    value !== null && (typeof value === 'object' || typeof value === 'function')
  )
}
export function integer(value: unknown): number {
  const result = Math.trunc(+(value as number))
  if (!Number.isInteger(result)) throw new RangeError('Expected finite number')
  return result || 0
}
export function overflowOption(options: unknown): Overflow {
  const raw = optionsObject(options).overflow
  const value = raw === undefined ? 'constrain' : ToString(raw)
  if (value !== 'constrain' && value !== 'reject')
    throw new RangeError('Invalid overflow')
  return value
}
export function calendarId(value: unknown = 'iso8601'): string {
  const slot =
    getZonedSlot(value as object) ??
    getDateSlot(value as object) ??
    getDateTimeSlot(value as object) ??
    getYearMonthSlot(value as object) ??
    getMonthDaySlot(value as object)
  if (slot) return slot.calendar
  if (typeof value !== 'string')
    throw new TypeError('Calendar must be a string')
  const id = (
    /^[A-Za-z][A-Za-z0-9-]*$/.test(value) && !/^[Tt]\d/.test(value)
      ? value
      : parseCalendarString(value)
  ).toLowerCase()
  if (!['iso8601', 'gregory', 'hebrew'].includes(id))
    throw new RangeError('Unsupported calendar')
  return id
}
export function constructorCalendar(value: unknown = 'iso8601'): string {
  if (typeof value !== 'string')
    throw new TypeError('Calendar must be a string')
  if (!['iso8601', 'gregory', 'hebrew'].includes(value.toLowerCase()))
    throw new RangeError('Unsupported calendar')
  return value.toLowerCase()
}
function baseCalendar(calendar: string): CalendarId {
  return calendar === 'gregory' ? 'iso8601' : (calendar as CalendarId)
}
export function epochDayOf(value: bigint): number {
  let days = value / nsPerDay
  if (value < 0n && value % nsPerDay !== 0n) days--
  return Number(days)
}
export function timeOf(value: bigint): bigint {
  return ((value % nsPerDay) + nsPerDay) % nsPerDay
}
export function isoDay(year: number, month: number, day: number): number {
  return epochDayOf(isoToEpochNanoseconds({year, month, day, hour: 12}))
}
export function dateFields(slot: DateSlot, extended = false): CalendarDate {
  return (extended ? calendarFromEpochDayRaw : calendarFromEpochDay)(
    baseCalendar(slot.calendar),
    slot.epochDay
  )
}
export function dayFromFields(
  calendar: string,
  fields: Record<string, unknown>,
  overflow: Overflow
): number {
  if (fields.year === undefined) throw new TypeError('Year required')
  if (fields.day === undefined) throw new TypeError('Day required')
  return calendarToEpochDay(
    baseCalendar(calendar),
    {
      year: fields.year as number,
      month: fields.month as number | undefined,
      monthCode: fields.monthCode as string | undefined,
      day: fields.day as number,
    },
    overflow
  )
}
export function clockNanoseconds(
  fields: Record<string, unknown>,
  overflow: Overflow
): bigint {
  let value = 0n
  for (let index = 0; index < 6; index++) {
    let field = (fields[clockNames[index]] ?? 0) as number
    if (overflow === 'constrain')
      field = Math.max(0, Math.min(clockBounds[index], field))
    if (field < 0 || field > clockBounds[index])
      throw new RangeError('Time out of range')
    value += BigInt(field) * clockFactors[index]
  }
  return value
}
export function readDateFields(
  item: Record<string, unknown>,
  withTime: boolean,
  partial = false,
  shape: 'date' | 'year-month' = 'date'
): Record<string, unknown> {
  const names = withTime
    ? [
        'day',
        'hour',
        'microsecond',
        'millisecond',
        'minute',
        'month',
        'monthCode',
        'nanosecond',
        'second',
        'year',
      ]
    : ['day', 'month', 'monthCode', 'year']
  const result = Object.create(null) as Record<string, unknown>
  let any = false
  for (let index = 0; index < names.length; index++) {
    const key = names[index]
    if (shape === 'year-month' && key === 'day') continue
    const value = item[key]
    if (value !== undefined) {
      if (key === 'monthCode') {
        const primitive = object(value) ? ToPrimitive(value, 'string') : value
        if (typeof primitive !== 'string')
          throw new TypeError('monthCode must be a string')
        if (!/^M\d{2}L?$/.test(primitive))
          throw new RangeError('Invalid monthCode syntax')
        result[key] = primitive
      } else {
        result[key] = integer(value)
        if ((key === 'month' || key === 'day') && (result[key] as number) <= 0)
          throw new RangeError('Month and day must be positive')
      }
      any = true
    }
  }
  if (partial && !any) throw new TypeError('At least one field required')
  return result
}
export function partialObject(item: unknown): Record<string, unknown> {
  if (
    !object(item) ||
    getZonedSlot(item) ||
    getDateSlot(item) ||
    getDateTimeSlot(item) ||
    getTimeSlot(item) !== undefined ||
    getYearMonthSlot(item) ||
    getMonthDaySlot(item)
  )
    throw new TypeError('Expected partial Temporal object')
  if (item.calendar !== undefined || item.timeZone !== undefined)
    throw new TypeError('Unexpected calendar or timeZone')
  return item
}
export function addDate(
  slot: DateSlot,
  duration: DurationFields,
  overflow: Overflow
): number {
  const calendar = baseCalendar(slot.calendar)
  const result = addCalendarDate(calendar, dateFields(slot), duration, overflow)
  return calendarToEpochDay(calendar, result, 'reject')
}
export function calendarAnnotation(calendar: string, value: unknown): string {
  const option = value === undefined ? 'auto' : ToString(value)
  if (!['auto', 'always', 'never', 'critical'].includes(option))
    throw new RangeError('Invalid calendarName')
  return option === 'never' || (option === 'auto' && calendar === 'iso8601')
    ? ''
    : `[${option === 'critical' ? '!' : ''}u-ca=${calendar}]`
}
export const datePropertyNames = [
  'calendarId',
  'era',
  'eraYear',
  'year',
  'month',
  'monthCode',
  'day',
  'dayOfWeek',
  'dayOfYear',
  'weekOfYear',
  'yearOfWeek',
  'daysInWeek',
  'daysInMonth',
  'daysInYear',
  'monthsInYear',
  'inLeapYear',
] as const
export function dateProperty(
  slot: DateSlot,
  key: string,
  extended = false
): string | number | boolean | undefined {
  if (key === 'calendarId') return slot.calendar
  const fields = dateFields(slot, extended),
    cal = baseCalendar(slot.calendar)
  switch (key) {
    case 'era':
      return slot.calendar === 'gregory'
        ? fields.year > 0
          ? 'ce'
          : 'bce'
        : undefined
    case 'eraYear':
      return slot.calendar === 'gregory'
        ? fields.year > 0
          ? fields.year
          : 1 - fields.year
        : undefined
    case 'year':
      return fields.year
    case 'month':
      return fields.month
    case 'monthCode':
      return fields.monthCode
    case 'day':
      return fields.day
    case 'dayOfWeek':
      return ((((slot.epochDay + 3) % 7) + 7) % 7) + 1
    case 'dayOfYear':
      return slot.epochDay - calendarStartOfYear(cal, fields.year) + 1
    case 'daysInWeek':
      return 7
    case 'daysInMonth':
      return daysInMonth(cal, fields.year, fields.month)
    case 'monthsInYear':
      return monthsInYear(cal, fields.year)
    case 'daysInYear':
      return (
        calendarStartOfYear(cal, fields.year + 1) -
        calendarStartOfYear(cal, fields.year)
      )
    case 'inLeapYear':
      return cal === 'hebrew'
        ? monthsInYear(cal, fields.year) === 13
        : calendarStartOfYear(cal, fields.year + 1) -
            calendarStartOfYear(cal, fields.year) ===
            366
    case 'weekOfYear':
    case 'yearOfWeek': {
      if (slot.calendar !== 'iso8601') return undefined
      const weekday = ((((slot.epochDay + 3) % 7) + 7) % 7) + 1
      const thursday = slot.epochDay + 4 - weekday
      const year = YearFromTime(thursday * 86400000)
      return key === 'yearOfWeek'
        ? year
        : Math.floor((thursday - DayFromYear(year)) / 7) + 1
    }
  }
  return undefined
}
export function checkDateTime(value: bigint): bigint {
  epochNanosecondsToISO(value)
  return value
}

function addDateForDifference(
  slot: DateSlot,
  duration: DurationFields,
  overflow: Overflow
): number {
  const cal = baseCalendar(slot.calendar)
  return calendarToEpochDayRaw(
    cal,
    addCalendarDateRaw(cal, dateFields(slot, true), duration, overflow),
    'reject'
  )
}
export function dateUntil(
  start: DateSlot,
  end: number,
  largest: string
): DurationFields {
  const result = zeroDuration(),
    sign = Math.sign(end - start.epochDay)
  if (sign === 0) return result
  let anchor = start.epochDay
  const first = dateFields(start, true),
    last = dateFields({epochDay: end, calendar: start.calendar}, true)
  if (largest === 'year') {
    result.years = last.year - first.year
    anchor = addDateForDifference(start, result, 'constrain')
    if ((anchor - end) * sign > 0) {
      result.years -= sign
      anchor = addDateForDifference(start, result, 'constrain')
    }
  }
  if (largest === 'year' || largest === 'month') {
    const current = dateFields(
      {epochDay: anchor, calendar: start.calendar},
      true
    )
    const serial = (fields: CalendarDate): number =>
      start.calendar === 'hebrew'
        ? Math.floor((235 * fields.year - 234) / 19) + fields.month - 1
        : fields.year * 12 + fields.month - 1
    result.months = serial(last) - serial(current)
    anchor = addDateForDifference(start, result, 'constrain')
    if ((anchor - end) * sign > 0) {
      result.months -= sign
      anchor = addDateForDifference(start, result, 'constrain')
    }
  }
  result.days = end - anchor
  if (largest === 'week') {
    result.weeks = Math.trunc(result.days / 7)
    result.days %= 7
  }
  return result
}
function unroundedDifference(
  start: bigint,
  end: bigint,
  calendar: string,
  largest: string
): DurationFields {
  if (Object.hasOwn(timeUnitNanoseconds, largest))
    return balanceDurationTime(
      end - start,
      clockNames.indexOf(largest as TimeUnit) + 4
    )
  const sign = end < start ? -1 : end > start ? 1 : 0
  let lastDay = epochDayOf(end),
    time = timeOf(end) - timeOf(start)
  if (BigInt(sign) * time < 0n) {
    lastDay -= sign
    time += BigInt(sign) * nsPerDay
  }
  const result = dateUntil(
    {epochDay: epochDayOf(start), calendar},
    lastDay,
    largest
  )
  const clock = balanceDurationTime(time, 4)
  const timeFields = [
    'hours',
    'minutes',
    'seconds',
    'milliseconds',
    'microseconds',
    'nanoseconds',
  ] as const
  for (let index = 0; index < timeFields.length; index++) {
    const name = timeFields[index]
    result[name] = clock[name]
  }
  return result
}
function relativeEndpoint(
  start: bigint,
  calendar: string,
  unit: string,
  count: number,
  prefix: DurationFields
): bigint {
  const duration = {...prefix}
  duration[`${unit}s` as keyof DurationFields] = count
  const day = addDate(
    {epochDay: epochDayOf(start), calendar},
    duration,
    'constrain'
  )
  return BigInt(day) * nsPerDay + timeOf(start)
}
export function roundedDateTimeDifference(
  start: bigint,
  end: bigint,
  calendar: string,
  largest: string,
  smallest: string,
  increment: number,
  mode: RoundingMode,
  since: boolean
): DurationFields {
  const sinceSign = since ? -1n : 1n
  if (
    (largest === 'day' || largest === 'week') &&
    (smallest === 'day' || smallest === 'week')
  ) {
    const value = roundDuration(
      (end - start) * sinceSign,
      nsPerDay * BigInt(increment) * (smallest === 'week' ? 7n : 1n),
      mode
    )
    const fields = zeroDuration()
    fields.days = Number(value / nsPerDay)
    if (largest === 'week') {
      fields.weeks = Math.trunc(fields.days / 7)
      fields.days %= 7
    }
    return fields
  }
  let rounded: bigint
  if (Object.hasOwn(timeUnitNanoseconds, smallest)) {
    const unit = smallest as TimeUnit,
      maximum = [24, 60, 60, 1000, 1000, 1000][clockNames.indexOf(unit)]
    if (increment >= maximum || maximum % increment)
      throw new RangeError('Invalid rounding increment')
    rounded =
      start +
      sinceSign *
        roundDuration(
          (end - start) * sinceSign,
          timeUnitNanoseconds[unit] * BigInt(increment),
          mode
        )
  } else {
    if (start === end) return zeroDuration()
    const fields = unroundedDifference(start, end, calendar, largest)
    const prefix = zeroDuration()
    const dateUnits = ['year', 'month', 'week', 'day']
    for (let index = 0; index < dateUnits.length; index++) {
      const unit = dateUnits[index]
      if (unit === smallest) break
      const key = `${unit}s` as keyof DurationFields
      prefix[key] = fields[key]
    }
    const count =
      smallest === 'week'
        ? fields.weeks + Math.trunc(fields.days / 7)
        : fields[`${smallest}s` as keyof DurationFields]
    const truncated = Math.trunc(count / increment) * increment
    const a = relativeEndpoint(start, calendar, smallest, truncated, prefix)
    const physicalSign = end < start ? -1 : 1
    const b = relativeEndpoint(
      start,
      calendar,
      smallest,
      truncated + physicalSign * increment,
      prefix
    )
    if (a === end) rounded = a
    else {
      const positive = BigInt(physicalSign) * sinceSign > 0n
      let expand =
        mode === 'expand' ||
        (mode === 'ceil' && positive) ||
        (mode === 'floor' && !positive)
      if (mode.startsWith('half')) {
        const distance = (end - a) * BigInt(physicalSign),
          span = (b - a) * BigInt(physicalSign)
        expand =
          2n * distance > span ||
          (2n * distance === span &&
            (mode === 'halfExpand' ||
              (mode === 'halfCeil' && positive) ||
              (mode === 'halfFloor' && !positive) ||
              (mode === 'halfEven' &&
                Math.abs(truncated / increment) % 2 === 1)))
      }
      rounded = expand
        ? relativeEndpoint(
            start,
            calendar,
            smallest,
            truncated + physicalSign * increment,
            prefix
          )
        : a
    }
  }
  const result = unroundedDifference(start, rounded, calendar, largest)
  if (since) {
    const keys = Object.keys(result) as (keyof DurationFields)[]
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index]
      result[key] = -result[key] || 0
    }
  }
  return result
}
