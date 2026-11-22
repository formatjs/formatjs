import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arrayEvery,
  arrayIncludes,
  arraySome,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {createObject, createProxy} from '#packages/temporal/intrinsics.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import type {TemporalDateTimeValue} from '#packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.js'
import type {DurationFields} from '#packages/temporal/duration-core.js'
import {
  legacyHostTimeZone,
  legacyZonedProjection,
} from '#packages/temporal/legacy-zoned-date.js'
import {
  legacyDateTimeFormat,
  type LegacyDateTimeProjection,
} from '#packages/temporal/legacy-extended-date.js'

const apply = Reflect.apply
const dateUTC = Date.UTC
const objectKeys = Object.keys

interface DateTimeConstructor extends Intl.DateTimeFormatConstructor {
  __formatTemporal?: (
    value: TemporalDateTimeValue & {timeZone?: string},
    locales?: unknown,
    options?: unknown,
    localNanoseconds?: () => bigint
  ) => string
}
let dateTimeConstructor = globalThis.Intl?.DateTimeFormat as
  | DateTimeConstructor
  | undefined
let temporalFormat = dateTimeConstructor?.__formatTemporal
let formatDate =
  dateTimeConstructor &&
  Object.getOwnPropertyDescriptor(dateTimeConstructor.prototype, 'format')?.get
let partsDate = dateTimeConstructor?.prototype.formatToParts
let resolvedDate = dateTimeConstructor?.prototype.resolvedOptions
let durationConstructor = (
  globalThis.Intl as
    | (typeof Intl & {
        DurationFormat?: new (
          locales?: unknown,
          options?: unknown
        ) => {format(value: DurationFields): string}
      })
    | undefined
)?.DurationFormat
let formatDuration = durationConstructor?.prototype.format

export function configureLocaleFormatting(): void {
  // Refresh captured host formatters after installation.
  dateTimeConstructor = globalThis.Intl?.DateTimeFormat as
    | DateTimeConstructor
    | undefined
  temporalFormat = dateTimeConstructor?.__formatTemporal
  formatDate =
    dateTimeConstructor &&
    Object.getOwnPropertyDescriptor(dateTimeConstructor.prototype, 'format')
      ?.get
  partsDate = dateTimeConstructor?.prototype.formatToParts
  resolvedDate = dateTimeConstructor?.prototype.resolvedOptions
  durationConstructor = (
    globalThis.Intl as
      | (typeof Intl & {
          DurationFormat?: new (
            locales?: unknown,
            options?: unknown
          ) => {format(value: DurationFields): string}
        })
      | undefined
  )?.DurationFormat
  formatDuration = durationConstructor?.prototype.format
}

export function localeDuration(
  fields: DurationFields,
  locales: unknown,
  options: unknown,
  fallback: () => string
): string {
  if (!durationConstructor || !formatDuration) return fallback()
  // Temporal comparison §15.11.1.1 steps3–4: invoke the selected intrinsic formatter.
  // https://tc39.es/proposal-temporal/#sup-temporal.duration.prototype.tolocalestring
  return apply(formatDuration, new durationConstructor(locales, options), [
    {
      ...fields,
    },
  ])
}

// Temporal amendment comparison §15.11.2.1 steps 3–4 and §15.11.3.1 steps 3–4.
// Route prepared Temporal date-time data to the selected formatter.
export function localeDateTime(
  value: TemporalDateTimeValue & {timeZone?: string},
  locales: unknown,
  options: unknown,
  fallback: () => string,
  localNanoseconds?: () => bigint
): string {
  if (!dateTimeConstructor || !formatDate || !resolvedDate) return fallback()
  if (temporalFormat)
    return temporalFormat(value, locales, options, localNanoseconds)
  const projection = legacyDateTimeProjection(
    dateTimeConstructor,
    value,
    locales,
    options,
    true,
    undefined,
    localNanoseconds
  )
  return legacyDateTimeFormat(projection, formatDate, partsDate!, resolvedDate)
}

export interface LegacyDateTimeIntrinsics {
  resolvedOptions: typeof Intl.DateTimeFormat.prototype.resolvedOptions
  formatToParts: typeof Intl.DateTimeFormat.prototype.formatToParts
}

