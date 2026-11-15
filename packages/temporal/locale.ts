import type {TemporalDateTimeValue} from '#packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.js'
import type {DurationFields} from '#packages/temporal/duration-core.js'

interface DateTimeConstructor extends Intl.DateTimeFormatConstructor {
  __formatTemporal?: (
    value: TemporalDateTimeValue & {timeZone?: string},
    locales?: unknown,
    options?: unknown
  ) => string
}
let dateTimeConstructor = globalThis.Intl?.DateTimeFormat as
  | DateTimeConstructor
  | undefined
let temporalFormat = dateTimeConstructor?.__formatTemporal
let formatDate =
  dateTimeConstructor &&
  Object.getOwnPropertyDescriptor(dateTimeConstructor.prototype, 'format')?.get
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
  fallback: () => string
): string {
  if (!dateTimeConstructor || !formatDate || !resolvedDate) return fallback()
  if (temporalFormat) return temporalFormat(value, locales, options)
  // Native legacy Intl cannot inspect polyfill slots. Keep the adaptation here.
  const source = options === undefined ? Object.create(null) : Object(options)
  if (options === null) throw new TypeError('Invalid options')
  const snapshot: Record<string, unknown> = Object.create(null)
  const proxy = new Proxy(Object.create(null), {
    get(_target, key) {
      if (typeof key !== 'string') return Reflect.get(source, key)
      if (!Object.prototype.hasOwnProperty.call(snapshot, key))
        snapshot[key] = Reflect.get(source, key)
      if (key === 'timeZone') {
        if (value.kind === 'ZonedDateTime') {
          if (snapshot[key] !== undefined)
            throw new TypeError('timeZone option conflicts with ZonedDateTime')
          return value.timeZone
        }
      }
      return snapshot[key]
    },
  })
  const first = new dateTimeConstructor(
    locales as string | string[] | undefined,
    proxy
  )
  const resolved = resolvedDate.call(first)
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
  const selected: Record<string, unknown> = Object.create(null)
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
    (value.kind === 'PlainTime' && dateStyle !== undefined) ||
    (!instant &&
      value.kind !== 'PlainDateTime' &&
      value.kind !== 'PlainTime' &&
      timeStyle !== undefined)
  )
    throw new TypeError('DateTimeFormat style conflicts with required type')
  if (dateStyle !== undefined || timeStyle !== undefined) {
    selected.dateStyle = dateStyle
    selected.timeStyle = timeStyle
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
  const formatter = new dateTimeConstructor(resolved.locale, selected)
  const ns = value.epochNanoseconds
  const ms = ns / 1_000_000n - (ns < 0n && ns % 1_000_000n ? 1n : 0n)
  return formatDate.call(formatter)(Number(ms))
}
