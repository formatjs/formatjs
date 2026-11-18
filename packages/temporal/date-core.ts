import {
  nativeTemporal,
  type NativeTemporal,
  type NativeDateSnapshot,
} from '#packages/temporal/native.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'
import {
  DayFromYear,
  DaysInYear,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'
import {
  calendarToEpochDay,
  calendarIds,
  calendarEra,
  calendarYearFromEra,
  calendarFromEpochDay,
  calendarFromEpochDayRaw,
  calendarDateUntilRaw,
  daysInMonth,
  monthsInYear,
  calendarStartOfYear,
  addNormalizedCalendarDate,
  dayCheck,
  type CalendarId,
  type Overflow,
  type CalendarDate,
} from '#packages/temporal/calendar.js'
import {isoToEpochNanoseconds} from '#packages/temporal/kernel.js'
import {optionsObject} from '#packages/temporal/rounding.js'
import {
  getDateSlot,
  getZonedSlot,
  getDateTimeSlot,
  getTimeSlot,
  getYearMonthSlot,
  getMonthDaySlot,
  isoDateFields,
  type DateSlot,
} from '#packages/temporal/plain-slots.js'
import {
  zeroDuration,
  durationNanoseconds,
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
function calendarSlot(value: object): {calendar: string} | undefined {
  return (
    getZonedSlot(value) ??
    getDateSlot(value) ??
    getDateTimeSlot(value) ??
    getYearMonthSlot(value) ??
    getMonthDaySlot(value)
  )
}
export function calendarFromObject(item: Record<string, unknown>): string {
  return calendarSlot(item)?.calendar ?? calendarId(item.calendar)
}
export function calendarId(value: unknown = 'iso8601'): string {
  const slot = calendarSlot(value as object)
  if (slot) return slot.calendar
  if (typeof value !== 'string')
    throw new TypeError('Calendar must be a string')
  const id = (
    /^[A-Za-z][A-Za-z0-9-]*$/.test(value) && !/^[Tt]\d/.test(value)
      ? value
      : parseCalendarString(value)
  ).toLowerCase()
  return supportedCalendar(id)
}
export function constructorCalendar(value: unknown = 'iso8601'): string {
  if (typeof value !== 'string')
    throw new TypeError('Calendar must be a string')
  return supportedCalendar(value.toLowerCase())
}
function supportedCalendar(value: string): CalendarId {
  const id =
    value === 'islamicc'
      ? 'islamic-civil'
      : value === 'ethiopic-amete-alem'
        ? 'ethioaa'
        : value
  if (!calendarIds.includes(id as CalendarId))
    throw new RangeError('Unsupported calendar')
  return id as CalendarId
}
function baseCalendar(calendar: string): CalendarId {
  return calendar as CalendarId
}
export function resolveCalendarYear(
  calendar: string,
  fields: Record<string, unknown>,
  shape: 'date' | 'year-month' | 'month-day' = 'date'
): number | undefined {
  let year = fields.year as number | undefined
  const supportsEra = !['iso8601', 'chinese', 'dangi'].includes(calendar)
  const needsYear =
    shape !== 'month-day' ||
    (calendar !== 'iso8601' &&
      (fields.monthCode === undefined || fields.month !== undefined))
  if (
    needsYear &&
    year === undefined &&
    !(supportsEra && fields.era !== undefined && fields.eraYear !== undefined)
  )
    throw new TypeError('Year required')
  if (
    supportsEra &&
    (fields.era === undefined) !== (fields.eraYear === undefined)
  )
    throw new TypeError('era and eraYear required together')
  if (shape !== 'year-month' && fields.day === undefined)
    throw new TypeError('Day required')
  if (fields.month === undefined && fields.monthCode === undefined)
    throw new TypeError('Month or monthCode required')
  if (supportsEra && fields.era !== undefined) {
    const resolved = calendarYearFromEra(
      baseCalendar(calendar),
      fields.era as string,
      fields.eraYear as number
    )
    if (year !== undefined && year !== resolved)
      throw new RangeError('Year and era disagree')
    year = resolved
  }
  return year
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
const dateSnapshots = new WeakMap<
  DateSlot,
  {owner: NativeTemporal; value: NativeDateSnapshot}
>()
export function nativeDateSnapshot(
  slot: DateSlot,
  extended = false,
  nanoseconds?: bigint
): NativeDateSnapshot | undefined {
  const owner = nativeTemporal()
  if (!owner) return undefined
  if (
    Math.abs(slot.epochDay) > 110000000 ||
    (!extended && (slot.epochDay < -100000001 || slot.epochDay > 100000000))
  )
    throw new RangeError('Calendar date out of range')
  if (
    import.meta.formatjsTemporalNativeData === true &&
    slot.properties?.owner === owner
  )
    return slot.properties
  const existing = dateSnapshots.get(slot)
  if (existing?.owner === owner) return existing.value
  const value =
    slot.properties?.owner === owner
      ? slot.properties
      : owner.calendarProperties(
          baseCalendar(slot.calendar),
          slot.epochDay,
          extended,
          nanoseconds
        )
  dateSnapshots.set(slot, {owner, value})
  return value
}
export function dateFields(slot: DateSlot, extended = false): CalendarDate {
  const value = nativeDateSnapshot(slot, extended)
  if (import.meta.formatjsTemporalNativeData === true || value) {
    if (!value!.date) throw new RangeError('Calendar date out of range')
    return value!.date
  }
  return (extended ? calendarFromEpochDayRaw : calendarFromEpochDay)(
    baseCalendar(slot.calendar),
    slot.epochDay
  )
}
export function dateFieldsView(
  slot: DateSlot,
  extended = false
): Readonly<CalendarDate> {
  if (
    import.meta.formatjsTemporalNativeData !== true &&
    !nativeTemporal() &&
    slot.calendar === 'iso8601' &&
    (extended || (slot.epochDay >= -100000001 && slot.epochDay <= 100000000))
  ) {
    const fields = slot[isoDateFields]
    if (fields) return fields
  }
  return dateFields(slot, extended)
}
export function dayFromFields(
  calendar: string,
  fields: Record<string, unknown>,
  overflow: Overflow
): number {
  const year = resolveCalendarYear(calendar, fields)!
  if (fields.day === undefined) throw new TypeError('Day required')
  return calendarToEpochDay(
    baseCalendar(calendar),
    {
      year,
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
type DateFieldShape = 'date' | 'year-month' | 'year'
const orderedDateFields = [
  'day',
  'era',
  'eraYear',
  'hour',
  'microsecond',
  'millisecond',
  'minute',
  'month',
  'monthCode',
  'nanosecond',
  'offset',
  'second',
  'timeZone',
  'year',
] as const
export function dateFieldNames(
  calendar: string,
  withTime: boolean,
  shape: DateFieldShape = 'date',
  extra: string[] = []
): string[] {
  const result: string[] = []
  for (let index = 0; index < orderedDateFields.length; index++) {
    const key = orderedDateFields[index]
    let include: boolean
    if (key === 'day') include = shape === 'date'
    else if (key === 'era' || key === 'eraYear')
      include = !['iso8601', 'chinese', 'dangi'].includes(calendar)
    else if (key === 'month' || key === 'monthCode') include = shape !== 'year'
    else if (key === 'year') include = true
    else if (key === 'offset' || key === 'timeZone')
      include = extra.includes(key)
    else include = withTime
    if (include) result[result.length] = key
  }
  return result
}
export function dateFieldValue(key: string, value: unknown): string | number {
  if (key === 'era') return ToString(value)
  if (key === 'monthCode') {
    const primitive = object(value) ? ToPrimitive(value, 'string') : value
    if (typeof primitive !== 'string')
      throw new TypeError('monthCode must be a string')
    if (!/^M\d{2}L?$/.test(primitive))
      throw new RangeError('Invalid monthCode syntax')
    return primitive
  }
  const result = integer(value)
  if ((key === 'month' || key === 'day') && result <= 0)
    throw new RangeError('Month and day must be positive')
  return result
}
const isoDateFieldNames = ['day', 'month', 'monthCode', 'year']
const createObject = Object.create
const fieldRecordPrototype = Object.freeze(createObject(null))
const isoYearMonthFieldNames = ['month', 'monthCode', 'year']
const isoDateTimeFieldNames = [
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
export function readDateFields(
  item: Record<string, unknown>,
  withTime: boolean,
  partial = false,
  shape: DateFieldShape = 'date',
  calendar = 'iso8601'
): Record<string, unknown> {
  const result = createObject(fieldRecordPrototype) as Record<string, unknown>
  let any = false
  const names =
    calendar === 'iso8601' && shape === 'date'
      ? withTime
        ? isoDateTimeFieldNames
        : isoDateFieldNames
      : calendar === 'iso8601' && !withTime && shape === 'year-month'
        ? isoYearMonthFieldNames
        : dateFieldNames(calendar, withTime, shape)
  for (let index = 0; index < names.length; index++) {
    const key = names[index],
      value = item[key]
    if (value !== undefined) {
      result[key] = dateFieldValue(key, value)
      any = true
    }
  }
  if (partial && !any) throw new TypeError('At least one field required')
  return result
}
export function mergeDateFields(
  calendar: string,
  fields: Readonly<CalendarDate> | Record<string, unknown>,
  updates: Record<string, unknown>
): Record<string, unknown> {
  if (calendar === 'iso8601') {
    const monthCode = fields.monthCode
    return {
      ...fields,
      month: monthCode === undefined ? fields.month : undefined,
      monthCode: updates.month === undefined ? monthCode : undefined,
      ...updates,
    }
  }
  // Own placeholders avoid inherited setters when fields are cleared.
  const base: Record<string, unknown> = {
    year: undefined,
    month: undefined,
    monthCode: undefined,
    era: undefined,
    eraYear: undefined,
    ...fields,
  }
  // ISODateToFields carries monthCode, not an ordinal month from the old year.
  if (base.monthCode !== undefined) base.month = undefined
  if (updates.month !== undefined) base.monthCode = undefined
  if (
    updates.year !== undefined ||
    updates.era !== undefined ||
    updates.eraYear !== undefined
  ) {
    base.year = undefined
    base.era = undefined
    base.eraYear = undefined
  }
  if (
    calendar === 'japanese' &&
    (updates.day !== undefined ||
      updates.month !== undefined ||
      updates.monthCode !== undefined)
  ) {
    base.era = undefined
    base.eraYear = undefined
  }
  return {...base, ...updates}
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
  return dayCheck(
    addNormalizedCalendarDate(
      calendar,
      dateFieldsView(slot),
      duration,
      overflow
    ).epochDay
  )
}
export function calendarNameOption(
  value: unknown
): 'auto' | 'always' | 'never' | 'critical' {
  const option = value === undefined ? 'auto' : ToString(value)
  if (!['auto', 'always', 'never', 'critical'].includes(option))
    throw new RangeError('Invalid calendarName')
  return option as 'auto' | 'always' | 'never' | 'critical'
}
const twoDigitDateParts = [
  '00',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
]
export function formatISODate(
  epochDay: number,
  kind: 'date' | 'year-month' | 'month-day' = 'date',
  fields: Readonly<CalendarDate> = calendarFromEpochDayRaw('iso8601', epochDay)
): string {
  const month = twoDigitDateParts[fields.month],
    day = twoDigitDateParts[fields.day]
  if (kind === 'month-day') return month + '-' + day
  const year =
    fields.year >= 1000 && fields.year <= 9999
      ? String(fields.year)
      : fields.year >= 0 && fields.year < 1000
        ? String(fields.year).padStart(4, '0')
        : (fields.year < 0 ? '-' : '+') +
          String(Math.abs(fields.year)).padStart(6, '0')
  return year + '-' + month + (kind === 'year-month' ? '' : '-' + day)
}
export function calendarAnnotation(calendar: string, value: unknown): string {
  const option = calendarNameOption(value)
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
  const value = nativeDateSnapshot(slot, extended)
  if (import.meta.formatjsTemporalNativeData === true || value) {
    if (value!.errors.includes(key))
      throw new RangeError('Calendar field out of range')
    if (
      key === 'year' ||
      key === 'month' ||
      key === 'monthCode' ||
      key === 'day'
    ) {
      if (!value!.date) throw new RangeError('Calendar date out of range')
      return value!.date[key]
    }
    if (
      (key === 'weekOfYear' || key === 'yearOfWeek') &&
      slot.calendar !== 'iso8601'
    )
      return undefined
    return value!.values[key] as string | number | boolean | undefined
  }
  const cacheISO =
      slot.calendar === 'iso8601' &&
      (extended || (slot.epochDay >= -100000001 && slot.epochDay <= 100000000)),
    fields = cacheISO
      ? (slot[isoDateFields] ??= dateFields(slot, extended))
      : dateFields(slot, extended),
    cal = baseCalendar(slot.calendar)
  switch (key) {
    case 'era':
      return calendarEra(cal, slot.epochDay, extended)?.era
    case 'eraYear':
      return calendarEra(cal, slot.epochDay, extended)?.eraYear
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
      return (
        slot.epochDay -
        (cal === 'iso8601'
          ? DayFromYear(fields.year)
          : calendarStartOfYear(cal, fields.year)) +
        1
      )
    case 'daysInWeek':
      return 7
    case 'daysInMonth':
      if (cal === 'iso8601') {
        if (fields.month === 2) return DaysInYear(fields.year) === 366 ? 29 : 28
        return fields.month === 4 ||
          fields.month === 6 ||
          fields.month === 9 ||
          fields.month === 11
          ? 30
          : 31
      }
      return daysInMonth(cal, fields.year, fields.month)
    case 'monthsInYear':
      return monthsInYear(cal, fields.year)
    case 'daysInYear':
      if (cal === 'iso8601') return DaysInYear(fields.year)
      return (
        calendarStartOfYear(cal, fields.year + 1) -
        calendarStartOfYear(cal, fields.year)
      )
    case 'inLeapYear':
      if (cal === 'iso8601') return DaysInYear(fields.year) === 366
      return ['hebrew', 'chinese', 'dangi'].includes(cal)
        ? monthsInYear(cal, fields.year) === 13
        : calendarStartOfYear(cal, fields.year + 1) -
            calendarStartOfYear(cal, fields.year) ===
            (cal === 'islamic-civil' ||
            cal === 'islamic-tbla' ||
            cal === 'islamic-umalqura'
              ? 355
              : 366)
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
  const bound = 8640000086400000000000n
  if (value <= -bound || value >= bound)
    throw new RangeError('Local date out of range')
  return value
}

export function dateUntil(
  start: DateSlot,
  end: number,
  largest: string
): DurationFields {
  return {
    ...zeroDuration(),
    ...calendarDateUntilRaw(
      baseCalendar(start.calendar),
      start.epochDay,
      end,
      largest
    ),
  }
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
  return roundRelativeDifference(
    start,
    end,
    largest,
    smallest,
    increment,
    mode,
    since,
    {
      zoned: false,
      unrounded: value => unroundedDifference(start, value, calendar, largest),
      endpoint: fields =>
        BigInt(
          addDate({epochDay: epochDayOf(start), calendar}, fields, 'constrain')
        ) *
          nsPerDay +
        timeOf(start),
    }
  )
}
interface DifferenceAnchor {
  zoned: boolean
  unrounded(end: bigint): DurationFields
  endpoint(fields: DurationFields): bigint
}
const differenceUnits = [
  'year',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
  'microsecond',
  'nanosecond',
] as const
export function roundRelativeDifference(
  start: bigint,
  end: bigint,
  largest: string,
  smallest: string,
  increment: number,
  mode: RoundingMode,
  since: boolean,
  anchor: DifferenceAnchor
): DurationFields {
  const largeIndex = differenceUnits.indexOf(
      largest as (typeof differenceUnits)[number]
    ),
    smallIndex = differenceUnits.indexOf(
      smallest as (typeof differenceUnits)[number]
    ),
    sinceSign = since ? -1n : 1n
  if (smallIndex >= 4) {
    const maximum = [24, 60, 60, 1000, 1000, 1000][smallIndex - 4]
    if (increment >= maximum || maximum % increment)
      throw new RangeError('Invalid rounding increment')
  }
  if (start === end) return zeroDuration()
  const sign = end < start ? -1 : 1,
    physicalSign = BigInt(sign)
  let result = anchor.unrounded(end),
    rounded = end,
    expanded = false
  const irregular = smallIndex < 3 || (anchor.zoned && smallIndex === 3)
  if (irregular) {
    const prefix = zeroDuration()
    for (let index = largeIndex; index < smallIndex; index++) {
      const key = `${differenceUnits[index]}s` as keyof DurationFields
      prefix[key] = result[key]
    }
    const key = `${smallest}s` as keyof DurationFields,
      count =
        smallest === 'week'
          ? result.weeks + Math.trunc(result.days / 7)
          : result[key]
    let truncated = Math.trunc(count / increment) * increment
    prefix[key] = truncated
    let a = anchor.endpoint(prefix)
    prefix[key] = truncated + sign * increment
    let b = anchor.endpoint(prefix)
    if ((end - a) * physicalSign < 0n || (b - end) * physicalSign < 0n) {
      truncated += sign * increment
      a = b
      prefix[key] = truncated + sign * increment
      b = anchor.endpoint(prefix)
      expanded = true
    }
    let expand = false
    if (a !== end) {
      const positive = physicalSign * sinceSign > 0n
      expand =
        end === b ||
        mode === 'expand' ||
        (mode === 'ceil' && positive) ||
        (mode === 'floor' && !positive)
      if (mode.startsWith('half')) {
        const distance = (end - a) * physicalSign,
          span = (b - a) * physicalSign
        expand =
          distance * 2n > span ||
          (distance * 2n === span &&
            (mode === 'halfExpand' ||
              (mode === 'halfCeil' && positive) ||
              (mode === 'halfFloor' && !positive) ||
              (mode === 'halfEven' &&
                Math.abs(truncated / increment) % 2 === 1)))
      }
    }
    prefix[key] = (expand ? truncated + sign * increment : truncated) || 0
    result = prefix
    rounded = expand ? b : a
    expanded ||= expand
  } else if (anchor.zoned && largeIndex < 4) {
    const time = durationNanoseconds(result, false),
      quantum = BigInt(increment) * timeUnitNanoseconds[smallest as TimeUnit]
    let value = sinceSign * roundDuration(time * sinceSign, quantum, mode)
    if (value !== time) {
      const date = {...result}
      for (let index = 4; index < differenceUnits.length; index++)
        date[`${differenceUnits[index]}s` as keyof DurationFields] = 0
      const origin = anchor.endpoint(date),
        next = {...date, days: date.days + sign},
        span = anchor.endpoint(next) - origin
      expanded = (value - span) * physicalSign >= 0n
      if (expanded) {
        date.days += sign
        value =
          sinceSign * roundDuration((value - span) * sinceSign, quantum, mode)
        rounded = origin + span + value
      } else rounded = origin + value
      result = {
        ...date,
        ...balanceDurationTime(value, 4),
        years: date.years,
        months: date.months,
        weeks: date.weeks,
        days: date.days,
      }
    }
  } else {
    const time = durationNanoseconds(result),
      quantum =
        BigInt(increment) *
        (smallest === 'day'
          ? nsPerDay
          : timeUnitNanoseconds[smallest as TimeUnit])
    const value = sinceSign * roundDuration(time * sinceSign, quantum, mode)
    const days = largeIndex < 4 ? Number(value / nsPerDay) : 0
    expanded = Math.sign(days - result.days) === sign
    rounded = end + value - time
    result = {
      ...result,
      ...balanceDurationTime(
        largeIndex < 4 ? value % nsPerDay : value,
        Math.max(4, largeIndex)
      ),
      years: result.years,
      months: result.months,
      weeks: result.weeks,
      days,
    }
  }
  // Keep the chosen rounding quantum; only bubble when a larger boundary was crossed.
  if (expanded && smallest !== 'week') {
    for (
      let index = Math.min(smallIndex, 3) - 1;
      index >= largeIndex;
      index--
    ) {
      if (index === 2 && largest !== 'week') continue
      const next = zeroDuration()
      for (let keep = 0; keep < index; keep++) {
        const key = `${differenceUnits[keep]}s` as keyof DurationFields
        next[key] = result[key]
      }
      const key = `${differenceUnits[index]}s` as keyof DurationFields
      next[key] = result[key] + sign
      const candidate = anchor.endpoint(next)
      if ((rounded - candidate) * physicalSign < 0n) break
      result = next
    }
  }
  if (since) {
    const keys = Object.keys(result) as (keyof DurationFields)[]
    for (let index = 0; index < keys.length; index++)
      result[keys[index]] = -result[keys[index]] || 0
  }
  return result
}