export function legacyDateTimeProjection(
  Constructor: Intl.DateTimeFormatConstructor,
  value: TemporalDateTimeValue & {timeZone?: string},
  locales: unknown,
  options: unknown,
  localeMethod = true,
  intrinsics: LegacyDateTimeIntrinsics = {
    resolvedOptions: resolvedDate!,
    formatToParts: partsDate!,
  },
  localNanoseconds?: () => bigint
): LegacyDateTimeProjection {
  const zoned = value.kind === 'ZonedDateTime' && localNanoseconds !== undefined
  const host = zoned
    ? legacyHostTimeZone(Constructor, value.timeZone!, intrinsics.formatToParts)
    : undefined
  let source: Record<PropertyKey, unknown> | undefined
  const snapshot: Record<string, unknown> = createObject(null)
  const proxy = createProxy(createObject(null), {
    get(_target, key) {
      // Temporal comparison §15.4.1 step 3 and ECMA-262 §7.3.2: coerce options
      // lazily, then capture each string option's Get and conversion once.
      if (source === undefined) {
        if (options === null) throw new TypeErrorConstructor('Invalid options')
        source = options === undefined ? createObject(null) : Object(options)
      }
      if (typeof key !== 'string') return source![key]
      if (!HasOwnProperty(snapshot, key)) {
        const raw = source![key]
        if (
          key === 'timeZone' &&
          value.kind === 'ZonedDateTime' &&
          raw !== undefined
        )
          throw new TypeErrorConstructor(
            'timeZone option conflicts with ZonedDateTime'
          )
        snapshot[key] = legacyDateTimeOption(key, raw)
      }
      return key === 'timeZone' && value.kind === 'ZonedDateTime'
        ? zoned && !host
          ? 'UTC'
          : value.timeZone
        : snapshot[key]
    },
  })
  const first = new Constructor(locales as string | string[] | undefined, proxy)
  const resolved = intrinsics.resolvedOptions.call(first)
  // Proposal comparison §15.4.1 steps 45.b–c: reject required-style conflicts first.
  // https://tc39.es/proposal-temporal/#sec-createdatetimeformat
  const dateStyle = snapshot.dateStyle,
    timeStyle = snapshot.timeStyle
  if (
    localeMethod &&
    ((value.kind === 'PlainTime' && dateStyle !== undefined) ||
      (value.kind !== 'Instant' &&
        value.kind !== 'ZonedDateTime' &&
        value.kind !== 'PlainDateTime' &&
        value.kind !== 'PlainTime' &&
        timeStyle !== undefined))
  )
    throw new TypeErrorConstructor(
      'DateTimeFormat style conflicts with required type'
    )
  if (
    value.calendar !== undefined &&
    value.calendar !== resolved.calendar &&
    (value.calendar !== 'iso8601' ||
      value.kind === 'PlainYearMonth' ||
      value.kind === 'PlainMonthDay')
  )
    throw new RangeErrorConstructor(
      'Temporal calendar does not match DateTimeFormat'
    )
  const date = ['weekday', 'year', 'month', 'day']
  const time = [
    'dayPeriod',
    'hour',
    'minute',
    'second',
    'fractionalSecondDigits',
  ]
  const dateTime = [
    'weekday',
    'year',
    'month',
    'day',
    'dayPeriod',
    'hour',
    'minute',
    'second',
    'fractionalSecondDigits',
  ]
  const required =
    value.kind === 'PlainDate'
      ? date
      : value.kind === 'PlainYearMonth'
        ? ['year', 'month']
        : value.kind === 'PlainMonthDay'
          ? ['month', 'day']
          : value.kind === 'PlainTime'
            ? time
            : dateTime
  // Proposal comparison §15.4.1 steps 45.f–j: private option Lists.
  const allowed: string[] = []
  for (let index = 0; index < required.length; index++)
    allowed[index] = required[index]
  if (value.kind !== 'PlainTime' && value.kind !== 'PlainMonthDay')
    allowed.push('era')
  const instant = value.kind === 'Instant' || value.kind === 'ZonedDateTime'
  if (instant) allowed.push('timeZoneName')
  const selected: Record<string, unknown> = createObject(null)
  const optionKeys = [
    'calendar',
    'numberingSystem',
    'localeMatcher',
    'hour12',
    'hourCycle',
    'formatMatcher',
  ]
  for (let index = 0; index < optionKeys.length; index++) {
    const key = optionKeys[index]
    selected[key] = snapshot[key]
  }
  selected.timeZone = instant ? resolved.timeZone : 'UTC'
  if (dateStyle !== undefined || timeStyle !== undefined) {
    const plainDate =
      value.kind === 'PlainDate' ||
      value.kind === 'PlainYearMonth' ||
      value.kind === 'PlainMonthDay'
    if (
      (plainDate && dateStyle === undefined) ||
      (value.kind === 'PlainTime' && timeStyle === undefined)
    )
      throw new TypeErrorConstructor(
        'DateTimeFormat styles do not overlap the Temporal type'
      )
    const styleFields = legacyStyleFields(
      Constructor,
      resolved,
      dateStyle,
      timeStyle,
      intrinsics.formatToParts
    )
    if (
      arraySome(
        objectKeys(styleFields),
        // Temporal comparison §15.6.2 step 2.b: detect a conflicting style field.
        key => !arrayIncludes(allowed, key)
      )
    ) {
      for (let index = 0; index < allowed.length; index++) {
        const key = allowed[index]
        selected[key] = styleFields[key]
      }
      if (styleFields.hour !== undefined && arrayIncludes(allowed, 'hour'))
        selected.hourCycle = resolved.hourCycle
    } else {
      selected.dateStyle = dateStyle
      selected.timeStyle = timeStyle
    }
  } else {
    for (let index = 0; index < allowed.length; index++) {
      const key = allowed[index]
      selected[key] = snapshot[key]
    }
    if (
      arrayEvery(
        required,
        // Temporal comparison §15.6.1 steps 15–17: no required field was supplied.
        key => snapshot[key] === undefined
      )
    ) {
      if (
        !instant &&
        arraySome(
          dateTime,
          // Temporal comparison §15.6.1 steps 13–14.a and 17.a: detect explicit fields.
          key => snapshot[key] !== undefined
        )
      )
        throw new TypeErrorConstructor(
          'DateTimeFormat options do not overlap the Temporal type'
        )
      const defaults =
        value.kind === 'PlainTime'
          ? ['hour', 'minute', 'second']
          : value.kind === 'PlainDate'
            ? ['year', 'month', 'day']
            : value.kind === 'PlainYearMonth' || value.kind === 'PlainMonthDay'
              ? required
              : ['year', 'month', 'day', 'hour', 'minute', 'second']
      for (let index = 0; index < defaults.length; index++)
        selected[defaults[index]] = 'numeric'
      if (value.kind === 'ZonedDateTime' && selected.timeZoneName === undefined)
        selected.timeZoneName = 'short'
    }
  }
  const formatter = new Constructor(resolved.locale, selected)
  const ns = value.epochNanoseconds
  if (zoned) {
    const local = localNanoseconds!()
    if (!host || host(ns) !== local - ns)
      return legacyZonedProjection(
        Constructor,
        resolved,
        selected,
        local,
        local - ns,
        intrinsics.formatToParts
      )
  }
  const ms = ns / 1_000_000n - (ns < 0n && ns % 1_000_000n ? 1n : 0n)
  return {formatter, milliseconds: numberFrom(ms), plain: !instant}
}

