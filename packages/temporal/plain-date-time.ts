import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIndexOf,
  bigIntFrom,
  mathMin,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  argumentAt,
  constructorPrototype,
  createObject,
  createProxy,
} from '#packages/temporal/intrinsics.js'
import {nativeDateSnapshot} from '#packages/temporal/date-core.js'
import {defineGetters} from '#packages/temporal/accessors.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {localeDateTime} from '#packages/temporal/locale.js'
import {
  zonedFromLocal,
  type ZonedDateTimeObject,
} from '#packages/temporal/zoned-date-time.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  createPlainDate,
  type PlainDateObject,
  type DateProperties,
} from '#packages/temporal/plain-date.js'
import {
  toPlainTimeNanoseconds,
  createPlainTime,
  roundTime,
  type PlainTimeObject,
} from '#packages/temporal/plain-time.js'
import {
  getDateSlot,
  getZonedDateTimeSlot,
  getDateTimeSlot,
  setDateTimeSlot,
  type DateTimeSlot,
} from '#packages/temporal/plain-slots.js'
import {
  epochNanosecondsToISO,
  isoToEpochNanoseconds,
} from '#packages/temporal/kernel.js'
import {formatInstant} from '#packages/temporal/instant-format.js'
import {
  calendarId,
  calendarFromObject,
  constructorCalendar,
  prepareDateTimeString,
  calendarAnnotation,
  calendarNameOption,
  object,
  integer,
  overflowOption,
  readDateFields,
  mergeDateFields,
  dayFromFields,
  dateFields,
  dateProperty,
  datePropertyNames,
  clockNames,
  clockBounds,
  clockFactors,
  clockNanoseconds,
  nsPerDay,
  epochDayOf,
  timeOf,
  checkDateTime,
  partialObject,
  addDate,
  roundedDateTimeDifference,
} from '#packages/temporal/date-core.js'
import {
  createDuration,
  createNativeDuration,
  toDurationFields,
  toNativeDurationFields,
  type DurationObject,
} from '#packages/temporal/duration.js'
import {
  durationFieldNames,
  durationNanoseconds,
} from '#packages/temporal/duration-core.js'
import {
  optionsObject,
  unitOptions,
  fractionalSecondDigits,
  roundingIncrement,
  roundingMode,
  unitOption,
  timeUnit,
  roundInstant,
  type Precision,
} from '#packages/temporal/rounding.js'

// Private ISO formatting retains the original runtime method.
const stringSlice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number,
  end?: number
) => string

export interface PlainDateTimeObject extends DateProperties {
  readonly [Symbol.toStringTag]: 'Temporal.PlainDateTime'
  readonly hour: number
  readonly minute: number
  readonly second: number
  readonly millisecond: number
  readonly microsecond: number
  readonly nanosecond: number
  with(item: unknown, options?: unknown): PlainDateTimeObject
  withCalendar(calendar: unknown): PlainDateTimeObject
  withPlainTime(time?: unknown): PlainDateTimeObject
  add(duration: unknown, options?: unknown): PlainDateTimeObject
  subtract(duration: unknown, options?: unknown): PlainDateTimeObject
  until(other: unknown, options?: unknown): DurationObject
  since(other: unknown, options?: unknown): DurationObject
  round(roundTo: unknown): PlainDateTimeObject
  equals(other: unknown): boolean
  toZonedDateTime(timeZone: unknown, options?: unknown): ZonedDateTimeObject
  toPlainDate(): PlainDateObject
  toPlainTime(): PlainTimeObject
  toString(options?: unknown): string
  toLocaleString(locales?: unknown, options?: unknown): string
  toJSON(): string
  valueOf(): never
}
export interface PlainDateTimeConstructor {
  new (
    year: unknown,
    month: unknown,
    day: unknown,
    hour?: unknown,
    minute?: unknown,
    second?: unknown,
    millisecond?: unknown,
    microsecond?: unknown,
    nanosecond?: unknown,
    calendar?: unknown
  ): PlainDateTimeObject
  readonly prototype: PlainDateTimeObject
  from(item: unknown, options?: unknown): PlainDateTimeObject
  compare(one: unknown, two: unknown): -1 | 0 | 1
}
function read(item: unknown): DateTimeSlot {
  const slot = getDateTimeSlot(item as object)
  if (!slot) throw new TypeErrorConstructor('Invalid PlainDateTime receiver')
  return slot
}
const NativePlainDateTime = function (
  this: PlainDateTimeObject,
  slot: DateTimeSlot
) {
  setDateTimeSlot(this, slot)
}
export function createPlainDateTime(
  input: bigint | DateTimeSlot,
  calendar: string
): PlainDateTimeObject {
  if (
    import.meta.formatjsTemporalNativeData === true &&
    typeof input !== 'bigint'
  )
    return new (NativePlainDateTime as unknown as new (
      slot: DateTimeSlot
    ) => PlainDateTimeObject)(input)
  const value = typeof input === 'bigint' ? input : input.epochNanoseconds
  checkDateTime(value)
  const result = createObject(
    PlainDateTimeValue.prototype
  ) as PlainDateTimeObject
  setDateTimeSlot(
    result,
    typeof input === 'bigint' ? {epochNanoseconds: value, calendar} : input
  )
  return result
}
const dateSlots = new WeakMap<
  DateTimeSlot,
  {epochDay: number; calendar: string; properties?: DateTimeSlot['properties']}
