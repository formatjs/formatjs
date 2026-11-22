import {zeroPadDecimal} from '#packages/temporal/format-digits.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIncludes,
  arrayIndexOf,
  bigIntFrom,
  floor,
  mathAbs,
  mathMax,
  mathMin,
  mathSign,
  mathTrunc,
  numberFrom,
  numberIsInteger,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {createObject} from '#packages/temporal/intrinsics.js'
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
  isoDayFromPreparedFields,
  cachedISODateFields,
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
  type CalendarFields,
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
import {
  parseCalendarString,
  parseISODateParts,
  type ParsedDateFields,
} from '#packages/temporal/instant-string.js'

const stringToLowerCase = Function.prototype.call.bind(
  String.prototype.toLowerCase
) as (value: string) => string

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
  // Temporal comparison §3.5.4 step 2: test the Object branch, including callables.
  return IsObject(value)
}
export function integer(value: unknown): number {
  // Temporal comparison §13.40 steps1–3.
  // https://tc39.es/proposal-temporal/#sec-tointegerwithtruncation
  // §13.40 step1: unary + performs ToNumber, preserving user coercion and throws.
  // §13.40 step3: captured truncation is unobservable; finite inputs become integers.
  const result = mathTrunc(+(value as number))
  // §13.40 step2: truncation leaves NaN/infinities nonintegral; reject with intrinsic RangeError.
  if (!numberIsInteger(result))
    throw new RangeErrorConstructor('Expected finite number')
  // §13.40 step3: mathematical zero has no negative sign.
  return result || 0
}
// Temporal comparison §13.6 steps1–3: read overflow once, then default and validate
// https://tc39.es/proposal-temporal/#sec-temporal-gettemporaloverflowoption
export function overflowOption(options: unknown): Overflow {
  const raw = optionsObject(options).overflow
  const value = raw === undefined ? 'constrain' : ToString(raw)
  if (value !== 'constrain' && value !== 'reject')
    throw new RangeErrorConstructor('Invalid overflow')
  return value
}
// Proposal comparison §12.3.11 steps 1 and 1.a: Find a stored calendar on the five supported slot types.
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
  // Temporal comparison §12.3.11 steps1–4: slots precede the single calendar Get.
  // https://tc39.es/proposal-temporal/#sec-temporal-gettemporalcalendarslotvaluewithisodefault
  // Step3: undefined defaults to ISO in calendarId.
  return calendarSlot(item)?.calendar ?? calendarId(item.calendar)
}
// Proposal comparison §13.36 steps 1 and 3–5: Choose the bare calendar identifier fast path.
function bareCalendarIdentifier(value: string): boolean {
  if (value.length === 0) return false
  if (
    (value[0] === 'T' || value[0] === 't') &&
    value.length > 1 &&
    value[1] >= '0' &&
    value[1] <= '9'
  )
    return false
  for (let index = 0; index < value.length; index++) {
    const character = value[index]
    if (
      (character >= 'A' && character <= 'Z') ||
      (character >= 'a' && character <= 'z') ||
      (index > 0 &&
        ((character >= '0' && character <= '9') || character === '-'))
    )
      continue
    return false
  }
  return true
}
export function calendarId(value: unknown = 'iso8601'): string {
  // Temporal comparison §12.3.10 step1: use the five calendar-bearing slots.
  // https://tc39.es/proposal-temporal/#sec-temporal-totemporalcalendaridentifier
  const slot = calendarSlot(value as object)
  if (slot) return slot.calendar
  // Step2: withCalendar rejects undefined before this shared defaulting path.
  if (typeof value !== 'string')
    throw new TypeErrorConstructor('Calendar must be a string')
  // Steps3–4: parse the identifier, then canonicalize it.
  const id = stringToLowerCase(
    bareCalendarIdentifier(value) ? value : parseCalendarString(value)
  )
  return supportedCalendar(id)
}
// Temporal comparison §12.1.1 steps1–3: canonicalize the supplied primitive calendar name
// https://tc39.es/proposal-temporal/#sec-temporal-canonicalizecalendar
export function constructorCalendar(value: unknown = 'iso8601'): string {
  if (typeof value !== 'string')
    throw new TypeErrorConstructor('Calendar must be a string')
  return supportedCalendar(stringToLowerCase(value))
}
// Proposal comparison §3.5.4 steps 4 and 7–9 and §5.5.6 steps 4 and 8–10: Parse and canonicalize before reading overflow.
export function prepareDateTimeString(
  value: string,
  options: unknown
): ParsedDateFields {
  // ToTemporalDate 683–688; ToTemporalDateTime 824–830: syntax, calendar, options, then bounds.
  const fields = parseISODateParts(value)
  fields.calendar = constructorCalendar(fields.calendar)
  overflowOption(options)
  return fields
}
// Proposal comparison §12.1.1 steps 2–3: Check supported calendar IDs and resolve known aliases.
function supportedCalendar(value: string): CalendarId {
  const id =
    value === 'islamicc'
      ? 'islamic-civil'
      : value === 'ethiopic-amete-alem'
        ? 'ethioaa'
        : value
  if (!arrayIncludes(calendarIds, id as CalendarId))
    throw new RangeErrorConstructor('Unsupported calendar')
  return id as CalendarId
}
function baseCalendar(calendar: string): CalendarId {
  return calendar as CalendarId
}
// Temporal comparison §12.3.31 steps1.a–1.g/2.a: resolve required date fields and non-ISO eras
// https://tc39.es/proposal-temporal/#sec-temporal-calendarresolvefields
export function resolveCalendarYear(
  calendar: string,
  fields: Record<string, unknown>,
  shape: 'date' | 'year-month' | 'month-day' = 'date'
): number | undefined {
  let year = fields.year as number | undefined
  const supportsEra = !arrayIncludes(['iso8601', 'chinese', 'dangi'], calendar)
  const needsYear =
    shape !== 'month-day' ||
    (calendar !== 'iso8601' &&
      (fields.monthCode === undefined || fields.month !== undefined))
  if (
    needsYear &&
    year === undefined &&
    !(supportsEra && fields.era !== undefined && fields.eraYear !== undefined)
  )
    throw new TypeErrorConstructor('Year required')
  if (
    supportsEra &&
    (fields.era === undefined) !== (fields.eraYear === undefined)
  )
    throw new TypeErrorConstructor('era and eraYear required together')
  if (shape !== 'year-month' && fields.day === undefined)
    throw new TypeErrorConstructor('Day required')
  if (fields.month === undefined && fields.monthCode === undefined)
    throw new TypeErrorConstructor('Month or monthCode required')
  if (supportsEra && fields.era !== undefined) {
    const resolved = calendarYearFromEra(
      baseCalendar(calendar),
      fields.era as string,
      fields.eraYear as number
    )
    if (year !== undefined && year !== resolved)
      throw new RangeErrorConstructor('Year and era disagree')
    year = resolved
  }
  return year
}
export function epochDayOf(value: bigint): number {
  // ECMA-262 §21.4.1.3 step 1: Floor the epoch-day quotient, including negative
  // nanoseconds.
  let days = value / nsPerDay
  if (value < 0n && value % nsPerDay !== 0n) days--
  return numberFrom(days)
}
// Proposal comparison §7.5.33 steps 8.b and 10: Extract the anchor clock for relative endpoints.
export function timeOf(value: bigint): bigint {
  return ((value % nsPerDay) + nsPerDay) % nsPerDay
}
export function isoDay(year: number, month: number, day: number): number {
  // Temporal comparison §4.5.4 step1: NoonTimeRecord.
  // https://tc39.es/proposal-temporal/#sec-temporal-noontimerecord
  // §4.5.4 step1: hour 12 plus own-only zero defaults form noon, with zero day carry.
  // Temporal comparison §3.5.12 steps1–2.
  // https://tc39.es/proposal-temporal/#sec-temporal-isodatewithinlimits
  // §3.5.12 step1: combine the ISO date with that noon clock before checking local limits.
  return epochDayOf(isoToEpochNanoseconds({year, month, day, hour: 12}))
}
const dateSnapshots = new WeakMap<
  DateSlot,
  {owner: NativeTemporal; value: NativeDateSnapshot}
