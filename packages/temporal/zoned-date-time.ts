import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayIncludes,
  arrayIndexOf,
  bigIntFrom,
  mathMin,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  argumentAt,
  createObject,
  createProxy,
} from '#packages/temporal/intrinsics.js'
import {defineGetters} from '#packages/temporal/accessors.js'
import {
  nativeTemporal,
  type NativeTemporal,
  type NativeDateSnapshot,
} from '#packages/temporal/native.js'
import {localeDateTime} from '#packages/temporal/locale.js'
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
  validateTimeIncrement,
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
  isTimeZoneOffsetString,
} from '#packages/temporal/instant-string.js'
import {
  epochNanosecondsToISO,
  isoToEpochNanoseconds,
  type Disambiguation,
  type ISODateTime,
  type TimeZoneKernel,
} from '#packages/temporal/kernel.js'
import {
  calendarId,
  calendarFromObject,
  constructorCalendar,
  calendarAnnotation,
  calendarNameOption,
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
  toNativeDurationFields,
  createDuration,
  type DurationObject,
} from '#packages/temporal/duration.js'
import {
  durationFieldNames,
  durationNanoseconds,
  zeroDuration,
  balanceDurationTime,
  type DurationFields,
} from '#packages/temporal/duration-core.js'
import {
  optionsObject,
  unitOptions,
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
  readonly [Symbol.toStringTag]: 'Temporal.ZonedDateTime'
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
  toLocaleString(locales?: unknown, options?: unknown): string
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
  if (!slot) throw new TypeErrorConstructor('Invalid ZonedDateTime receiver')
  return slot
}
const zonedSnapshots = new WeakMap<
  ZonedSlot,
  {
    owner: NativeTemporal
    value: NativeDateSnapshot
    local: bigint
    date: {epochDay: number; calendar: string; properties: NativeDateSnapshot}
  }