>()
function dateSlot(slot: DateTimeSlot) {
  if (
    import.meta.formatjsTemporalNativeData === true &&
    slot.epochDay !== undefined
  )
    return slot as DateTimeSlot & {epochDay: number}
  let value = dateSlots.get(slot)
  if (!value) {
    value = {
      epochDay: epochDayOf(slot.epochNanoseconds),
      calendar: slot.calendar,
      properties: slot.properties,
    }
    dateSlots.set(slot, value)
  }
  return value
}
export function toPlainDateTimeSlot(
  item: unknown,
  options?: unknown
): DateTimeSlot {
  const existing =
      getDateTimeSlot(item as object) ?? getZonedDateTimeSlot(item as object),
    date = getDateSlot(item as object)
  if (existing || date) {
    overflowOption(options)
    return (
      existing ?? {
        epochNanoseconds: checkDateTime(bigIntFrom(date!.epochDay) * nsPerDay),
        calendar: date!.calendar,
      }
    )
  }
  if (object(item)) {
    const calendar = calendarFromObject(item)
    const fields = readDateFields(item, true, false, 'date', calendar),
      overflow = overflowOption(options)
    const day = dayFromFields(calendar, fields, overflow),
      clock = clockNanoseconds(fields, overflow)
    return {
      epochNanoseconds: checkDateTime(bigIntFrom(day) * nsPerDay + clock),
      calendar,
    }
  }
  if (typeof item !== 'string')
    throw new TypeErrorConstructor('Expected date/time string or object')
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native) {
    if (options !== undefined) prepareDateTimeString(item, options)
    const parsed = native!.parsePlainDateTime(item)
    return {...parsed, calendar: constructorCalendar(parsed.calendar)}
  }
  const fields = prepareDateTimeString(item, options)
  return {
    epochNanoseconds: isoToEpochNanoseconds(fields),
    calendar: fields.calendar,
  }
}
function add(
  slot: DateTimeSlot,
  duration: unknown,
  options: unknown,
  sign: number
): PlainDateTimeObject {
  const fields =
    import.meta.formatjsTemporalNativeData === true
      ? toNativeDurationFields(duration)
      : toDurationFields(duration)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return createPlainDateTime(
      native!.addPlainDateTime(
        slot.epochNanoseconds,
        slot.calendar,
        fields,
        sign < 0,
        overflowOption(options)
      ),
      slot.calendar
    )
  for (let index = 0; index < durationFieldNames.length; index++)
    fields[durationFieldNames[index]] *= sign
  const overflow = overflowOption(options)
  const time =
    timeOf(slot.epochNanoseconds) + durationNanoseconds(fields, false)
  const carry = epochDayOf(time)
  fields.days += carry
  const day = addDate(dateSlot(slot), fields, overflow)
  return createPlainDateTime(
    bigIntFrom(day) * nsPerDay + timeOf(time),
    slot.calendar
  )
}
function difference(
  slot: DateTimeSlot,
  other: unknown,
  options: unknown,
  since: boolean
): DurationObject {
  const end = toPlainDateTimeSlot(other)
  if (slot.calendar !== end.calendar)
    throw new RangeErrorConstructor('Calendars differ')
  const resolved = optionsObject(options)
  const largestRaw = resolved.largestUnit,
    largestText = largestRaw === undefined ? 'auto' : ToString(largestRaw),
    largestOption = largestText === 'auto' ? undefined : unitOption(largestText)
  const increment = roundingIncrement(resolved.roundingIncrement),
    mode = roundingMode(resolved.roundingMode, 'trunc')
  const smallest = unitOption(resolved.smallestUnit) ?? 'nanosecond'
  const names = [
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
  ]
  const smallIndex = arrayIndexOf(names, smallest)
  const largest =
    largestText === 'auto' ? names[mathMin(3, smallIndex)] : largestOption!
  if (arrayIndexOf(names, largest) > smallIndex)
    throw new RangeErrorConstructor('Largest unit smaller than smallest unit')
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return (
      import.meta.formatjsTemporalNativeData === true
        ? createNativeDuration
        : createDuration
    )(
      native!.differencePlainDateTime(
        slot.epochNanoseconds,
        end.epochNanoseconds,
        slot.calendar,
        largest,
        smallest,
        increment,
        mode,
        since
      )
    )
  return createDuration(
    roundedDateTimeDifference(
      slot.epochNanoseconds,
      end.epochNanoseconds,
      slot.calendar,
      largest,
      smallest,
      increment,
      mode,
      since
    )
  )
}
function format(
  slot: DateTimeSlot,
  precision: Precision = 'auto',
  annotation: unknown = undefined,
  value = slot.epochNanoseconds
): string {
  const show = calendarNameOption(annotation),
    native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.formatPlainDateTime(
      value,
      slot.calendar,
      precision,
      'trunc',
      show
    )
  // Temporal comparison §5.3.36 step3: format private ISO fields without public hooks.
  return (
    stringSlice(formatInstant(value, precision), 0, -1) +
    calendarAnnotation(slot.calendar, show)
  )
}
class PlainDateTimeValue {
  constructor(
    _year: unknown,
    _month: unknown,
    _day: unknown,
    _hour: unknown = undefined,
    _minute?: unknown,
    _second?: unknown,
    _millisecond?: unknown,
    _microsecond?: unknown,
    _nanosecond?: unknown,
    _calendar?: unknown
  ) {
    throw new TypeErrorConstructor('Use exported PlainDateTime constructor')
  }
  static from(
    item: unknown,
    options: unknown = undefined
  ): PlainDateTimeObject {
    // Temporal comparison §5.2.2 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.from
    const slot = toPlainDateTimeSlot(item, options)
    return createPlainDateTime(slot, slot.calendar)
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    // Temporal comparison §5.2.3 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.compare
    const a = toPlainDateTimeSlot(one).epochNanoseconds,
      b = toPlainDateTimeSlot(two).epochNanoseconds
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L920-L922
    // L920: epoch-day order equals ISO-date order; each clock lies within one day.
    // L921: different dates dominate the entire clock remainder.
    // L922: on equal dates, exact nanoseconds compare the six clock fields.
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L78
    // L78: return the private date-time comparison as a Number sign.
    return a < b ? -1 : a > b ? 1 : 0
  }
  with(item: unknown, options: unknown = undefined): PlainDateTimeObject {
    // Temporal comparison §5.3.25 steps 1–17.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.with
    const slot = read(this),
      partial = readDateFields(
        partialObject(item),
        true,
        true,
        'date',
        slot.calendar
      )
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native) {
      dateFields(dateSlot(slot))
      return createPlainDateTime(
        native!.withDateTime(slot, partial, overflowOption(options)),
        slot.calendar
      )
    }
    const current = {
      ...epochNanosecondsToISO(slot.epochNanoseconds),
      ...dateFields(dateSlot(slot)),
    }
    const fields = mergeDateFields(slot.calendar, current, partial)
    const overflow = overflowOption(options)
    return createPlainDateTime(
      bigIntFrom(dayFromFields(slot.calendar, fields, overflow)) * nsPerDay +
        clockNanoseconds(fields, overflow),
      slot.calendar
    )
  }
  withCalendar(calendar: unknown): PlainDateTimeObject {
    // Temporal comparison §5.3.27 steps 1–4.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.withcalendar
    const slot = read(this)
    if (calendar === undefined)
      throw new TypeErrorConstructor('Calendar required')
    return createPlainDateTime(slot.epochNanoseconds, calendarId(calendar))
  }
  withPlainTime(time: unknown = undefined): PlainDateTimeObject {
    // Temporal comparison §5.3.26 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.withplaintime
    // Temporal comparison §5.3.26 step3: private ToTimeRecordOrMidnight conversion.
    const slot = read(this)
    const clock = time === undefined ? 0n : toPlainTimeNanoseconds(time)
    return createPlainDateTime(
      bigIntFrom(epochDayOf(slot.epochNanoseconds)) * nsPerDay + clock,
      slot.calendar
    )
  }
  add(duration: unknown, options: unknown = undefined): PlainDateTimeObject {
    // Temporal comparison §5.3.28 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.add
    return add(read(this), duration, options, 1)
  }
  subtract(
    duration: unknown,
    options: unknown = undefined
  ): PlainDateTimeObject {
    // Temporal comparison §5.3.29 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.subtract
    return add(read(this), duration, options, -1)
  }
  until(other: unknown, options: unknown = undefined): DurationObject {
    // Temporal comparison §5.3.30 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.until
    return difference(read(this), other, options, false)
  }
  since(other: unknown, options: unknown = undefined): DurationObject {
    // Temporal comparison §5.3.31 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.since
    return difference(read(this), other, options, true)
  }
  equals(other: unknown): boolean {
    // Temporal comparison §5.3.33 steps 1–5.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.equals
    const a = read(this),
      b = toPlainDateTimeSlot(other)
    return (
      a.epochNanoseconds === b.epochNanoseconds && a.calendar === b.calendar
    )
  }
  toZonedDateTime(
    timeZone: unknown,
    options: unknown = undefined
  ): ZonedDateTimeObject {
    // Temporal comparison §5.3.38 steps 1–7.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.tozoneddatetime
    const slot = read(this)
    return zonedFromLocal(
      slot.epochNanoseconds,
      timeZone,
      slot.calendar,
      options
    )
  }
  toPlainDate(): PlainDateObject {
    // Temporal comparison §5.3.39 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.toplaindate
    const slot = read(this)
    return createPlainDate(epochDayOf(slot.epochNanoseconds), slot.calendar)
  }
  toPlainTime(): PlainTimeObject {
    // Temporal comparison §5.3.40 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.toplaintime
    return createPlainTime(timeOf(read(this).epochNanoseconds))
  }
  round(roundTo: unknown): PlainDateTimeObject {
    // Temporal comparison §5.3.32 steps 1–16.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.round
    const slot = read(this)
    if (roundTo === undefined)
      throw new TypeErrorConstructor('roundTo required')
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/plaindatetime.html#L495-L498
    // L495: select string shorthand; L496: retain the primitive unit string.
    // L497: create a null-prototype record; L498: create its own smallestUnit data property.
    const resolved: Record<string, unknown> =
      typeof roundTo === 'string'
        ? unitOptions(roundTo)
        : optionsObject(roundTo)
    const increment = roundingIncrement(resolved.roundingIncrement),
      mode = roundingMode(resolved.roundingMode, 'halfExpand'),
      unit = unitOption(resolved.smallestUnit)
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return createPlainDateTime(
        native!.roundPlainDateTime(
          slot.epochNanoseconds,
          slot.calendar,
          unit === 'day' ? 'day' : timeUnit(unit),
          increment,
          mode
        ),
        slot.calendar
      )
    const clock = timeOf(slot.epochNanoseconds)
    let rounded: bigint
    if (unit === 'day') {
      if (increment !== 1)
        throw new RangeErrorConstructor('Invalid day increment')
      rounded = roundInstant(clock, nsPerDay, mode)
    } else rounded = roundTime(clock, timeUnit(unit), increment, mode)
    return createPlainDateTime(
      bigIntFrom(epochDayOf(slot.epochNanoseconds)) * nsPerDay + rounded,
      slot.calendar
    )
  }
  toString(options: unknown = undefined): string {
    // Temporal comparison §5.3.34 steps 1–14.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.tostring
    const slot = read(this),
      resolved = optionsObject(options)
    const show = calendarNameOption(resolved.calendarName)
    const suffix = calendarAnnotation(slot.calendar, show)
    const digits = fractionalSecondDigits(resolved.fractionalSecondDigits),
      mode = roundingMode(resolved.roundingMode, 'trunc'),
      raw = unitOption(resolved.smallestUnit)
    if (raw !== undefined && timeUnit(raw) === 'hour')
      throw new RangeErrorConstructor('Cannot format hours only')
    const precision: Precision =
      raw === 'minute'
        ? 'minute'
        : raw === 'second'
          ? 0
          : raw === 'millisecond'
            ? 3
            : raw === 'microsecond'
              ? 6
              : raw === 'nanosecond'
                ? 9
                : digits
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return native!.formatPlainDateTime(
        slot.epochNanoseconds,
        slot.calendar,
        precision,
        mode,
        show
      )
    const quantum =
      precision === 'auto'
        ? 1n
        : precision === 'minute'
          ? 60_000_000_000n
          : 10n ** bigIntFrom(9 - precision)
    const value =
      bigIntFrom(epochDayOf(slot.epochNanoseconds)) * nsPerDay +
      roundInstant(timeOf(slot.epochNanoseconds), quantum, mode)
    // Temporal comparison §5.3.34 step14: combine private ISO text and annotation.
    return stringSlice(formatInstant(value, precision), 0, -1) + suffix
  }
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    // Temporal comparison §5.3.35 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.tolocalestring
    const slot = read(this)
    return localeDateTime(
      {kind: 'PlainDateTime', ...slot},
      locales,
      options,
      () => localeStringIntrinsic.call(this)
    )
  }
  toJSON(): string {
    // Temporal comparison §5.3.36 steps 1–3.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.tojson
    return format(read(this))
  }
  valueOf(): never {
    // Temporal comparison §5.3.37 step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.valueof
    throw new TypeErrorConstructor(
      'Cannot convert Temporal.PlainDateTime to primitive'
    )
  }
}
if (import.meta.formatjsTemporalNativeData === true)
  NativePlainDateTime.prototype = PlainDateTimeValue.prototype
