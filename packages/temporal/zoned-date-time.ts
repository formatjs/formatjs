import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'
import {
  createInstant,
  validateInstant,
  type InstantObject,
} from '#packages/temporal/instant.js'
import {
  PlainTime,
  roundTime,
  type PlainTimeObject,
} from '#packages/temporal/plain-time.js'
import {
  createPlainDate,
  type DateProperties,
  type PlainDateObject,
} from '#packages/temporal/plain-date.js'
import {
  createPlainDateTime,
  type PlainDateTimeObject,
} from '#packages/temporal/plain-date-time.js'
import {
  getZonedSlot,
  setZonedSlot,
  getTimeSlot,
  type ZonedSlot,
} from '#packages/temporal/plain-slots.js'
import {
  timeZoneIdentifier,
  zonedKernel,
  timeZoneEquals,
} from '#packages/temporal/zones.js'
import {
  parseZonedDateTimeString,
  parseOffsetNanoseconds,
} from '#packages/temporal/instant-string.js'
import {
  epochNanosecondsToISO,
  isoToEpochNanoseconds,
  type Disambiguation,
} from '#packages/temporal/kernel.js'
import {
  calendarId,
  calendarFromObject,
  constructorCalendar,
  calendarAnnotation,
  object,
  overflowOption,
  readDateFields,
  dateFieldNames,
  dateFieldValue,
  mergeDateFields,
  dayFromFields,
  clockNanoseconds,
  dateFields,
  partialObject,
  dateProperty,
  datePropertyNames,
  clockNames,
  nsPerDay,
  epochDayOf,
  roundRelativeDifference,
  timeOf,
  addDate,
  dateUntil,
} from '#packages/temporal/date-core.js'
import {
  toDurationFields,
  createDuration,
  type DurationObject,
} from '#packages/temporal/duration.js'
import {
  durationNanoseconds,
  zeroDuration,
  balanceDurationTime,
  type DurationFields,
} from '#packages/temporal/duration-core.js'
import {
  optionsObject,
  roundingIncrement,
  fractionalSecondDigits,
  roundingMode,
  unitOption,
  timeUnit,
  roundInstant,
  type Precision,
} from '#packages/temporal/rounding.js'
import {formatInstant} from '#packages/temporal/instant-format.js'

