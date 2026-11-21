import {numberFrom} from '#packages/ecma262-abstract/intrinsics.js'
import {createObject} from '#packages/temporal/intrinsics.js'
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

const dateUTC = Date.UTC

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
  return formatDuration.call(new durationConstructor(locales, options), {
    ...fields,
  })
}

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
  const proxy = new Proxy(createObject(null), {
    get(_target, key) {
      if (source === undefined) {
        if (options === null) throw new TypeError('Invalid options')
        source = options === undefined ? createObject(null) : Object(options)
      }
      if (typeof key !== 'string') return source![key]
      if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
        const raw = source![key]
        if (
          key === 'timeZone' &&
          value.kind === 'ZonedDateTime' &&
          raw !== undefined
        )
          throw new TypeError('timeZone option conflicts with ZonedDateTime')
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
  if (
    value.calendar !== undefined &&
    value.calendar !== resolved.calendar &&
    (value.calendar !== 'iso8601' ||
      value.kind === 'PlainYearMonth' ||
      value.kind === 'PlainMonthDay')
  )
    throw new RangeError('Temporal calendar does not match DateTimeFormat')
  const date = ['weekday', 'year', 'month', 'day']
  const time = [
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
            : [...date, ...time]
  const allowed = [...required]
  if (value.kind !== 'PlainTime' && value.kind !== 'PlainMonthDay')
    allowed.push('era')
  const instant = value.kind === 'Instant' || value.kind === 'ZonedDateTime'
  if (instant) allowed.push('timeZoneName')
  const selected: Record<string, unknown> = createObject(null)
  for (const key of [
    'calendar',
    'numberingSystem',
    'localeMatcher',
    'hour12',
    'hourCycle',
    'formatMatcher',
  ])
    selected[key] = snapshot[key]
  selected.timeZone = instant ? resolved.timeZone : 'UTC'
  const dateStyle = snapshot.dateStyle,
    timeStyle = snapshot.timeStyle
  if (
    localeMethod &&
    ((value.kind === 'PlainTime' && dateStyle !== undefined) ||
      (!instant &&
        value.kind !== 'PlainDateTime' &&
        value.kind !== 'PlainTime' &&
        timeStyle !== undefined))
  )
    throw new TypeError('DateTimeFormat style conflicts with required type')
  if (dateStyle !== undefined || timeStyle !== undefined) {
    const plainDate =
      value.kind === 'PlainDate' ||
      value.kind === 'PlainYearMonth' ||
      value.kind === 'PlainMonthDay'
    if (
      (plainDate && dateStyle === undefined) ||
      (value.kind === 'PlainTime' && timeStyle === undefined)
    )
      throw new TypeError(
        'DateTimeFormat styles do not overlap the Temporal type'
      )
    const styleFields = legacyStyleFields(
      Constructor,
      resolved,
      dateStyle,
      timeStyle,
      intrinsics.formatToParts
    )
    if (Object.keys(styleFields).some(key => !allowed.includes(key))) {
      for (const key of allowed) selected[key] = styleFields[key]
      if (styleFields.hour !== undefined && allowed.includes('hour'))
        selected.hourCycle = resolved.hourCycle
    } else {
      selected.dateStyle = dateStyle
      selected.timeStyle = timeStyle
    }
  } else {
    for (const key of allowed) selected[key] = snapshot[key]
    if (required.every(key => snapshot[key] === undefined)) {
      if (
        !instant &&
        [...date, ...time].some(key => snapshot[key] !== undefined)
      )
        throw new TypeError(
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
      for (const key of defaults) selected[key] = 'numeric'
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
  const field = (type: string): string =>
    type === 'relatedYear' || type === 'yearName' ? 'year' : type
  const parts = probes.map(probe => formatToParts.call(style, probe))
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
  for (const part of parts[0]) {
    const key = field(part.type)
    if (defaults[key] !== undefined) seed[key] = defaults[key]
  }
  const text = (values: Intl.DateTimeFormatPart[], key: string): string =>
    values
      .filter(part => field(part.type) === key)
      .map(part => part.value)
      .join('')
  const result: Record<string, unknown> = {...seed}
  for (const key of Object.keys(seed)) {
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
    for (const width of widths) {
      const candidate = new Constructor(resolved.locale, {
        ...controls,
        ...seed,
        [key]: width,
      } as Intl.DateTimeFormatOptions)
      if (
        probes.every(
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

export function legacyDateTimeOption(key: string, value: unknown): unknown {
  if (value === undefined) return undefined
  if (key === 'hour12') return !!value
  if (key === 'fractionalSecondDigits') return +(value as number)
  return ToString(value)
}