const localeStringIntrinsic = PlainDateTimeValue.prototype.toString

Object.defineProperty(PlainDateTimeValue, 'name', {
  value: 'PlainDateTime',
  configurable: true,
})
// Temporal comparison §5.2.1.
// https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype
export const PlainDateTime: PlainDateTimeConstructor = createProxy(
  PlainDateTimeValue,
  {
    construct(target, args, newTarget) {
      // Temporal comparison §5.1.1 steps 1–19.
      // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime
      const year = integer(argumentAt(args, 0)),
        month = integer(argumentAt(args, 1)),
        day = integer(argumentAt(args, 2))
      const clock = createObject(null) as Record<string, number>
      for (let index = 0; index < 6; index++)
        clock[clockNames[index]] =
          argumentAt(args, index + 3) === undefined
            ? 0
            : integer(argumentAt(args, index + 3))
      const calendar = constructorCalendar(argumentAt(args, 9))
      const value = isoToEpochNanoseconds({year, month, day, ...clock})
      const prototype = constructorPrototype(newTarget, target)
      const result = createObject(prototype)
      setDateTimeSlot(result, {epochNanoseconds: value, calendar})
      return result
    },
  }
) as unknown as PlainDateTimeConstructor
Object.defineProperties(PlainDateTimeValue.prototype, {
  // Temporal comparison §5.3.1.
  // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype.constructor
  constructor: {value: PlainDateTime, writable: true, configurable: true},
  // Temporal comparison §5.3.2.
  // https://tc39.es/proposal-temporal/#sec-temporal.plaindatetime.prototype-%symbol.tostringtag%
  [Symbol.toStringTag]: {value: 'Temporal.PlainDateTime', configurable: true},
})
// Temporal comparison §5.3.3 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.calendarid
// Temporal comparison §5.3.4 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.era
// Temporal comparison §5.3.5 steps 1–5.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.erayear
// Temporal comparison §5.3.6 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.year
// Temporal comparison §5.3.7 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.month
// Temporal comparison §5.3.8 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.monthcode
// Temporal comparison §5.3.9 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.day
// Temporal comparison §5.3.10 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.hour
// Temporal comparison §5.3.11 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.minute
// Temporal comparison §5.3.12 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.second
// Temporal comparison §5.3.13 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.millisecond
// Temporal comparison §5.3.14 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.microsecond
// Temporal comparison §5.3.15 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.nanosecond
// Temporal comparison §5.3.16 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.dayofweek
// Temporal comparison §5.3.17 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.dayofyear
// Temporal comparison §5.3.18 steps 1–5.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.weekofyear
// Temporal comparison §5.3.19 steps 1–5.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.yearofweek
// Temporal comparison §5.3.20 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.daysinweek
// Temporal comparison §5.3.21 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.daysinmonth
// Temporal comparison §5.3.22 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.daysinyear
// Temporal comparison §5.3.23 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.monthsinyear
// Temporal comparison §5.3.24 steps 1–3.
// https://tc39.es/proposal-temporal/#sec-get-temporal.plaindatetime.prototype.inleapyear
defineGetters(
  PlainDateTimeValue.prototype,
  [...datePropertyNames, ...clockNames],
  (receiver, name) => {
    const slot = read(receiver),
      index = arrayIndexOf(clockNames as readonly string[], name)
    const snapshot =
      import.meta.formatjsTemporalNativeData === true || nativeTemporal()
        ? nativeDateSnapshot(dateSlot(slot), false, slot.epochNanoseconds)
        : undefined
    if (snapshot && index >= 0) return snapshot.values[name]
    return index < 0
      ? dateProperty(dateSlot(slot), name)
      : numberFrom(
          (timeOf(slot.epochNanoseconds) / clockFactors[index]) %
            bigIntFrom(clockBounds[index] + 1)
        )
  }
)
