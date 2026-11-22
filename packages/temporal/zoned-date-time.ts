import {
  zeroPadDecimal,
  formatFractionalSeconds,
} from '#packages/temporal/format-digits.js'
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
  constructorPrototype,
  createObject,
  createProxy,
} from '#packages/temporal/intrinsics.js'
import {defineGetters} from '#packages/temporal/accessors.js'
import {
  allocateZonedDateTime,
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
  createPlainTime,
  toPlainTimeNanoseconds,
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
  zoneName,
} from '#packages/temporal/instant-string.js'
import {
  epochNanosecondsToISO,
  isoToEpochNanoseconds,
  startOfTimeZoneDay,
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
// Proposal comparison §6.3.18 steps 2–3: Validate the ZonedDateTime receiver and supply its epoch slot.
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
// Proposal comparison §11.1.10 steps 1–3 and §12.3.26 steps 1.b and 2: Reuse native zoned projection by slot.
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
// Proposal comparison §11.1.10 steps 1–3: Project an exact zoned epoch into local nanoseconds.
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
// Temporal comparison §6.5.3 steps 1–7. Allocate with the local ZonedDateTime prototype.
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
  const slot =
    typeof input === 'bigint' ? {epochNanoseconds, timeZone, calendar} : input
  if (
    import.meta.formatjsTemporalNativeData !== true &&
    nativeTemporal() === undefined
  )
    return allocateZonedDateTime(
      ZonedDateTimeValue.prototype,
      epochNanoseconds,
      slot.timeZone,
      slot.calendar
    ) as ZonedDateTimeObject
  validateInstant(epochNanoseconds)
  const result = createObject(
    ZonedDateTimeValue.prototype
  ) as ZonedDateTimeObject
  setZonedSlot(result, slot)
  return result
}
// Proposal comparison §13.7 step 1 and §13.9 step 5: Default and validate an already read option.
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
// Proposal comparison §13.41 steps 1–4: Validate an offset string while preserving its spelling.
function offsetString(value: unknown): string {
  const primitive = object(value) ? ToPrimitive(value, 'string') : value
  if (typeof primitive !== 'string')
    throw new TypeErrorConstructor('Offset must be a string')
  parseOffsetNanoseconds(primitive)
  return primitive
}
// Proposal comparison §5.3.38 steps 3–7: Resolve a local date-time with its selected zone and options.
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
  // Proposal comparison §3.3.29 step 5: Use the requested date for day-only inputs.
  const epoch = start
    ? startOfDay(
        {epochNanoseconds: 0n, timeZone: zone, calendar},
        epochDayOf(value)
      )
    : zonedKernel(zone).resolve(epochNanosecondsToISO(value), ambiguous)
  return createZonedDateTime(epoch, zone, calendar)
}
// Proposal comparison §13.7 steps 1–5: Normalize disambiguation with compatible as default.
function disambiguation(value: unknown): Disambiguation {
  return option(value, 'compatible', [
    'compatible',
    'earlier',
    'later',
    'reject',
  ])
}
// Proposal comparison §6.5.1 steps 3.a and 4.d–4.e: Resolve wall time or validate an exact UTC instant.
function resolve(
  localTime: bigint,
  timeZone: string,
  offset: string | bigint | undefined,
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
    typeof offset === 'bigint' ? offset : parseOffsetNanoseconds(offset),
    kernel,
    fields,
    behavior,
    ambiguous,
    matchMinute
  )
}
// Proposal comparison §6.5.1 steps 10.a–10.c.ii and 11–12: Match exact or minute-rounded offset candidates.
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
  const instantLimit = 8_640_000_000_000_000_000_000n
  // §6.5.1 step 7 checks the local date. Keep this guard while MakeDay is unresolved.
  // https://tc39.es/proposal-temporal/#sec-temporal-interpretisodatetimeoffset
  // https://github.com/tc39/ecma262/issues/1087
  if (localTime < -instantLimit)
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
  // Proposal comparison §6.5.1 step 10.b: Probe the sole exact-offset match.
  // A full day of margin keeps every possible candidate in Instant range.
  if (
    !matchMinute &&
    localTime >= -instantLimit + nsPerDay &&
    localTime <= instantLimit - nsPerDay
  ) {
    const candidate = localTime - provided
    if (kernel.offsetNanoseconds(candidate) === provided) return candidate
  }
  if (behavior === 'reject')
    throw new RangeErrorConstructor('Offset does not match timezone')
  return kernel.resolve(fields, ambiguous)
}
// Proposal comparison §6.5.2 steps 5.b, 5.m–5.p and 11: Prepare zoned strings before offset interpretation.
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
// Proposal comparison §6.5.10 steps 1–4 and 8–9: Prepare duration addition or subtraction and build the zoned result.
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
// Proposal comparison §7.3.20 step 27.e and §7.3.21 step 12.e: Supply the resolved zoned duration endpoint.
export function addZonedDuration(
  slot: ZonedSlot,
  fields: DurationFields
): bigint {
  return getZonedSlot(add(slot, fields, undefined, 1))!.epochNanoseconds
}
// Proposal comparison §6.5.6 steps 1–3 and 14–15: Project endpoints and combine calendar and clock differences.
// https://tc39.es/proposal-temporal/#sec-temporal-differencezoneddatetime
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
  // Proposal comparison §6.5.6 steps 4.a–b: Use elapsed time on the same ISO date.
  if (begin === finish)
    return balanceDurationTime(end - start.epochNanoseconds, 4)
  const originClock = timeOf(beginLocal),
    direction = bigIntFrom(sign)
  let day = finish
  if ((timeOf(endLocal) - originClock) * direction < 0n) day -= sign
  if ((day - begin) * sign < 0)
    return balanceDurationTime(end - start.epochNanoseconds, 4)
  const zone = zonedKernel(start.timeZone)
  let anchor: bigint
  while (true) {
    // Proposal comparison §6.5.6 steps 11.a–c: Resolve the raw ISO probe before calendar difference.
    anchor = zone.resolve(
      epochNanosecondsToISO(bigIntFrom(day) * nsPerDay + originClock)
    )
    if ((anchor - end) * direction <= 0n) break
    day -= sign
    // Step 12 can fail when a midnight fold makes every compatible probe overshoot.
    // Related backward-shift failure: https://github.com/tc39/proposal-temporal/issues/3311
    if ((day - begin) * sign < 0)
      return balanceDurationTime(end - start.epochNanoseconds, 4)
  }
  // Proposal comparison §6.5.6 step 14 and §12.3.9 step 2: Use the selected date.
  const fields =
    day === begin
      ? zeroDuration()
      : dateUntil({epochDay: begin, calendar: start.calendar}, day, largest)
  // Proposal comparison §6.5.6 step 11.d: subtract the selected anchor exactly.
  const time = balanceDurationTime(end - anchor, 4)
  for (let i = 0; i < clockNames.length; i++) {
    const name = (clockNames[i] + 's') as keyof DurationFields
    fields[name] = time[name]
  }
  return fields
}
// Proposal comparison §6.5.9 steps 1–4 and 7–9: Prepare zoned difference and dispatch relative rounding.
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
  // ECMA-262 preview §22.3.12.1 steps 1–4: read the rounding options in order.
  // https://tc39.es/ecma262/pr/3966/#sec-getdifferencesettings
  const resolved = optionsObject(options),
    largestRaw = resolved.largestUnit,
    largestText = largestRaw === undefined ? 'auto' : ToString(largestRaw),
    largestOption = largestText === 'auto' ? undefined : unitOption(largestText)
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
  // Steps 11–13: default to hour or the smaller unit, then check unit order.
  const largest =
    largestText === 'auto' ? names[mathMin(4, smallIndex)] : largestOption!
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
  // Proposal comparison §6.5.9 step 9 forwards both instants, the receiver
  // zone and calendar, and the prepared rounding settings.
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
        calendar: start.calendar,
        // Proposal comparison §6.5.7 step 2: pass the prepared endpoints to the zoned difference.
        unrounded: value => unroundedZonedDifference(start, value, largest),
        // Proposal comparison §7.5.33 steps 8.a and 9: build nominal dates before zone resolution.
        nominalDay: fields =>
          addDate(
            {epochDay: epochDayOf(local(start)), calendar: start.calendar},
            fields,
            'constrain'
          ),
        // Step 5 uses the original local clock, zone and calendar.
        endpoint: fields => addZonedDuration(start, fields),
        // Proposal comparison §7.5.35 step 5: Resolve the zero-date clock anchor compatibly.
        // https://tc39.es/proposal-temporal/#sec-temporal-nudgetozonedtime
        compatibleOrigin: () =>
          zonedKernel(start.timeZone).resolve(
            epochNanosecondsToISO(local(start))
          ),
      }
    )
  )
}