>()
function zonedSnapshot(slot: ZonedSlot) {
  const owner = nativeTemporal()
  if (!owner) return undefined
  let entry = zonedSnapshots.get(slot)
  if (entry?.owner === owner) return entry
  const value =
    slot.properties?.owner === owner
      ? slot.properties
      : owner.zonedProperties(slot)
  value.owner = owner
  const local = bigIntFrom(value.values.localNanoseconds as string)
  entry = {
    owner,
    value,
    local,
    date: {
      epochDay: epochDayOf(local),
      calendar: slot.calendar,
      properties: value,
    },
  }
  zonedSnapshots.set(slot, entry)
  return entry
}
function local(slot: ZonedSlot): bigint {
  const cached = zonedSnapshot(slot)
  if (cached) return cached.local
  return (
    slot.epochNanoseconds +
    zonedKernel(slot.timeZone).offsetNanoseconds(slot.epochNanoseconds)
  )
}
const NativeZonedDateTime = function (
  this: ZonedDateTimeObject,
  slot: ZonedSlot
) {
  setZonedSlot(this, slot)
}
export function createZonedDateTime(
  input: bigint | ZonedSlot,
  timeZone: string,
  calendar: string
): ZonedDateTimeObject {
  if (
    import.meta.formatjsTemporalNativeData === true &&
    typeof input !== 'bigint'
  )
    return new (NativeZonedDateTime as unknown as new (
      slot: ZonedSlot
    ) => ZonedDateTimeObject)(input)
  const epochNanoseconds =
    typeof input === 'bigint' ? input : input.epochNanoseconds
  validateInstant(epochNanoseconds)
  const result = createObject(
    ZonedDateTimeValue.prototype
  ) as ZonedDateTimeObject
  setZonedSlot(
    result,
    typeof input === 'bigint' ? {epochNanoseconds, timeZone, calendar} : input
  )
  return result
}
function option<T extends string>(
  value: unknown,
  fallback: T,
  allowed: readonly T[]
): T {
  const text = value === undefined ? fallback : ToString(value)
  if (!arrayIncludes(allowed, text as T))
    throw new RangeErrorConstructor('Invalid option')
  return text as T
}
function offsetString(value: unknown): string {
  const primitive = object(value) ? ToPrimitive(value, 'string') : value
  if (typeof primitive !== 'string')
    throw new TypeErrorConstructor('Offset must be a string')
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
  if (offset === 'Z' || offset === 'z') return validateInstant(localTime)
  if (offset === undefined || behavior === 'ignore')
    return kernel.resolve(fields, ambiguous)
  return resolveOffsetNanoseconds(
    localTime,
    parseOffsetNanoseconds(offset),
    kernel,
    fields,
    behavior,
    ambiguous,
    matchMinute
  )
}
function resolveOffsetNanoseconds(
  localTime: bigint,
  provided: bigint,
  kernel: TimeZoneKernel,
  fields: ISODateTime,
  behavior: string,
  ambiguous: Disambiguation,
  matchMinute: boolean
): bigint {
  if (behavior === 'use') return validateInstant(localTime - provided)
  if (localTime < -8_640_000_000_000_000_000_000n)
    throw new RangeErrorConstructor('Local date out of range')
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
    throw new RangeErrorConstructor('Offset does not match timezone')
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
    dateOnly = false,
    parsedString: ReturnType<typeof parseZonedDateTimeString> | undefined
  if (existing) {
    calendar = existing.calendar
    zone = existing.timeZone
  } else if (object(item)) {
    calendar = calendarFromObject(item)
    // Prepare fields in alphabetical order, including offset/timeZone.
    const prepared = createObject(null) as Record<string, unknown>
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
      bigIntFrom(dayFromFields(calendar, fields, overflow)) * nsPerDay +
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
      throw new TypeErrorConstructor(
        'Expected zoned date/time string or object'
      )
    const parsed = parseZonedDateTimeString(item)
    parsedString = parsed
    dateOnly = true
    for (let index = 0; index < item.length && item[index] !== '['; index++) {
      const character = item[index]
      if (character === 'T' || character === 't' || character === ' ') {
        dateOnly = false
        break
      }
    }
    calendar = constructorCalendar(parsed.fields.calendar)
    zone =
      import.meta.formatjsTemporalNativeData === true &&
      parsed.validatedTimeZone !== undefined
        ? parsed.validatedTimeZone
        : timeZoneIdentifier(parsed.timeZone)
    offset = parsed.offset
    matchMinute =
      offset !== undefined &&
      (offset.length === 3 || offset.length === 5 || offset.length === 6)
  }
  // String branch: https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L992-L995
  // L992: resolve options after parsing syntax and identifiers, before range checks.
  const resolved = optionsObject(options),
    // L993: disambiguation is read and validated first.
    ambiguous = disambiguation(resolved.disambiguation),
    // L994: offset follows, with reject as the default.
    behavior = option(resolved.offset, 'reject', [
      'prefer',
      'use',
      'ignore',
      'reject',
    ])
  // L995: read and validate overflow even for string input.
  overflowOption(resolved)
  if (existing) return existing
  if (parsedString)
    value =
      import.meta.formatjsTemporalNativeData === true &&
      parsedString.localNanoseconds !== undefined
        ? parsedString.localNanoseconds
        : isoToEpochNanoseconds(parsedString.fields)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.resolveZonedDateTime(
      value!,
      zone,
      calendar,
      offset,
      behavior,
      ambiguous,
      matchMinute,
      dateOnly
    )
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
  const fields =
    import.meta.formatjsTemporalNativeData === true
      ? toNativeDurationFields(duration)
      : toDurationFields(duration)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return createZonedDateTime(
      native!.addZonedDateTime(slot, fields, sign < 0, overflowOption(options)),
      slot.timeZone,
      slot.calendar
    )
  for (let i = 0; i < durationFieldNames.length; i++)
    fields[durationFieldNames[i]] *= sign
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
      epochNanosecondsToISO(bigIntFrom(day) * nsPerDay + timeOf(start))
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
  const clockIndex = arrayIndexOf(clockNames as readonly string[], largest)
  if (clockIndex >= 0)
    return balanceDurationTime(end - start.epochNanoseconds, clockIndex + 4)
  const sign =
    end < start.epochNanoseconds ? -1 : end > start.epochNanoseconds ? 1 : 0
  if (!sign) return zeroDuration()
  const beginLocal = local(start),
    endLocal = local({...start, epochNanoseconds: end}),
    begin = epochDayOf(beginLocal),
    finish = epochDayOf(endLocal)
  let day = finish
  if ((timeOf(endLocal) - timeOf(beginLocal)) * bigIntFrom(sign) < 0n)
    day -= sign
  if ((day - begin) * sign < 0) day = begin
  let fields = dateUntil(
    {epochDay: begin, calendar: start.calendar},
    day,
    largest
  )
  const anchorFor = (fields: DurationFields): bigint => {
    try {
      return addZonedDuration(start, fields)
    } catch (error) {
      if (!(error instanceof RangeErrorConstructor)) throw error
      return bigIntFrom(sign) * 8_640_000_000_000_000_000_001n
    }
  }
  let anchor = anchorFor(fields)
  while ((anchor - end) * bigIntFrom(sign) > 0n) {
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
  since: boolean,
  isDurationRounding = false
): DurationObject {
  const end = toZonedDateTimeSlot(other)
  if (start.calendar !== end.calendar)
    throw new RangeErrorConstructor('Calendars differ')
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
    smallIndex = arrayIndexOf(names, smallest)
  const largest =
    largestText === 'auto'
      ? names[mathMin(4, smallIndex)]
      : unitOption(largestText)!
  const largeIndex = arrayIndexOf(names, largest)
  if (largeIndex > smallIndex)
    throw new RangeErrorConstructor('Largest unit smaller than smallest unit')
  if (largeIndex < 4 && !timeZoneEquals(start.timeZone, end.timeZone))
    throw new RangeErrorConstructor('Timezones differ')
  if (!isDurationRounding && start.epochNanoseconds === end.epochNanoseconds) {
    if (smallIndex >= 4) {
      const maximum = [24, 60, 60, 1000, 1000, 1000][smallIndex - 4]
      if (increment >= maximum || maximum % increment)
        throw new RangeErrorConstructor('Invalid rounding increment')
    }
    return createDuration(zeroDuration())
  }
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return createDuration(
      native!.differenceZonedDateTime(
        start,
        end,
        largest,
        smallest,
        increment,
        mode,
        since
      )
    )
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

function startOfDay(slot: ZonedSlot, day?: number): bigint {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.startOfZonedDay(slot, day).epochNanoseconds
  day ??= epochDayOf(local(slot))
  const kernel = zonedKernel(slot.timeZone),
    midnight = bigIntFrom(day) * nsPerDay
  if (
    midnight <= -8_640_000_000_000_000_000_000n - nsPerDay ||
    midnight >= 8_640_000_000_000_000_000_000n + nsPerDay
  )
    throw new RangeErrorConstructor('Local date out of range')
  const candidates = kernel.possibleInstantsFromEpochNanoseconds
    ? kernel.possibleInstantsFromEpochNanoseconds(midnight)
    : kernel.possibleInstants(epochNanosecondsToISO(midnight))
  if (candidates.length) return candidates[0]
  const fields = epochNanosecondsToISO(midnight)
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
  throw new RangeErrorConstructor('No day boundary in instant range')
}

const numericOffsetSlots: (ZonedSlot | undefined)[] = [
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
]
const numericOffsetValues = new Float64Array(16)
let numericOffsetPosition = 0
let numericOffsetSkip = 0
function numericOffset(slot: ZonedSlot): number {
  const remember = numericOffsetSkip === 0
  if (remember) {
    for (let index = 0; index < numericOffsetSlots.length; index++) {
      if (numericOffsetSlots[index] === slot) return numericOffsetValues[index]
    }
    numericOffsetSkip = 32
  } else numericOffsetSkip--
  const value = numberFrom(
    zonedKernel(slot.timeZone).offsetNanoseconds(slot.epochNanoseconds)
  )
  if (remember) {
    numericOffsetSlots[numericOffsetPosition] = slot
    numericOffsetValues[numericOffsetPosition] = value
    numericOffsetPosition = (numericOffsetPosition + 1) & 15
  }
  return value
}

function offsetText(slot: ZonedSlot): string {
  const cached = zonedSnapshot(slot)
  if (cached) return cached.value.values.offset as string
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
    show = calendarNameOption(resolved.calendarName),
    suffix = calendarAnnotation(slot.calendar, show)
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
    throw new RangeErrorConstructor('Cannot format hours only')
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
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.formatZonedDateTime(
      slot,
      precision,
      mode,
      show,
      offset !== 'never',
      zoneName
    )
  const quantum =
    precision === 'auto'
      ? 1n
      : precision === 'minute'
        ? 60_000_000_000n
        : 10n ** bigIntFrom(9 - precision)
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
    throw new TypeErrorConstructor('Use exported ZonedDateTime constructor')
  }
  static from(
    item: unknown,
    options: unknown = undefined
  ): ZonedDateTimeObject {
    const slot = toZonedDateTimeSlot(item, options)
    return createZonedDateTime(slot, slot.timeZone, slot.calendar)
  }
  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    const a = toZonedDateTimeSlot(one).epochNanoseconds,
      b = toZonedDateTimeSlot(two).epochNanoseconds
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/instant.html#L435-L437
    // L435: a greater first epoch returns 1.
    // L436: a lesser first epoch returns -1.
    // L437: equal epochs return 0.
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L74
    // L74: compare private epochs; timezone and calendar do not affect the sign.
    return a < b ? -1 : a > b ? 1 : 0
  }
  get epochNanoseconds(): bigint {
    return read(this).epochNanoseconds
  }
  get epochMilliseconds(): number {
    const value = read(this).epochNanoseconds
    return numberFrom(
      value / 1_000_000n - (value < 0n && value % 1_000_000n !== 0n ? 1n : 0n)
    )
  }
  get timeZoneId(): string {
    return read(this).timeZone
  }
  get offsetNanoseconds(): number {
    const slot = read(this),
      cached = zonedSnapshot(slot)
    if (cached) return cached.value.values.offsetNanoseconds as number
    return numericOffset(slot)
  }
  get offset(): string {
    return offsetText(read(this))
  }
  get hoursInDay(): number {
    const slot = read(this),
      cached = zonedSnapshot(slot)
    if (cached) {
      if (arrayIncludes(cached.value.errors, 'hoursInDay'))
        throw new RangeErrorConstructor('Day boundary out of range')
      return cached.value.values.hoursInDay as number
    }
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return native!.hoursInZonedDay(slot)
    return (
      numberFrom(
        startOfDay(slot, epochDayOf(local(slot)) + 1) - startOfDay(slot)
      ) / 3_600_000_000_000
    )
  }
  with(item: unknown, options: unknown = undefined): ZonedDateTimeObject {
    const slot = read(this),
      partial = partialObject(item),
      current = local(slot)
    const updates = createObject(null) as Record<string, unknown>
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
    if (!any) throw new TypeErrorConstructor('At least one field required')
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native) {
      dateFields(zonedSnapshot(slot)!.date)
      const resolved = optionsObject(options),
        ambiguous = disambiguation(resolved.disambiguation),
        behavior = option(resolved.offset, 'prefer', [
          'prefer',
          'use',
          'ignore',
          'reject',
        ]),
        overflow = overflowOption(resolved)
      return createZonedDateTime(
        native!.withZoned(slot, updates, overflow, ambiguous, behavior),
        slot.timeZone,
        slot.calendar
      )
    }
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
      bigIntFrom(dayFromFields(slot.calendar, fields, overflow)) * nsPerDay +
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
    if (roundTo === undefined)
      throw new TypeErrorConstructor('roundTo required')
    // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L626-L629
    // L626: select string shorthand; L627: retain the primitive unit string.
    // L628: create a null-prototype record; L629: create its own smallestUnit data property.
    const resolved: Record<string, unknown> =
      typeof roundTo === 'string'
        ? unitOptions(roundTo)
        : optionsObject(roundTo)
    const increment = roundingIncrement(resolved.roundingIncrement),
      mode = roundingMode(resolved.roundingMode, 'halfExpand'),
      unit = unitOption(resolved.smallestUnit)
    if (unit === 'day') {
      if (increment !== 1)
        throw new RangeErrorConstructor('Invalid day increment')
    } else validateTimeIncrement(timeUnit(unit), increment)
    if (unit === 'nanosecond' && increment === 1)
      return createZonedDateTime(
        slot.epochNanoseconds,
        slot.timeZone,
        slot.calendar
      )
    const native = nativeTemporal()
    if (import.meta.formatjsTemporalNativeData === true || native)
      return createZonedDateTime(
        native!.roundZonedDateTime(
          slot,
          unit === 'day' ? 'day' : timeUnit(unit),
          increment,
          mode
        ),
        slot.timeZone,
        slot.calendar
      )
    let value: bigint
    if (unit === 'day') {
      const start = startOfDay(slot),
        end = startOfDay(slot, epochDayOf(local(slot)) + 1)
      const current =
        slot.epochNanoseconds < end ? slot.epochNanoseconds : end - 1n
      value = start + roundInstant(current - start, end - start, mode)
    } else {
      const current = local(slot),
        rounded =
          bigIntFrom(epochDayOf(current)) * nsPerDay +
          roundTime(timeOf(current), timeUnit(unit), increment, mode)
      // Keep the original offset for exact matching.
      const offset = zonedKernel(slot.timeZone).offsetNanoseconds(
        slot.epochNanoseconds
      )
      value = resolveOffsetNanoseconds(
        rounded,
        offset,
        zonedKernel(slot.timeZone),
        epochNanosecondsToISO(rounded),
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
    if (calendar === undefined)
      throw new TypeErrorConstructor('Calendar required')
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
              bigIntFrom(epochDayOf(local(slot))) * nsPerDay +
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
    if (direction === undefined)
      throw new TypeErrorConstructor('Direction required')
    const raw =
      typeof direction === 'string'
        ? direction
        : optionsObject(direction).direction
    if (raw === undefined) throw new RangeErrorConstructor('Direction required')
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
    const native = nativeTemporal()
    return createZonedDateTime(
      import.meta.formatjsTemporalNativeData === true || native
        ? native!.startOfZonedDay(slot)
        : startOfDay(slot),
      slot.timeZone,
      slot.calendar
    )
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
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    const slot = read(this)
    return localeDateTime(
      {kind: 'ZonedDateTime', ...slot},
      locales,
      options,
      () => localeStringIntrinsic.call(this),
      () => local(slot)
    )
  }
  toJSON(): string {
    return format(read(this))
  }
  valueOf(): never {
    throw new TypeErrorConstructor(
      'Cannot convert Temporal.ZonedDateTime to primitive'
    )
  }
}
const localeStringIntrinsic = ZonedDateTimeValue.prototype.toString

Object.defineProperty(ZonedDateTimeValue, 'name', {
  value: 'ZonedDateTime',
  configurable: true,
})
if (import.meta.formatjsTemporalNativeData === true)
  NativeZonedDateTime.prototype = ZonedDateTimeValue.prototype
// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/zoneddatetime.html#L30-L33
// L30: ordinary calls reach the class target, which rejects missing NewTarget.
export const ZonedDateTime: ZonedDateTimeConstructor = createProxy(
  ZonedDateTimeValue,
  {
    construct(target, args, newTarget) {
      // L31: ToPrimitive uses the number hint; only Boolean/String/BigInt may follow.
      const primitive = ToPrimitive(argumentAt(args, 0), 'number')
      if (
        typeof primitive !== 'bigint' &&
        typeof primitive !== 'string' &&
        typeof primitive !== 'boolean'
      )
        throw new TypeErrorConstructor('Invalid BigInt input')
      // L32: epoch representability precedes timezone/calendar validation.
      const value = validateInstant(bigIntFrom(primitive))
      const zoneArgument = argumentAt(args, 1)
      // L33: omitted and non-String timezone arguments are rejected without coercion.
      if (typeof zoneArgument !== 'string')
        throw new TypeErrorConstructor('Timezone must be a string')
      if (isTimeZoneOffsetString(zoneArgument))
        parseOffsetNanoseconds(zoneArgument, true)
      else if (
        !/^[A-Za-z._][A-Za-z._0-9+-]*(?:\/[A-Za-z._][A-Za-z._0-9+-]*)*$/.test(
          zoneArgument
        )
      )
        throw new RangeErrorConstructor('Invalid timezone identifier')
      const zone = timeZoneIdentifier(zoneArgument),
        calendar = constructorCalendar(argumentAt(args, 2))
      const prototype = newTarget.prototype,
        result = createObject(object(prototype) ? prototype : target.prototype)
      setZonedSlot(result, {epochNanoseconds: value, timeZone: zone, calendar})
      return result
    },
  }
) as unknown as ZonedDateTimeConstructor
Object.defineProperties(ZonedDateTimeValue.prototype, {
  constructor: {value: ZonedDateTime, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.ZonedDateTime', configurable: true},
})
defineGetters(
  ZonedDateTimeValue.prototype,
  [...datePropertyNames, ...clockNames],
  (receiver, name) => {
    const slot = read(receiver),
      cached = zonedSnapshot(slot)
    if (cached) {
      if (arrayIncludes(clockNames as readonly string[], name))
        return cached.value.values[name]
      return dateProperty(cached.date, name)
    }
    const value = local(slot)
    return arrayIncludes(clockNames as readonly string[], name)
      ? epochNanosecondsToISO(value)[name as (typeof clockNames)[number]]
      : dateProperty(
          {epochDay: epochDayOf(value), calendar: slot.calendar},
          name
        )
  }
)