export interface ZonedDateTimeObject extends DateProperties {
  readonly timeZoneId: string
  readonly epochNanoseconds: bigint
  readonly epochMilliseconds: number
  readonly hour: number
  readonly minute: number
  readonly second: number
  readonly millisecond: number
  readonly microsecond: number
  readonly nanosecond: number
  readonly offset: string
  readonly offsetNanoseconds: number
  readonly hoursInDay: number
  with(item: unknown, options?: unknown): ZonedDateTimeObject
  round(roundTo: unknown): ZonedDateTimeObject
  until(other: unknown, options?: unknown): DurationObject
  since(other: unknown, options?: unknown): DurationObject
  add(duration: unknown, options?: unknown): ZonedDateTimeObject
  subtract(duration: unknown, options?: unknown): ZonedDateTimeObject
  withTimeZone(timeZone: unknown): ZonedDateTimeObject
  withCalendar(calendar: unknown): ZonedDateTimeObject
  withPlainTime(time?: unknown): ZonedDateTimeObject
  getTimeZoneTransition(direction: unknown): ZonedDateTimeObject | null
  startOfDay(): ZonedDateTimeObject
  equals(other: unknown): boolean
  toInstant(): InstantObject
  toPlainDate(): PlainDateObject
  toPlainTime(): PlainTimeObject
  toPlainDateTime(): PlainDateTimeObject
  toString(options?: unknown): string
  toJSON(): string
  valueOf(): never
}
export interface ZonedDateTimeConstructor {
  new (
    epochNanoseconds: unknown,
    timeZone: unknown,
    calendar?: unknown
  ): ZonedDateTimeObject
  readonly prototype: ZonedDateTimeObject
  from(item: unknown, options?: unknown): ZonedDateTimeObject
  compare(one: unknown, two: unknown): -1 | 0 | 1
}
function read(value: unknown): ZonedSlot {
  const slot = getZonedSlot(value as object)
  if (!slot) throw new TypeError('Invalid ZonedDateTime receiver')
  return slot
}
function local(slot: ZonedSlot): bigint {
  return (
    slot.epochNanoseconds +
    zonedKernel(slot.timeZone).offsetNanoseconds(slot.epochNanoseconds)
  )
}
export function createZonedDateTime(
  epochNanoseconds: bigint,
  timeZone: string,
  calendar: string
): ZonedDateTimeObject {
  validateInstant(epochNanoseconds)
  const result = Object.create(
    ZonedDateTimeValue.prototype
  ) as ZonedDateTimeObject
  setZonedSlot(result, {epochNanoseconds, timeZone, calendar})
  return result
}
function option<T extends string>(
  value: unknown,
  fallback: T,
  allowed: readonly T[]
): T {
  const text = value === undefined ? fallback : ToString(value)
  if (!allowed.includes(text as T)) throw new RangeError('Invalid option')
  return text as T
}
function offsetString(value: unknown): string {
  const primitive = object(value) ? ToPrimitive(value, 'string') : value
  if (typeof primitive !== 'string')
    throw new TypeError('Offset must be a string')
  parseOffsetNanoseconds(primitive)
  return primitive
}
export function zonedFromLocal(
  value: bigint,
  timeZone: unknown,
  calendar: string,
  options?: unknown,
  start = false
): ZonedDateTimeObject {
  const zone = timeZoneIdentifier(timeZone),
    resolved = optionsObject(options),
    ambiguous = disambiguation(resolved.disambiguation)
  const epoch = zonedKernel(zone).resolve(
    epochNanosecondsToISO(value),
    ambiguous
  )
  const slot = {epochNanoseconds: epoch, timeZone: zone, calendar}
  return createZonedDateTime(start ? startOfDay(slot) : epoch, zone, calendar)
}
function disambiguation(value: unknown): Disambiguation {
  return option(value, 'compatible', [
    'compatible',
    'earlier',
    'later',
    'reject',
  ])
}
function resolve(
  localTime: bigint,
  timeZone: string,
  offset: string | undefined,
  behavior: string,
  ambiguous: Disambiguation,
  matchMinute: boolean
): bigint {
  const kernel = zonedKernel(timeZone),
    fields = epochNanosecondsToISO(localTime)
  if (offset !== undefined && /^[Zz]$/.test(offset))
    return validateInstant(localTime)
  if (offset === undefined || behavior === 'ignore')
    return kernel.resolve(fields, ambiguous)
  const provided = parseOffsetNanoseconds(offset)
  if (behavior === 'use') return validateInstant(localTime - provided)
  if (localTime < -8_640_000_000_000_000_000_000n)
    throw new RangeError('Local date out of range')
  const candidates = kernel.possibleInstants(fields)
  for (let i = 0; i < candidates.length; i++) {
    const actual = localTime - candidates[i]
    const rounded =
      (actual < 0n ? -1n : 1n) *
      (((actual < 0n ? -actual : actual) + 30_000_000_000n) / 60_000_000_000n) *
      60_000_000_000n
    if (provided === actual || (matchMinute && provided === rounded))
      return candidates[i]
  }
  if (behavior === 'reject')
    throw new RangeError('Offset does not match timezone')
  return kernel.resolve(fields, ambiguous)
}
export function toZonedDateTimeSlot(
  item: unknown,
  options?: unknown
): ZonedSlot {
  const existing = getZonedSlot(item as object)
  let value: bigint | undefined,
    calendar: string,
    zone: string,
    offset: string | undefined,
    matchMinute = false,
    dateOnly = false
  if (existing) {
    calendar = existing.calendar
    zone = existing.timeZone
  } else if (object(item)) {
    calendar = calendarFromObject(item)
    // Prepare fields in alphabetical order, including offset/timeZone.
    const prepared = Object.create(null) as Record<string, unknown>
    const names = dateFieldNames(calendar, true, 'date', ['offset', 'timeZone'])
    for (let i = 0; i < names.length; i++) {
      const key = names[i],
        raw = item[key]
      prepared[key] =
        key === 'offset' && raw !== undefined
          ? offsetString(raw)
          : key === 'timeZone'
            ? timeZoneIdentifier(raw)
            : raw === undefined
              ? undefined
              : dateFieldValue(key, raw)
    }
    const fields = readDateFields(prepared, true, false, 'date', calendar)
    zone = prepared.timeZone as string
    offset = prepared.offset as string | undefined
    const resolved = optionsObject(options),
      ambiguous = disambiguation(resolved.disambiguation),
      behavior = option(resolved.offset, 'reject', [
        'prefer',
        'use',
        'ignore',
        'reject',
      ]),
      overflow = overflowOption(resolved)
    value =
      BigInt(dayFromFields(calendar, fields, overflow)) * nsPerDay +
      clockNanoseconds(fields, overflow)
    return {
      epochNanoseconds: resolve(
        value,
        zone,
        offset,
        behavior,
        ambiguous,
        false
      ),
      timeZone: zone,
      calendar,
    }
  } else {
    if (typeof item !== 'string')
      throw new TypeError('Expected zoned date/time string or object')
    const parsed = parseZonedDateTimeString(item)
    dateOnly = !/[Tt ]/.test(item.slice(0, item.indexOf('[')))
    calendar = constructorCalendar(parsed.fields.calendar)
    zone = timeZoneIdentifier(parsed.timeZone)
    offset = parsed.offset
    value = isoToEpochNanoseconds(parsed.fields)
    matchMinute = true
  }
  const resolved = optionsObject(options),
    ambiguous = disambiguation(resolved.disambiguation),
    behavior = option(resolved.offset, 'reject', [
      'prefer',
      'use',
      'ignore',
      'reject',
    ])
  overflowOption(resolved)
  if (existing) return existing
  if (dateOnly)
    return {
      epochNanoseconds: startOfDay(
        {epochNanoseconds: 0n, timeZone: zone, calendar},
        epochDayOf(value!)
      ),
      timeZone: zone,
      calendar,
    }
  return {
    epochNanoseconds: resolve(
      value!,
      zone,
      offset,
      behavior,
      ambiguous,
      matchMinute
    ),
    timeZone: zone,
    calendar,
  }
}
function add(
  slot: ZonedSlot,
  duration: unknown,
  options: unknown,
  sign: number
): ZonedDateTimeObject {
  const fields = toDurationFields(duration)
  const keys = Object.keys(fields) as (keyof typeof fields)[]
  for (let i = 0; i < keys.length; i++) fields[keys[i]] *= sign
  const overflow = overflowOption(options)
  let value = slot.epochNanoseconds
  if (fields.years || fields.months || fields.weeks || fields.days) {
    const start = local(slot),
      day = addDate(
        {epochDay: epochDayOf(start), calendar: slot.calendar},
        fields,
        overflow
      )
    value = zonedKernel(slot.timeZone).resolve(
      epochNanosecondsToISO(BigInt(day) * nsPerDay + timeOf(start))
    )
  }
  return createZonedDateTime(
    value + durationNanoseconds(fields, false),
    slot.timeZone,
    slot.calendar
  )
}
export function addZonedDuration(
  slot: ZonedSlot,
  fields: DurationFields
): bigint {
  return getZonedSlot(add(slot, fields, undefined, 1))!.epochNanoseconds
}
export function unroundedZonedDifference(
  start: ZonedSlot,
  end: bigint,
  largest: string
): DurationFields {
  const clockIndex = (clockNames as readonly string[]).indexOf(largest)
  if (clockIndex >= 0)
    return balanceDurationTime(end - start.epochNanoseconds, clockIndex + 4)
  const sign =
    end < start.epochNanoseconds ? -1 : end > start.epochNanoseconds ? 1 : 0
  if (!sign) return zeroDuration()
  const begin = epochDayOf(local(start)),
    finish = epochDayOf(local({...start, epochNanoseconds: end}))
  let day = (finish - begin) * sign < 0 ? begin : finish
  let fields = dateUntil(
    {epochDay: begin, calendar: start.calendar},
    day,
    largest
  )
  const anchorFor = (fields: DurationFields): bigint => {
    try {
      return addZonedDuration(start, fields)
    } catch (error) {
      if (!(error instanceof RangeError)) throw error
      return BigInt(sign) * 8_640_000_000_000_000_000_001n
    }
  }
  let anchor = anchorFor(fields)
  while ((anchor - end) * BigInt(sign) > 0n) {
    day -= sign
    if ((day - begin) * sign < 0) {
      fields = zeroDuration()
      anchor = start.epochNanoseconds
      break
    }
    fields = dateUntil(
      {epochDay: begin, calendar: start.calendar},
      day,
      largest
    )
    anchor = anchorFor(fields)
  }
  const time = balanceDurationTime(end - anchor, 4)
  for (let i = 0; i < clockNames.length; i++) {
    const name = (clockNames[i] + 's') as keyof DurationFields
    fields[name] = time[name]
  }
  return fields
}
export function differenceZonedDuration(
  start: ZonedSlot,
  other: unknown,
  options: unknown,
  since: boolean
): DurationObject {
  const end = toZonedDateTimeSlot(other)
  if (start.calendar !== end.calendar) throw new RangeError('Calendars differ')
  const resolved = optionsObject(options),
    largestRaw = resolved.largestUnit,
    largestText = largestRaw === undefined ? 'auto' : ToString(largestRaw)
  const increment = roundingIncrement(resolved.roundingIncrement),
    mode = roundingMode(resolved.roundingMode, 'trunc'),
    smallest = unitOption(resolved.smallestUnit) ?? 'nanosecond'
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
    ],
    smallIndex = names.indexOf(smallest)
  const largest =
    largestText === 'auto'
      ? names[Math.min(4, smallIndex)]
      : unitOption(largestText)!
  const largeIndex = names.indexOf(largest)
  if (largeIndex > smallIndex)
    throw new RangeError('Largest unit smaller than smallest unit')
  if (largeIndex < 4 && !timeZoneEquals(start.timeZone, end.timeZone))
    throw new RangeError('Timezones differ')
  return createDuration(
    roundRelativeDifference(
      start.epochNanoseconds,
      end.epochNanoseconds,
      largest,
      smallest,
      increment,
      mode,
      since,
      {
        zoned: true,
        unrounded: value => unroundedZonedDifference(start, value, largest),
        endpoint: fields => addZonedDuration(start, fields),
      }
    )
  )
}