// Proposal comparison §11.1.14 steps 1–7: Resolve the selected local date on the active backend.
function startOfDay(slot: ZonedSlot, day?: number): bigint {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.startOfZonedDay(slot, day).epochNanoseconds
  day ??= epochDayOf(local(slot))
  return startOfTimeZoneDay(
    bigIntFrom(day) * nsPerDay,
    zonedKernel(slot.timeZone)
  )
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
// Proposal comparison §6.3.29 step 3: Return an exact Number offset for the fallback zoned slot.
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

const stringSlice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number,
  end?: number
) => string

function offsetText(slot: ZonedSlot): string {
  const cached = zonedSnapshot(slot)
  if (cached) return cached.value.values.offset as string
  const offset = zonedKernel(slot.timeZone).offsetNanoseconds(
    slot.epochNanoseconds
  )
  const negative = offset < 0n,
    absolute = negative ? -offset : offset,
    seconds = absolute / 1_000_000_000n
  // Proposal comparison §11.1.6 steps8–9: private offset digits and fraction.
  // https://tc39.es/proposal-temporal/#sec-temporal-formatutcoffsetnanoseconds
  let text =
    (negative ? '-' : '+') +
    zeroPadDecimal(numberFrom(seconds / 3600n), 2) +
    ':' +
    zeroPadDecimal(numberFrom((seconds / 60n) % 60n), 2)
  if (seconds % 60n || absolute % 1_000_000_000n) {
    text += ':' + zeroPadDecimal(numberFrom(seconds % 60n), 2)
    text += formatFractionalSeconds(
      numberFrom(absolute % 1_000_000_000n),
      'auto'
    )
  }
  return text
}
function format(slot: ZonedSlot, options?: unknown): string {
  // ECMA-262 preview §22.9.3.41 steps 3–12: read options before validating the unit category.
  // https://tc39.es/ecma262/pr/3966/#sec-temporal.zoneddatetime.prototype.tostring
  const resolved = optionsObject(options),
    show = calendarNameOption(resolved.calendarName),
    suffix = calendarAnnotation(slot.calendar, show)
  const digits = fractionalSecondDigits(resolved.fractionalSecondDigits)
  // ECMA-262 preview §22.3.12.11 steps 1–5: read, default and validate the offset display.
  // https://tc39.es/ecma262/pr/3966/#sec-gettemporalshowoffsetoption
  const offset = option(resolved.offset, 'auto', ['auto', 'never'])
  const mode = roundingMode(resolved.roundingMode, 'trunc'),
    unit = unitOption(resolved.smallestUnit, true)
  // ECMA-262 preview §22.3.12.12 steps 1–5: read, default and validate the zone display.
  // https://tc39.es/ecma262/pr/3966/#sec-gettemporalshowtimezonenameoption
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
    // Proposal comparison §6.5.4 steps9,11.a: private ISO and offset substrings.
    // https://tc39.es/proposal-temporal/#sec-temporal-temporalzoneddatetimetostring
    stringSlice(formatInstant(value + shift, precision), 0, -1) +
    (offset === 'never'
      ? ''
      : stringSlice(formatInstant(value, 'minute', shift), -6)) +
    (zoneName === 'never'
      ? ''
      : `[${zoneName === 'critical' ? '!' : ''}${slot.timeZone}]`) +
    suffix
  )
}
class ZonedDateTimeValue {
  // Exported proxy below owns constructor conversion and allocation.
  constructor(
    _epochNanoseconds: unknown,
    _timeZone: unknown,
    _calendar: unknown = undefined
  ) {
    throw new TypeErrorConstructor('Use exported ZonedDateTime constructor')
  }
  // Proposal comparison §6.2.2 step 1.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.from
  static from(
    item: unknown,
    options: unknown = undefined
  ): ZonedDateTimeObject {
    const slot = toZonedDateTimeSlot(item, options)
    return createZonedDateTime(slot, slot.timeZone, slot.calendar)
  }
  // Proposal comparison §6.2.3 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.compare
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
  // Proposal comparison §6.3.18 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-get-temporal.zoneddatetime.prototype.epochnanoseconds
  get epochNanoseconds(): bigint {
    return read(this).epochNanoseconds
  }
  // Proposal comparison §6.3.17 steps 1–5.
  // https://tc39.es/proposal-temporal/#sec-get-temporal.zoneddatetime.prototype.epochmilliseconds
  get epochMilliseconds(): number {
    const value = read(this).epochNanoseconds
    return numberFrom(
      value / 1_000_000n - (value < 0n && value % 1_000_000n !== 0n ? 1n : 0n)
    )
  }
  // Proposal comparison §6.3.4 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-get-temporal.zoneddatetime.prototype.timezoneid
  get timeZoneId(): string {
    return read(this).timeZone
  }
  // Proposal comparison §6.3.29 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-get-temporal.zoneddatetime.prototype.offsetnanoseconds
  get offsetNanoseconds(): number {
    const slot = read(this),
      cached = zonedSnapshot(slot)
    if (cached) return cached.value.values.offsetNanoseconds as number
    // ECMA-262 §21.4.1.21: Query the active host offset at the stored instant.
    // https://tc39.es/ecma262/#sec-getnamedtimezoneoffsetnanoseconds
    if (import.meta.formatjsTemporalHostTimeZones === true)
      return numberFrom(
        zonedKernel(slot.timeZone).offsetNanoseconds(slot.epochNanoseconds)
      )
    return numericOffset(slot)
  }
  // Proposal comparison §6.3.30 steps 1–4.
  // https://tc39.es/proposal-temporal/#sec-get-temporal.zoneddatetime.prototype.offset
  get offset(): string {
    return offsetText(read(this))
  }
  // Proposal comparison §6.3.23 steps 1–10.
  // https://tc39.es/proposal-temporal/#sec-get-temporal.zoneddatetime.prototype.hoursinday
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
  // Proposal comparison §6.3.31 steps 1–26.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.with
  with(item: unknown, options: unknown = undefined): ZonedDateTimeObject {
    const slot = read(this),
      partial = partialObject(item)
    // §6.3.31 steps 7–8 and 16–17 capture the original offset and local time.
    const current = local(slot)
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
      (updates.offset as string | undefined) ?? current - slot.epochNanoseconds
    return createZonedDateTime(
      resolve(value, slot.timeZone, offset, behavior, ambiguous, false),
      slot.timeZone,
      slot.calendar
    )
  }
  // Proposal comparison §6.3.39 steps 1–21.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.round
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
      // ECMA-262 preview §22.9.3.39 step 18.f clamps a repeated civil date.
      // https://tc39.es/ecma262/pr/3966/#sec-temporal.zoneddatetime.prototype.round
      // https://github.com/tc39/proposal-temporal/issues/3312
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
  // Proposal comparison §6.3.33 steps 1–4.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.withtimezone
  withTimeZone(timeZone: unknown): ZonedDateTimeObject {
    const slot = read(this)
    return createZonedDateTime(
      slot.epochNanoseconds,
      timeZoneIdentifier(timeZone),
      slot.calendar
    )
  }
  // Proposal comparison §6.3.34 steps 1–4.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.withcalendar
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
  // Proposal comparison §6.3.32 steps 1–8.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.withplaintime
  withPlainTime(time: unknown = undefined): ZonedDateTimeObject {
    const slot = read(this)
    const value =
      time === undefined
        ? startOfDay(slot)
        : zonedKernel(slot.timeZone).resolve(
            epochNanosecondsToISO(
              bigIntFrom(epochDayOf(local(slot))) * nsPerDay +
                // Proposal comparison §6.3.32 step7.a: private ToTemporalTime.
                // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.withplaintime
                toPlainTimeNanoseconds(time)
            )
          )
    return createZonedDateTime(value, slot.timeZone, slot.calendar)
  }
  // Proposal comparison §6.3.37 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.until
  until(other: unknown, options: unknown = undefined): DurationObject {
    return differenceZonedDuration(read(this), other, options, false)
  }
  // Proposal comparison §6.3.38 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.since
  since(other: unknown, options: unknown = undefined): DurationObject {
    return differenceZonedDuration(read(this), other, options, true)
  }
  // Proposal comparison §6.3.35 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.add
  add(duration: unknown, options: unknown = undefined): ZonedDateTimeObject {
    return add(read(this), duration, options, 1)
  }
  // Proposal comparison §6.3.36 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.subtract
  subtract(
    duration: unknown,
    options: unknown = undefined
  ): ZonedDateTimeObject {
    return add(read(this), duration, options, -1)
  }
  // ECMA-262 preview §22.9.3.46: read the direction before looking up a transition.
  // https://tc39.es/ecma262/pr/3966/#sec-temporal.zoneddatetime.prototype.gettimezonetransition
  getTimeZoneTransition(direction: unknown): ZonedDateTimeObject | null {
    const slot = read(this)
    if (direction === undefined)
      throw new TypeErrorConstructor('Direction required')
    // ECMA-262 preview §22.3.12.2 steps 1–5: read, coerce and validate direction.
    // https://tc39.es/ecma262/pr/3966/#sec-getdirectionoption
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
  // Proposal comparison §6.3.45 steps 1–7.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.startofday
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
  // Proposal comparison §6.3.40 steps 1–6.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.equals
  equals(other: unknown): boolean {
    const a = read(this),
      b = toZonedDateTimeSlot(other)
    return (
      a.epochNanoseconds === b.epochNanoseconds &&
      a.calendar === b.calendar &&
      timeZoneEquals(a.timeZone, b.timeZone)
    )
  }
  // Proposal comparison §6.3.47 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.toinstant
  toInstant(): InstantObject {
    return createInstant(read(this).epochNanoseconds)
  }
  // Proposal comparison §6.3.50 steps 1–4.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.toplaindatetime
  toPlainDateTime(): PlainDateTimeObject {
    const slot = read(this)
    return createPlainDateTime(local(slot), slot.calendar)
  }
  // Proposal comparison §6.3.48 steps 1–4.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.toplaindate
  toPlainDate(): PlainDateObject {
    const slot = read(this)
    return createPlainDate(epochDayOf(local(slot)), slot.calendar)
  }
  // Proposal comparison §6.3.49 steps 1–4.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.toplaintime
  toPlainTime(): PlainTimeObject {
    // Proposal comparison §6.3.49 step4: private CreateTemporalTime.
    // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.toplaintime
    return createPlainTime(timeOf(local(read(this))))
  }
  // Proposal comparison §6.3.41 steps 1–14.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.tostring
  toString(options: unknown = undefined): string {
    return format(read(this), options)
  }
  // Proposal comparison §6.3.42 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.tolocalestring
  toLocaleString(
    locales: unknown = undefined,
    options: unknown = undefined
  ): string {
    const slot = read(this)
    return localeDateTime(
      {kind: 'ZonedDateTime', ...slot},
      locales,
      options,
      localeStringIntrinsic,
      this,
      () => local(slot)
    )
  }
  // Proposal comparison §6.3.43 steps 1–3.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.tojson
  toJSON(): string {
    return format(read(this))
  }
  // Proposal comparison §6.3.44 step 1.
  // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.valueof
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
// Proposal comparison §6.2.1 descriptor.
// https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype
export const ZonedDateTime: ZonedDateTimeConstructor = createProxy(
  ZonedDateTimeValue,
  {
    // Proposal comparison §6.1.1 steps 2–11. Constructor call target supplies step 1.
    // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime
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
      // Proposal comparison §6.1.1 step5: parse identifier without public RegExp.
      // https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime
      else if (!zoneName(zoneArgument))
        throw new RangeErrorConstructor('Invalid timezone identifier')
      const zone = timeZoneIdentifier(zoneArgument),
        calendar = constructorCalendar(argumentAt(args, 2))
      const prototype = constructorPrototype(newTarget, target)
      if (
        import.meta.formatjsTemporalNativeData !== true &&
        nativeTemporal() === undefined
      )
        return allocateZonedDateTime(prototype, value, zone, calendar)
      const result = createObject(prototype)
      setZonedSlot(result, {epochNanoseconds: value, timeZone: zone, calendar})
      return result
    },
  }
) as unknown as ZonedDateTimeConstructor
// Proposal comparison §6.3.1 descriptor.
// https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype.constructor
// Proposal comparison §6.3.2 descriptor.
// https://tc39.es/proposal-temporal/#sec-temporal.zoneddatetime.prototype-%symbol.tostringtag%
Object.defineProperties(ZonedDateTimeValue.prototype, {
  constructor: {value: ZonedDateTime, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.ZonedDateTime', configurable: true},
})
// Shared getter registrations; numbered rendered proposal comparisons.
// §6.3.3 steps 1–3: calendarId.
// §6.3.5 steps 1–4: era.
// §6.3.6 steps 1–6: eraYear.
// §6.3.7 steps 1–4: year.
// §6.3.8 steps 1–4: month.
// §6.3.9 steps 1–4: monthCode.
// §6.3.10 steps 1–4: day.
// §6.3.11 steps 1–4: hour.
// §6.3.12 steps 1–4: minute.
// §6.3.13 steps 1–4: second.
// §6.3.14 steps 1–4: millisecond.
// §6.3.15 steps 1–4: microsecond.
// §6.3.16 steps 1–4: nanosecond.
// §6.3.19 steps 1–4: dayOfWeek.
// §6.3.20 steps 1–4: dayOfYear.
// §6.3.21 steps 1–6: weekOfYear.
// §6.3.22 steps 1–6: yearOfWeek.
// §6.3.24 steps 1–4: daysInWeek.
// §6.3.25 steps 1–4: daysInMonth.
// §6.3.26 steps 1–4: daysInYear.
// §6.3.27 steps 1–4: monthsInYear.
// §6.3.28 steps 1–4: inLeapYear.
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