function legacyStyleFields(
  Constructor: Intl.DateTimeFormatConstructor,
  resolved: Intl.ResolvedDateTimeFormatOptions,
  dateStyle: unknown,
  timeStyle: unknown,
  formatToParts: typeof Intl.DateTimeFormat.prototype.formatToParts
): Record<string, unknown> {
  const controls = {
    calendar: resolved.calendar,
    numberingSystem: resolved.numberingSystem,
    timeZone: 'UTC',
    hourCycle: resolved.hourCycle,
  }
  const style = new Constructor(resolved.locale, {
    ...controls,
    dateStyle,
    timeStyle,
  } as Intl.DateTimeFormatOptions)
  const probes = [
    dateUTC(2006, 10, 22, 7, 8, 9),
    dateUTC(1991, 1, 3, 17, 18, 19),
  ]
  // Host metadata for Temporal comparison §15.4.1 step 45.e: map year part names.
  const field = (type: string): string =>
    type === 'relatedYear' || type === 'yearName' ? 'year' : type
  // Proposal comparison §15.4.1 step 45.e: style selection uses private Lists.
  // https://tc39.es/proposal-temporal/#sec-createdatetimeformat
  const parts = [
    formatToParts.call(style, probes[0]),
    formatToParts.call(style, probes[1]),
  ]
  const defaults: Record<string, string> = {
    weekday: 'long',
    era: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }
  const seed: Record<string, unknown> = createObject(null)
  for (let index = 0; index < parts[0].length; index++) {
    const key = field(parts[0][index].type)
    if (defaults[key] !== undefined) seed[key] = defaults[key]
  }
  const text = (values: Intl.DateTimeFormatPart[], key: string): string => {
    // Host metadata for Temporal comparison §15.4.1 step 45.e: collect one label.
    let result = ''
    for (let index = 0; index < values.length; index++) {
      const part = values[index]
      if (field(part.type) === key) result += part.value
    }
    return result
  }
  const result: Record<string, unknown> = {...seed}
  const keys = objectKeys(seed)
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index]
    const widths =
      key === 'year' ||
      key === 'day' ||
      key === 'hour' ||
      key === 'minute' ||
      key === 'second'
        ? ['numeric', '2-digit']
        : key === 'month'
          ? ['numeric', '2-digit', 'long', 'short', 'narrow']
          : key === 'timeZoneName'
            ? ['short', 'long']
            : ['long', 'short', 'narrow']
    for (let index = 0; index < widths.length; index++) {
      const width = widths[index]
      const candidate = new Constructor(resolved.locale, {
        ...controls,
        ...seed,
        [key]: width,
      } as Intl.DateTimeFormatOptions)
      if (
        arrayEvery(
          probes,
          // Host metadata for Temporal comparison §15.4.1 step 45.e: compare widths.
          (probe, index) =>
            text(formatToParts.call(candidate, probe), key) ===
            text(parts[index], key)
        )
      ) {
        result[key] = width
        break
      }
    }
  }
  return result
}

// Temporal amendment comparison §15.4.1 steps 13, 29.b, 38.b.i, 38.c.ii.
// Convert the captured option value before passing it to the host.
export function legacyDateTimeOption(key: string, value: unknown): unknown {
  if (value === undefined) return undefined
  if (key === 'hour12') return !!value
  if (key === 'fractionalSecondDigits') return +(value as number)
  return ToString(value)
}