function startOfDay(slot: ZonedSlot, day = epochDayOf(local(slot))): bigint {
  const kernel = zonedKernel(slot.timeZone),
    midnight = BigInt(day) * nsPerDay
  const fields = epochNanosecondsToISO(midnight),
    candidates = kernel.possibleInstants(fields)
  if (candidates.length) return candidates[0]
  let event: bigint | null = kernel.resolve(fields)
  while (event !== null && event >= midnight - nsPerDay) {
    if (event > -8_640_000_000_000_000_000_000n) {
      const before = kernel.offsetNanoseconds(event - 1n),
        after = kernel.offsetNanoseconds(event)
      if (
        after > before &&
        midnight >= event + before &&
        midnight < event + after
      )
        return event
    }
    event = kernel.transition(event, 'previous')
  }
  throw new RangeError('No day boundary in instant range')
}

function offsetText(slot: ZonedSlot): string {
  const offset = zonedKernel(slot.timeZone).offsetNanoseconds(
    slot.epochNanoseconds
  )
  const negative = offset < 0n,
    absolute = negative ? -offset : offset,
    seconds = absolute / 1_000_000_000n
  let text =
    (negative ? '-' : '+') +
    String(seconds / 3600n).padStart(2, '0') +
    ':' +
    String((seconds / 60n) % 60n).padStart(2, '0')
  if (seconds % 60n || absolute % 1_000_000_000n) {
    text += ':' + String(seconds % 60n).padStart(2, '0')
    const fraction = String(absolute % 1_000_000_000n)
      .padStart(9, '0')
      .replace(/0+$/, '')
    if (fraction) text += '.' + fraction
  }
  return text
}
function format(slot: ZonedSlot, options?: unknown): string {
  const resolved = optionsObject(options),
    suffix = calendarAnnotation(slot.calendar, resolved.calendarName)
  const digits = fractionalSecondDigits(resolved.fractionalSecondDigits)
  const offset = option(resolved.offset, 'auto', ['auto', 'never'])
  const mode = roundingMode(resolved.roundingMode, 'trunc'),
    unit = unitOption(resolved.smallestUnit)
  const zoneName = option(resolved.timeZoneName, 'auto', [
    'auto',
    'never',
    'critical',
  ])
  if (unit !== undefined && timeUnit(unit) === 'hour')
    throw new RangeError('Cannot format hours only')
  const precision: Precision =
    unit === 'minute'
      ? 'minute'
      : unit === 'second'
        ? 0
        : unit === 'millisecond'
          ? 3
          : unit === 'microsecond'
            ? 6
            : unit === 'nanosecond'
              ? 9
              : digits
  const quantum =
    precision === 'auto'
      ? 1n
      : precision === 'minute'
        ? 60_000_000_000n
        : 10n ** BigInt(9 - precision)
  const value = roundInstant(slot.epochNanoseconds, quantum, mode),
    shift = zonedKernel(slot.timeZone).offsetNanoseconds(value)
  return (
    formatInstant(value + shift, precision).slice(0, -1) +
    (offset === 'never'
      ? ''
      : formatInstant(value, 'minute', shift).slice(-6)) +
    (zoneName === 'never'
      ? ''
      : `[${zoneName === 'critical' ? '!' : ''}${slot.timeZone}]`) +
    suffix
  )
}
class ZonedDateTimeValue {
  constructor(
    _epochNanoseconds: unknown,
    _timeZone: unknown,
    _calendar: unknown = undefined
  ) {
    throw new TypeError('Use exported ZonedDateTime constructor')
  }
  static from(
    item: unknown,
    options: unknown = undefined
  ): ZonedDateTimeObject {
    const slot = toZonedDateTimeSlot(item, options)
    return createZonedDateTime(
      slot.epochNanoseconds,
      slot.timeZone,
      slot.calendar
    )
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    const a = toZonedDateTimeSlot(one).epochNanoseconds,
      b = toZonedDateTimeSlot(two).epochNanoseconds
    return a < b ? -1 : a > b ? 1 : 0
  }
  get epochNanoseconds(): bigint {
    return read(this).epochNanoseconds
  }
  get epochMilliseconds(): number {
    const value = read(this).epochNanoseconds
    return Number(
      value / 1_000_000n - (value < 0n && value % 1_000_000n !== 0n ? 1n : 0n)
    )
  }
  get timeZoneId(): string {
    return read(this).timeZone
  }
  get offsetNanoseconds(): number {
    const slot = read(this)
    return Number(
      zonedKernel(slot.timeZone).offsetNanoseconds(slot.epochNanoseconds)
    )
  }
  get offset(): string {
    return offsetText(read(this))
  }
  get hoursInDay(): number {
    const slot = read(this)
    return (
      Number(startOfDay(slot, epochDayOf(local(slot)) + 1) - startOfDay(slot)) /
      3_600_000_000_000
    )
  }
  with(item: unknown, options: unknown = undefined): ZonedDateTimeObject {
    const slot = read(this),
      partial = partialObject(item),
      current = local(slot)
    const updates = Object.create(null) as Record<string, unknown>
    const names = dateFieldNames(slot.calendar, true, 'date', ['offset'])
    let any = false
    for (let i = 0; i < names.length; i++) {
      const key = names[i],
        raw = partial[key]
      if (raw !== undefined) {
        updates[key] =
          key === 'offset' ? offsetString(raw) : dateFieldValue(key, raw)
        any = true
      }
    }
    if (!any) throw new TypeError('At least one field required')
    const fields = mergeDateFields(
      slot.calendar,
      {
        ...epochNanosecondsToISO(current),
        ...dateFields({epochDay: epochDayOf(current), calendar: slot.calendar}),
      },
      updates
    )
    const resolved = optionsObject(options),
      ambiguous = disambiguation(resolved.disambiguation),
      behavior = option(resolved.offset, 'prefer', [
        'prefer',
        'use',
        'ignore',
        'reject',
      ]),
      overflow = overflowOption(resolved)
    const value =
      BigInt(dayFromFields(slot.calendar, fields, overflow)) * nsPerDay +
      clockNanoseconds(fields, overflow)
    const offset =
      updates.offset === undefined
        ? offsetText(slot)
        : (updates.offset as string)
    return createZonedDateTime(
      resolve(value, slot.timeZone, offset, behavior, ambiguous, false),
      slot.timeZone,
      slot.calendar
    )
  }
  round(roundTo: unknown): ZonedDateTimeObject {
    const slot = read(this)
    if (roundTo === undefined) throw new TypeError('roundTo required')
    const resolved: Record<string, unknown> =
      typeof roundTo === 'string'
        ? Object.assign(Object.create(null), {smallestUnit: roundTo})
        : optionsObject(roundTo)
    const increment = roundingIncrement(resolved.roundingIncrement),
      mode = roundingMode(resolved.roundingMode, 'halfExpand'),
      unit = unitOption(resolved.smallestUnit)
    let value: bigint
    if (unit === 'day') {
      if (increment !== 1) throw new RangeError('Invalid day increment')
      const start = startOfDay(slot),
        end = startOfDay(slot, epochDayOf(local(slot)) + 1)
      value =
        start + roundInstant(slot.epochNanoseconds - start, end - start, mode)
    } else {
      const current = local(slot),
        rounded =
          BigInt(epochDayOf(current)) * nsPerDay +
          roundTime(timeOf(current), timeUnit(unit), increment, mode)
      value = resolve(
        rounded,
        slot.timeZone,
        offsetText(slot),
        'prefer',
        'compatible',
        false
      )
    }
    return createZonedDateTime(value, slot.timeZone, slot.calendar)
  }
  withTimeZone(timeZone: unknown): ZonedDateTimeObject {
    const slot = read(this)
    return createZonedDateTime(
      slot.epochNanoseconds,
      timeZoneIdentifier(timeZone),
      slot.calendar
    )
  }
  withCalendar(calendar: unknown): ZonedDateTimeObject {
    const slot = read(this)
    if (calendar === undefined) throw new TypeError('Calendar required')
    return createZonedDateTime(
      slot.epochNanoseconds,
      slot.timeZone,
      calendarId(calendar)
    )
  }
  withPlainTime(time: unknown = undefined): ZonedDateTimeObject {
    const slot = read(this)
    const value =
      time === undefined
        ? startOfDay(slot)
        : zonedKernel(slot.timeZone).resolve(
            epochNanosecondsToISO(
              BigInt(epochDayOf(local(slot))) * nsPerDay +
                getTimeSlot(PlainTime.from(time))!
            )
          )
    return createZonedDateTime(value, slot.timeZone, slot.calendar)
  }
  until(other: unknown, options: unknown = undefined): DurationObject {
    return differenceZonedDuration(read(this), other, options, false)
  }
  since(other: unknown, options: unknown = undefined): DurationObject {
    return differenceZonedDuration(read(this), other, options, true)
  }
  add(duration: unknown, options: unknown = undefined): ZonedDateTimeObject {
    return add(read(this), duration, options, 1)
  }
  subtract(
    duration: unknown,
    options: unknown = undefined
  ): ZonedDateTimeObject {
    return add(read(this), duration, options, -1)
  }
  getTimeZoneTransition(direction: unknown): ZonedDateTimeObject | null {
    const slot = read(this)
    if (direction === undefined) throw new TypeError('Direction required')
    const raw =
      typeof direction === 'string'
        ? direction
        : optionsObject(direction).direction
    if (raw === undefined) throw new RangeError('Direction required')
    const choice = option(raw, 'next', ['next', 'previous'])
    const value = zonedKernel(slot.timeZone).transition(
      slot.epochNanoseconds,
      choice
    )
    return value === null
      ? null
      : createZonedDateTime(value, slot.timeZone, slot.calendar)
  }
  startOfDay(): ZonedDateTimeObject {
    const slot = read(this)
    return createZonedDateTime(startOfDay(slot), slot.timeZone, slot.calendar)
  }
  equals(other: unknown): boolean {
    const a = read(this),
      b = toZonedDateTimeSlot(other)
    return (
      a.epochNanoseconds === b.epochNanoseconds &&
      a.calendar === b.calendar &&
      timeZoneEquals(a.timeZone, b.timeZone)
    )
  }
  toInstant(): InstantObject {
    return createInstant(read(this).epochNanoseconds)
  }
  toPlainDateTime(): PlainDateTimeObject {
    const slot = read(this)
    return createPlainDateTime(local(slot), slot.calendar)
  }
  toPlainDate(): PlainDateObject {
    const slot = read(this)
    return createPlainDate(epochDayOf(local(slot)), slot.calendar)
  }
  toPlainTime(): PlainTimeObject {
    return PlainTime.from(epochNanosecondsToISO(local(read(this))))
  }
  toString(options: unknown = undefined): string {
    return format(read(this), options)
  }
  toJSON(): string {
    return format(read(this))
  }
  valueOf(): never {
    throw new TypeError('Cannot convert Temporal.ZonedDateTime to primitive')
  }
}
Object.defineProperty(ZonedDateTimeValue, 'name', {
  value: 'ZonedDateTime',
  configurable: true,
})
export const ZonedDateTime: ZonedDateTimeConstructor = new Proxy(
  ZonedDateTimeValue,
  {
    construct(target, args, newTarget) {
      const primitive = ToPrimitive(args[0], 'number')
      if (
        typeof primitive !== 'bigint' &&
        typeof primitive !== 'string' &&
        typeof primitive !== 'boolean'
      )
        throw new TypeError('Invalid BigInt input')
      const value = BigInt(primitive)
      if (typeof args[1] !== 'string')
        throw new TypeError('Timezone must be a string')
      if (
        !/^(?:[A-Za-z._][A-Za-z._0-9+-]*(?:\/[A-Za-z._][A-Za-z._0-9+-]*)*|[+-]\d{2}(?::?\d{2})?)$/.test(
          args[1]
        )
      )
        throw new RangeError('Invalid timezone identifier')
      const zone = timeZoneIdentifier(args[1]),
        calendar = constructorCalendar(args[2])
      validateInstant(value)
      const prototype = Reflect.get(newTarget, 'prototype'),
        result = Object.create(object(prototype) ? prototype : target.prototype)
      setZonedSlot(result, {epochNanoseconds: value, timeZone: zone, calendar})
      return result
    },
  }
) as unknown as ZonedDateTimeConstructor
Object.defineProperties(ZonedDateTimeValue.prototype, {
  constructor: {value: ZonedDateTime, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.ZonedDateTime', configurable: true},
})
for (const name of [...datePropertyNames, ...clockNames]) {
  const descriptor = Object.getOwnPropertyDescriptor(
    {
      get [name]() {
        const slot = read(this),
          value = local(slot)
        return (clockNames as readonly string[]).includes(name)
          ? epochNanosecondsToISO(value)[name as (typeof clockNames)[number]]
          : dateProperty(
              {epochDay: epochDayOf(value), calendar: slot.calendar},
              name
            )
      },
    },
    name
  )!
  Object.defineProperty(ZonedDateTimeValue.prototype, name, {
    ...descriptor,
    enumerable: false,
  })
}