>()
// Proposal comparison §12.3.26 steps 1.b and 2: Reuse or request native calendar projection for a date slot.
export function nativeDateSnapshot(
  slot: DateSlot,
  extended = false,
  nanoseconds?: bigint
): NativeDateSnapshot | undefined {
  const owner = nativeTemporal()
  if (!owner) return undefined
  if (
    mathAbs(slot.epochDay) > 110000000 ||
    (!extended && (slot.epochDay < -100000001 || slot.epochDay > 100000000))
  )
    throw new RangeErrorConstructor('Calendar date out of range')
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
  // Proposal comparison §12.3.26 steps 1–2: Project the stored ISO day through
  // the selected calendar provider.
  const value = nativeDateSnapshot(slot, extended)
  if (import.meta.formatjsTemporalNativeData === true || value) {
    if (!value!.date)
      throw new RangeErrorConstructor('Calendar date out of range')
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
  // Temporal comparison §12.3.26 steps 1–2: reuse private ISO fields or project
  // through the calendar provider. Unread record fields may be elided.
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
// Temporal comparison §12.3.12 steps1–4: resolve, convert and guard the full date
// https://tc39.es/proposal-temporal/#sec-temporal-calendardatefromfields
export function dayFromFields(
  calendar: string,
  fields: Record<string, unknown>,
  overflow: Overflow
): number {
  const year = resolveCalendarYear(calendar, fields)!
  if (fields.day === undefined) throw new TypeErrorConstructor('Day required')
  if (calendar === 'iso8601')
    return isoDayFromPreparedFields(
      year,
      fields as unknown as CalendarFields,
      overflow
    )
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
// Temporal comparison §4.5.8 steps1–3: regulate prepared time fields before exact composition
// https://tc39.es/proposal-temporal/#sec-temporal-regulatetime
export function clockNanoseconds(
  fields: Record<string, unknown>,
  overflow: Overflow
): bigint {
  let value = 0n
  for (let index = 0; index < 6; index++) {
    let field = (fields[clockNames[index]] ?? 0) as number
    if (overflow === 'constrain')
      field = mathMax(0, mathMin(clockBounds[index], field))
    if (field < 0 || field > clockBounds[index])
      throw new RangeErrorConstructor('Time out of range')
    value += bigIntFrom(field) * clockFactors[index]
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
// Temporal comparison §12.3.3 steps2–8: prepare fixed lexicographic field names
// https://tc39.es/proposal-temporal/#sec-temporal-preparecalendarfields
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
      include = !arrayIncludes(['iso8601', 'chinese', 'dangi'], calendar)
    else if (key === 'month' || key === 'monthCode') include = shape !== 'year'
    else if (key === 'year') include = true
    else if (key === 'offset' || key === 'timeZone')
      include = arrayIncludes(extra, key)
    else include = withTime
    // Temporal comparison §12.3.3 step8: private List entries are own data.
    if (include) setDataProperty(result, `${result.length}`, key)
  }
  return result
}
// Proposal comparison §12.3.3 steps 9.c.iii.1, 9.c.iv.1, 9.c.v.1 and 9.c.vii.1: Convert prepared date field values.
export function dateFieldValue(key: string, value: unknown): string | number {
  if (key === 'era') return ToString(value)
  if (key === 'monthCode') {
    // Temporal comparison §12.2.1 steps1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal-parsemonthcode
    // §12.2.1 step1: use the string hint without coercing a primitive to String.
    const primitive = object(value) ? ToPrimitive(value, 'string') : value
    // §12.2.1 step2: reject non-string primitives.
    if (typeof primitive !== 'string')
      throw new TypeErrorConstructor('monthCode must be a string')
    // §12.2.1 step3: consume the whole MonthCode grammar; zero requires the leap suffix.
    const leap = primitive.length === 4 && primitive[3] === 'L'
    if (
      (primitive.length !== 3 && !leap) ||
      primitive[0] !== 'M' ||
      primitive[1] < '0' ||
      primitive[1] > '9' ||
      primitive[2] < '0' ||
      primitive[2] > '9' ||
      (primitive[1] === '0' && primitive[2] === '0' && !leap)
    )
      throw new RangeErrorConstructor('Invalid monthCode syntax')
    return primitive
  }
  // Temporal comparison §13.39 steps1–3: positive month/day conversion.
  // https://tc39.es/proposal-temporal/#sec-topositiveintegerwithtruncation
  // §13.39 step1: propagate ToIntegerWithTruncation's coercion and exceptions.
  const result = integer(value)
  // §13.39 step2: reject nonpositive values after truncation, including signed zero.
  if ((key === 'month' || key === 'day') && result <= 0)
    throw new RangeErrorConstructor('Month and day must be positive')
  // §13.39 step3: return the positive mathematical integer for month/day.
  return result
}
const isoDateFieldNames = ['day', 'month', 'monthCode', 'year']
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
function readISODateFields(
  item: Record<string, unknown>,
  partial: boolean,
  withDay: boolean
): Record<string, unknown> {
  // Proposal comparison §12.3.3 steps 6–11: Prepare ISO date fields in day,
  // month, monthCode, year order.
  const result = createObject(fieldRecordPrototype) as Record<string, unknown>
  let any = false
  if (withDay) {
    const value = item.day
    if (value !== undefined) {
      result.day = dateFieldValue('day', value)
      any = true
    }
  }
  const month = item.month
  if (month !== undefined) {
    result.month = dateFieldValue('month', month)
    any = true
  }
  const monthCode = item.monthCode
  if (monthCode !== undefined) {
    result.monthCode = dateFieldValue('monthCode', monthCode)
    any = true
  }
  const year = item.year
  if (year !== undefined) {
    result.year = dateFieldValue('year', year)
    any = true
  }
  if (partial && !any)
    throw new TypeErrorConstructor('At least one field required')
  return result
}

// Temporal comparison §12.3.3 steps6–9.c/10–11: ordered Gets and immediate conversion
// https://tc39.es/proposal-temporal/#sec-temporal-preparecalendarfields
export function readDateFields(
  item: Record<string, unknown>,
  withTime: boolean,
  partial = false,
  shape: DateFieldShape = 'date',
  calendar = 'iso8601'
): Record<string, unknown> {
  if (calendar === 'iso8601' && !withTime && shape !== 'year')
    return readISODateFields(item, partial, shape === 'date')
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
  if (partial && !any)
    throw new TypeErrorConstructor('At least one field required')
  return result
}
// Temporal comparison §12.3.5 steps1–6: merge prepared fields with calendar-specific invalidation
// https://tc39.es/proposal-temporal/#sec-temporal-calendarmergefields
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
// Temporal comparison §13.24 steps1–7: reject brands before calendar/timeZone Gets
// https://tc39.es/proposal-temporal/#sec-temporal-ispartialtemporalobject
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
    throw new TypeErrorConstructor('Expected partial Temporal object')
  if (item.calendar !== undefined || item.timeZone !== undefined)
    throw new TypeErrorConstructor('Unexpected calendar or timeZone')
  return item
}
// Temporal comparison §12.3.7 steps1–4: calendar addition followed by the full-date bound
// https://tc39.es/proposal-temporal/#sec-temporal-calendardateadd
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
// Temporal comparison §13.10 steps1–5: convert calendarName and preserve its default
// https://tc39.es/proposal-temporal/#sec-temporal-gettemporalshowcalendarnameoption
export function calendarNameOption(
  value: unknown
): 'auto' | 'always' | 'never' | 'critical' {
  const option = value === undefined ? 'auto' : ToString(value)
  if (!arrayIncludes(['auto', 'always', 'never', 'critical'], option))
    throw new RangeErrorConstructor('Invalid calendarName')
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
// Temporal comparison §5.5.9 steps1–3: format the prepared ISO date portion
// https://tc39.es/proposal-temporal/#sec-temporal-isodatetimetostring
export function formatISODate(
  epochDay: number,
  kind: 'date' | 'year-month' | 'month-day' = 'date',
  fields: Readonly<CalendarDate> = calendarFromEpochDayRaw('iso8601', epochDay)
): string {
  const month = twoDigitDateParts[fields.month],
    day = twoDigitDateParts[fields.day]
  if (kind === 'month-day') return month + '-' + day
  // Temporal comparison §3.5.10 steps1–4: decimal padding observes no public hooks.
  const year =
    fields.year >= 1000 && fields.year <= 9999
      ? ToString(fields.year)
      : fields.year >= 0 && fields.year < 1000
        ? zeroPadDecimal(fields.year, 4)
        : (fields.year < 0 ? '-' : '+') +
          zeroPadDecimal(mathAbs(fields.year), 6)
  return year + '-' + month + (kind === 'year-month' ? '' : '-' + day)
}
// Temporal comparison §12.3.15 steps1–4: omit or mark the canonical calendar annotation
// https://tc39.es/proposal-temporal/#sec-temporal-formatcalendarannotation
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
// Temporal comparison §12.3.26 steps1–2: project calendar fields lazily; providers own their data
// https://tc39.es/proposal-temporal/#sec-temporal-calendarisotodate
export function dateProperty(
  slot: DateSlot,
  key: string,
  extended = false
): string | number | boolean | undefined {
  if (key === 'calendarId') return slot.calendar
  const value = nativeDateSnapshot(slot, extended)
  if (import.meta.formatjsTemporalNativeData === true || value) {
    if (arrayIncludes(value!.errors, key))
      throw new RangeErrorConstructor('Calendar field out of range')
    if (
      key === 'year' ||
      key === 'month' ||
      key === 'monthCode' ||
      key === 'day'
    ) {
      if (!value!.date)
        throw new RangeErrorConstructor('Calendar date out of range')
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
      ? (slot[isoDateFields] ??= cachedISODateFields(slot.epochDay))
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
      return cal === 'iso8601' ? 12 : monthsInYear(cal, fields.year)
    case 'daysInYear':
      if (cal === 'iso8601') return DaysInYear(fields.year)
      return (
        calendarStartOfYear(cal, fields.year + 1) -
        calendarStartOfYear(cal, fields.year)
      )
    case 'inLeapYear':
      if (cal === 'iso8601') return DaysInYear(fields.year) === 366
      return arrayIncludes(['hebrew', 'chinese', 'dangi'], cal)
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
        : floor((thursday - DayFromYear(year)) / 7) + 1
    }
  }
  return undefined
}
export function checkDateTime(value: bigint): bigint {
  // Temporal comparison §5.5.4 steps1–5.
  // https://tc39.es/proposal-temporal/#sec-temporal-isodatetimewithinlimits
  // §5.5.4 step1: prepared day/clock values outside the early day bound fail this interval.
  const bound = 8640000086400000000000n
  // §5.5.4 step3: equality at the lower local boundary is rejected.
  // §5.5.4 step4: equality at the upper local boundary is rejected.
  if (value <= -bound || value >= bound)
    throw new RangeErrorConstructor('Local date out of range')
  // §5.5.4 step5: successful return represents the predicate's true result.
  return value
}

// Temporal comparison §12.3.9 steps1–4: adapt the calendar date-duration result
// https://tc39.es/proposal-temporal/#sec-temporal-calendardateuntil
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
export function unroundedDifference(
  start: bigint,
  end: bigint,
  calendar: string,
  largest: string
): DurationFields {
  // Proposal comparison §5.5.12 steps 8–11: combine clock and whole-day
  // nanoseconds before balancing a time-largest result.
  if (HasOwnProperty(timeUnitNanoseconds, largest))
    return balanceDurationTime(
      end - start,
      arrayIndexOf(clockNames, largest as TimeUnit) + 4
    )
  // Proposal comparison §5.5.12 steps 3–9: Borrow one day when the clock
  // remainder opposes the date direction.
  const sign = end < start ? -1 : end > start ? 1 : 0
  let lastDay = epochDayOf(end),
    time = timeOf(end) - timeOf(start)
  if (bigIntFrom(sign) * time < 0n) {
    lastDay -= sign
    time += bigIntFrom(sign) * nsPerDay
  }
  // Proposal comparison §5.5.12 step 9: pass both ISO dates, the calendar
  // and the date-largest unit after clock borrow.
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
  // Proposal comparison §5.5.13 step 7: Round against the supplied UTC scalars
  // and plain date anchor.
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
      // Proposal comparison §5.5.13 step 3: Supply unrounded ISO date-time differences for relative rounding.
      unrounded: value => unroundedDifference(start, value, calendar, largest),
      // Proposal comparison §7.5.33 steps 8.a–8.c.i and 9–11.a: Add constrained date fields and preserve the anchor clock.
      endpoint: fields =>
        bigIntFrom(
          addDate({epochDay: epochDayOf(start), calendar}, fields, 'constrain')
        ) *
          nsPerDay +
        timeOf(start),
    }
  )
}
type DifferenceAnchor = {
  unrounded(end: bigint): DurationFields
  endpoint(fields: DurationFields): bigint
} & (
  | {zoned: false}
  | {
      zoned: true
      calendar: string
      nominalDay(fields: DurationFields): number
      compatibleOrigin(): bigint
    }
)
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
  const largeIndex = arrayIndexOf(
      differenceUnits,
      largest as (typeof differenceUnits)[number]
    ),
    smallIndex = arrayIndexOf(
      differenceUnits,
      smallest as (typeof differenceUnits)[number]
    ),
    sinceSign = since ? -1n : 1n
  // Proposal comparison §13.14 steps 2–4: bound the exclusive fixed-unit
  // increment and check divisibility.
  if (smallIndex >= 4) {
    const maximum = [24, 60, 60, 1000, 1000, 1000][smallIndex - 4]
    if (increment >= maximum || maximum % increment)
      throw new RangeErrorConstructor('Invalid rounding increment')
  }
  const exactZonedNanosecond =
    anchor.zoned && smallIndex === 9 && increment === 1
  // Proposal comparison §5.5.13 step 1: take the supported equal-endpoint
  // shortcuts.
  if (
    start === end &&
    (!anchor.zoned || largeIndex >= 4 || exactZonedNanosecond)
  )
    return zeroDuration()
  if (largeIndex >= 4) {
    // Round the exact epoch difference before converting Duration fields to Numbers.
    const quantum =
      bigIntFrom(increment) * timeUnitNanoseconds[smallest as TimeUnit]
    return balanceDurationTime(
      roundDuration((end - start) * sinceSign, quantum, mode),
      largeIndex
    )
  }
  const sign = end < start ? -1 : 1,
    physicalSign = bigIntFrom(sign)
  let result = anchor.unrounded(end),
    rounded = end,
    expanded = false
  if (exactZonedNanosecond) {
    if (since) {
      for (let index = 0; index < differenceUnits.length; index++) {
        const key = `${differenceUnits[index]}s` as keyof DurationFields
        result[key] = -result[key] || 0
      }
    }
    return result
  }
  // Proposal comparison §6.5.7 step 5 enters rounding with the unrounded fields.
  // Proposal comparison §7.5.38 steps 1–7: Select calendar, zoned-clock, or
  // fixed-day rounding.
  const irregular = smallIndex < 3 || (anchor.zoned && smallIndex === 3)
  if (irregular) {
    // Proposal comparison §7.5.33 steps 1–4: retain the larger fields and form
    // adjacent unit counts.
    const prefix = zeroDuration()
    for (let index = largeIndex; index < smallIndex; index++) {
      const key = `${differenceUnits[index]}s` as keyof DurationFields
      prefix[key] = result[key]
    }
    const key = `${smallest}s` as keyof DurationFields,
      count =
        smallest === 'week'
          ? result.weeks + mathTrunc(result.days / 7)
          : result[key]
    let truncated = mathTrunc(count / increment) * increment
    const stride = sign * increment
    prefix[key] = truncated
    // Proposal comparison §7.5.33 step 8.d.i: Resolve compatibly when zoned and the rounded unit is nonzero.
    let a = anchor.endpoint(prefix)
    prefix[key] = truncated + stride
    // Proposal comparison §7.5.33 step 12.a: Resolve the nonzero date endpoint compatibly when zoned.
    let b = anchor.endpoint(prefix)
    let rebasedUpper: DurationFields | undefined
    // Proposal comparison §7.5.34 steps 5.a and 6.a require a bracket.
    // Shift inward if the first endpoint overshoots.
    if ((end - a) * physicalSign < 0n) {
      const adjacent = b
      b = a
      if (
        anchor.zoned &&
        truncated === 0 &&
        (smallest === 'month' ||
          smallest === 'week' ||
          (smallest === 'day' && increment > 1))
      ) {
        prefix[key] = 0
        rebasedUpper = {...prefix}
        // Zero fields keep the origin, so an overshoot requires a calendar prefix.
        // Borrow from the last nonzero calendar unit to keep one sign.
        const unit =
          prefix.weeks !== 0
            ? 'weeks'
            : prefix.months !== 0
              ? 'months'
              : 'years'
        prefix[unit] -= sign
        const upperDay = anchor.nominalDay(rebasedUpper)
        const lowerDay = anchor.nominalDay(prefix)
        if (smallest !== 'week') {
          let probedLower: bigint | undefined
          if (smallest === 'day') {
            // Proposal comparison §7.5.34 steps 5.a.ii and 6.a.ii.
            // Gap resolution moves an endpoint by less than two days. A day
            // four nominal days beyond the retained upper bound cannot fit.
            const retainedDays = upperDay - lowerDay
            const checkedDays =
              retainedDays % increment === 0 &&
              (end - adjacent) * physicalSign >= 0n
                ? stride
                : result.days || sign
            truncated =
              mathTrunc(((retainedDays + checkedDays) * sign) / increment) *
              stride
            if (truncated === retainedDays) truncated -= stride
            const outer =
              mathTrunc((retainedDays * sign + 3) / increment) * stride
            if (outer !== retainedDays && (outer - truncated) * sign > 0) {
              prefix[key] = outer
              try {
                const candidate = anchor.endpoint(prefix)
                if ((end - candidate) * physicalSign >= 0n) {
                  truncated = outer
                  probedLower = candidate
                }
              } catch (error) {
                // An extra probe can fall outside the civil or Instant range.
                if (!(error instanceof RangeErrorConstructor)) throw error
              }
            }
          } else {
            const lastDay = upperDay + sign
            const calendar = baseCalendar(anchor.calendar)
            const monthStart = (day: number): number =>
              day - calendarFromEpochDayRaw(calendar, day).day + 1
            // Starting each date at day one counts months without day clamping.
            const months =
              calendarDateUntilRaw(
                calendar,
                monthStart(lowerDay),
                monthStart(lastDay),
                'month'
              ).months ?? 0
            truncated = mathTrunc(months / increment) * increment
            prefix[key] = truncated
            const candidateDay = anchor.nominalDay(prefix)
            if (
              candidateDay === upperDay ||
              (candidateDay - lastDay) * sign > 0
            )
              truncated -= stride
          }
          prefix[key] = truncated
          a = probedLower ?? anchor.endpoint(prefix)
          // Proposal comparison §7.5.34 steps 5.a.ii and 6.a.ii: check the
          // lower bound after gap resolution. Retreat by whole increments.
          while (truncated * sign > 0 && (end - a) * physicalSign < 0n) {
            truncated -= stride
            prefix[key] = truncated
            a = anchor.endpoint(prefix)
          }
        } else {
          a = anchor.endpoint(prefix)
          // Proposal comparison §7.5.34 steps 5.a.ii and 6.a.ii.
          // Each compatible gap endpoint can move by up to two days.
          // A nominal week four days past the retained upper bound cannot fit.
          let nextCount = truncated + stride
          while (
            a !== end &&
            (lowerDay + 7 * nextCount - upperDay) * sign < 4
          ) {
            prefix[key] = nextCount
            const next = anchor.endpoint(prefix)
            if ((end - next) * physicalSign < 0n) break
            truncated = nextCount
            a = next
            nextCount += stride
          }
        }
      } else {
        truncated -= stride
        prefix[key] = truncated
        a = anchor.endpoint(prefix)
      }
    }
    // A wide fold can put more than one bound before the target.
    while (a !== end && (b - end) * physicalSign < 0n) {
      truncated += stride
      a = b
      prefix[key] = truncated + stride
      b = anchor.endpoint(prefix)
      expanded = true
    }
    let expand = false
    // §7.5.34 step 13 can divide by zero across a skipped day.
    // https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit
    // https://github.com/tc39/proposal-temporal/issues/3310
    if (a !== end) {
      const positive = physicalSign * sinceSign > 0n
      expand =
        end === b ||
        mode === 'expand' ||
        (mode === 'ceil' && positive) ||
        (mode === 'floor' && !positive)
      if (
        mode === 'halfCeil' ||
        mode === 'halfFloor' ||
        mode === 'halfExpand' ||
        mode === 'halfTrunc' ||
        mode === 'halfEven'
      ) {
        // Proposal comparison §7.5.34 steps 14–16 and 19–21: compare exact
        // distances without dividing.
        const distance = (end - a) * physicalSign,
          span = (b - a) * physicalSign
        expand =
          distance * 2n > span ||
          (distance * 2n === span &&
            (mode === 'halfExpand' ||
              (mode === 'halfCeil' && positive) ||
              (mode === 'halfFloor' && !positive) ||
              (mode === 'halfEven' &&
                (rebasedUpper !== undefined ||
                  mathAbs(truncated / increment) % 2 === 1))))
      }
    }
    // Proposal comparison §7.5.34 steps 22–24: keep the selected endpoint and
    // duration.
    prefix[key] = (expand ? truncated + stride : truncated) || 0
    result = expand && rebasedUpper ? rebasedUpper : prefix
    rounded = expand ? b : a
    expanded ||= expand
  } else if (anchor.zoned && largeIndex < 4) {
    // Proposal comparison §7.5.35 steps 1–7 and 9–16: measure the zoned day
    // span and carry the rounded clock.
    const time = durationNanoseconds(result, false),
      quantum =
        bigIntFrom(increment) * timeUnitNanoseconds[smallest as TimeUnit]
    let value = sinceSign * roundDuration(time * sinceSign, quantum, mode)
    const date = {...result}
    for (let index = 4; index < differenceUnits.length; index++)
      date[`${differenceUnits[index]}s` as keyof DurationFields] = 0
    // Proposal comparison §7.5.35 step 5: Resolve the origin wall clock even for zero date fields.
    // https://tc39.es/proposal-temporal/#sec-temporal-nudgetozonedtime
    const origin =
        date.years || date.months || date.weeks || date.days
          ? anchor.endpoint(date)
          : anchor.compatibleOrigin(),
      next = {...date, days: date.days + sign},
      // Proposal comparison §7.5.35 step 6: The signed day step ensures compatible resolution.
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
  } else {
    // Proposal comparison §7.5.36 steps 1–15: round the fixed-length time and
    // split off whole days.
    const time = durationNanoseconds(result),
      quantum =
        bigIntFrom(increment) *
        (smallest === 'day'
          ? nsPerDay
          : timeUnitNanoseconds[smallest as TimeUnit])
    const value = sinceSign * roundDuration(time * sinceSign, quantum, mode)
    const days = largeIndex < 4 ? numberFrom(value / nsPerDay) : 0
    expanded = mathSign(days - result.days) === sign
    rounded = end + value - time
    result = {
      ...result,
      ...balanceDurationTime(
        largeIndex < 4 ? value % nsPerDay : value,
        mathMax(4, largeIndex)
      ),
      years: result.years,
      months: result.months,
      weeks: result.weeks,
      days,
    }
  }
  // Keep the chosen rounding quantum; only bubble when a larger boundary was crossed.
  // Proposal comparison §7.5.38 step 9 and §7.5.37 steps 4–6: check larger
  // boundaries after expansion.
  if (expanded && smallest !== 'week') {
    for (let index = mathMin(smallIndex, 3) - 1; index >= largeIndex; index--) {
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
    for (let index = 0; index < differenceUnits.length; index++) {
      const key = `${differenceUnits[index]}s` as keyof DurationFields
      result[key] = -result[key] || 0
    }
  }
  return result
}
