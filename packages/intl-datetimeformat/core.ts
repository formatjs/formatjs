import {getIntlFallbackSymbol} from '#packages/ecma402-abstract/intl-fallback-symbol.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {
  arrayEvery,
  arrayIncludes,
  arrayIndexOf,
  bigIntFrom,
  numberFrom,
  numberIsInteger,
  RangeErrorConstructor,
  setDataProperty,
  TypeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
import type {
  CalendarData,
  CalendarRegistry,
} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import {registerLocaleData} from '#packages/ecma402-abstract/registerLocaleData.js'
import {OrdinaryHasInstance} from '#packages/ecma262-abstract/OrdinaryHasInstance.js'
import {
  ToDateTimeFormattable,
  registerTemporalDateTimeNamespace,
  type TemporalDateTimeNamespace,
  type TemporalDateTimeValue,
} from '#packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {CanonicalizeTimeZoneName} from '#packages/ecma402-abstract/CanonicalizeTimeZoneName.js'
import {IsValidTimeZoneName} from '#packages/ecma402-abstract/IsValidTimeZoneName.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {
  type DateTimeFormatLocaleInternalData,
  type DateTimeFormat as IDateTimeFormat,
  type IntlDateTimeFormatInternal,
  type Formats,
  type TABLE_6,
  type TemporalDateTimeInput,
  type UnpackedTimeZoneData,
} from '#packages/ecma402-abstract/types/date-time.js'
import {
  defineProperty,
  createDataProperty,
} from '#packages/ecma402-abstract/utils.js'
import {FormatDateTime} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTime.js'
import {FormatDateTimeRange} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimeRange.js'
import {FormatDateTimeRangeToParts} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimeRangeToParts.js'
import {FormatDateTimeToParts} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimeToParts.js'
import {
  InitializeDateTimeFormat,
  type DateTimeFormatContext,
} from '#packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.js'
import {
  parseDateTimeSkeleton,
  getRangePatternInfo,
  expandIntervalFormatTemplates,
} from '#packages/ecma402-abstract/DateTimeFormat/skeleton.js'
import {
  NearestTimeZoneLocalAfter,
  TimeZoneOffset,
  TimeZoneTransition,
  VisitTimeZoneBoundaries,
  VisitTimeZoneOffsets,
} from '#packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.js'
import {DATE_TIME_PROPS} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'
import links from '@formatjs_generated/tz/links.js'
import primary from '@formatjs_generated/tz/primary.js'
import getInternalSlots, {
  hasInternalSlots,
} from '#packages/intl-datetimeformat/get_internal_slots.js'
import {unpack} from '#packages/intl-datetimeformat/unpack.js'
import {
  type PackedData,
  type RawCalendarLocaleData,
  type RawDateTimeLocaleData,
} from '#packages/intl-datetimeformat/types.js'

const now = Date.now
const createObject = Object.create
const objectDefineProperty = Object.defineProperty
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const reflectApply = Reflect.apply
const timeZoneUpperCase = String.prototype.toUpperCase
const timeZoneCharCodeAt = String.prototype.charCodeAt
const objectKeys = Object.keys
const hostTimeZoneProvider = (() => {
  try {
    const Constructor = globalThis.Intl?.DateTimeFormat
    if (
      typeof Constructor !== 'function' ||
      getOwnPropertyDescriptor(Constructor, 'polyfilled')?.value
    )
      return
    const resolvedOptions = Constructor.prototype?.resolvedOptions
    if (typeof resolvedOptions === 'function')
      return {Constructor, resolvedOptions}
  } catch {
    // A partial host Intl can fail before the time-zone query.
  }
})()

const UPPERCASED_LINKS = Object.keys(links).reduce(
  (all: Record<string, string>, l) => {
    all[l.toUpperCase()] = links[l as 'Zulu']
    return all
  },
  {}
)

const UPPERCASED_IDENTIFIERS = Object.keys(links).reduce(
  (all: Record<string, string>, alias) => {
    const target = links[alias as 'Zulu']
    all[alias.toUpperCase()] = alias
    all[target.toUpperCase()] = target
    return all
  },
  {}
)

const PRIMARY_TIME_ZONES: Readonly<Record<string, string | undefined>> = primary

const RESOLVED_OPTIONS_KEYS: Array<
  keyof Omit<IntlDateTimeFormatInternal, 'pattern' | 'boundFormat'>
> = [
  'locale',
  'calendar',
  'numberingSystem',
  'timeZone',
  'hourCycle',
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'dayPeriod',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
  'timeZoneName',
  'dateStyle',
  'timeStyle',
]

function getDateTimeImplementationDetails() {
  return {
    getInternalSlots,
    localeData: DateTimeFormat.localeData,
    tzData: DateTimeFormat.tzData,
    calendarData: DateTimeFormat.calendarData,
    getDefaultTimeZone,
  }
}

// ECMA-402 §11.5.13 unwraps legacy receivers for format and resolvedOptions.
// https://tc39.es/ecma402/#sec-unwrapdatetimeformat
function unwrapDateTimeFormat(dtf: IDateTimeFormat): IDateTimeFormat {
  if (!hasInternalSlots(dtf) && OrdinaryHasInstance(DateTimeFormat, dtf)) {
    return (dtf as unknown as Record<symbol, IDateTimeFormat>)[
      getIntlFallbackSymbol()
    ]
  }
  return dtf
}

const formatDescriptor = {
  enumerable: false,
  configurable: true,
  get(this: IDateTimeFormat) {
    const dtf = unwrapDateTimeFormat(this)
    const internalSlots = getInternalSlots(dtf)
    // ECMA-402 §11.3.3 steps 4–5 cache an anonymous, one-argument function.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
    if (internalSlots.boundFormat === undefined) {
      // Temporal amendment §15.6.3: convert the argument and format the prepared value.
      // https://tc39.es/proposal-temporal/#sec-datetime-format-functions
      internalSlots.boundFormat = (
        date?: Date | number | TemporalDateTimeInput
      ) => {
        let x: number | TemporalDateTimeValue
        if (date === undefined) {
          x = now()
        } else {
          x = ToDateTimeFormattable(date)
        }
        return FormatDateTime(
          dtf as Intl.DateTimeFormat,
          x,
          getDateTimeImplementationDetails()
        )
      }
    }
    return internalSlots.boundFormat
  },
} as const
try {
  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/name.js
  Object.defineProperty(formatDescriptor.get, 'name', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 'get format',
  })
} catch {
  // In older browser (e.g Chrome 36 like polyfill-fastly.io)
  // TypeError: Cannot redefine property: name
}

export interface DateTimeFormatConstructor {
  new (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): IDateTimeFormat
  (
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): IDateTimeFormat

  __formatTemporal(
    value: TemporalDateTimeValue & {timeZone?: string},
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): string
  __addTemporalNamespace(namespace: TemporalDateTimeNamespace): void
  __addLocaleData(...data: RawDateTimeLocaleData[]): void
  __addCalendarData(...data: CalendarData[]): void
  __addCalendarLocaleData(...data: RawCalendarLocaleData[]): void
  calendarData: CalendarRegistry
  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<Intl.DateTimeFormatOptions, 'localeMatcher'>
  ): string[]
  getDefaultLocale(): string
  relevantExtensionKeys: string[]
  __defaultLocale: string
  __defaultTimeZone: string | undefined
  __setDefaultTimeZone(tz?: string): void
  getDefaultTimeZone(): string
  localeData: Record<string, DateTimeFormatLocaleInternalData>
  availableLocales: Set<string>
  polyfilled: boolean
  tzData: Record<string, UnpackedTimeZoneData>
  __addTZData(d: PackedData): void
}

// ECMA-402 §11.1.1 creates a formatter for calls and construction.
// https://tc39.es/ecma402/#sec-intl.datetimeformat
export const DateTimeFormat: DateTimeFormatConstructor = new Proxy(
  function DateTimeFormat(
    this: IDateTimeFormat,
    locales: string | string[] | undefined = undefined,
    options?: Intl.DateTimeFormatOptions
  ) {
    initialize(this, locales, options)
  },
  {
    // The private proxy handler has no inherited traps.
    // https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver
    __proto__: null,
    apply(_target, receiver, args) {
      const formatter = new DateTimeFormat(args[0], args[1])
      // ECMA-402 §11.1.1.1 checks and wraps the receiver after initialization.
      // https://tc39.es/ecma402/#sec-chaindatetimeformat
      if (OrdinaryHasInstance(DateTimeFormat, receiver)) {
        const descriptor = {
          __proto__: null,
          value: formatter,
          writable: false,
          enumerable: false,
          configurable: false,
        }
        objectDefineProperty(receiver, getIntlFallbackSymbol(), descriptor)
        return receiver
      }
      return formatter
    },
    construct(target, args, newTarget) {
      // ECMA-402 §11.1.2 step 1 reads NewTarget.prototype before options.
      // https://tc39.es/ecma402/#sec-createdatetimeformat
      // ECMA-262 §10.1.14 step 4 uses the constructor's realm. Here the
      // intrinsic fallback is limited to the polyfill's own realm.
      // https://tc39.es/ecma262/#sec-getprototypefromconstructor
      const prototype = newTarget.prototype
      const formatter = createObject(
        IsObject(prototype) ? prototype : DateTimeFormat.prototype
      )
      reflectApply(target, formatter, args)
      return formatter
    },
  } as ProxyHandler<Function>
) as unknown as DateTimeFormatConstructor

function initialize(
  dtf: IDateTimeFormat,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions,
  context?: DateTimeFormatContext
): void {
  InitializeDateTimeFormat(
    dtf,
    locales,
    options,
    {
      tzData: DateTimeFormat.tzData,
      uppercaseLinks: UPPERCASED_LINKS,
      uppercaseIdentifiers: UPPERCASED_IDENTIFIERS,
      availableLocales: DateTimeFormat.availableLocales,
      relevantExtensionKeys: RELEVANT_EXTENSION_KEYS,
      getDefaultLocale,
      getDefaultTimeZone,
      getInternalSlots: dtf => getInternalSlots(dtf, true),
      localeData: DateTimeFormat.localeData,
    },
    context
  )
}

// ECMA-402 §20.4.1–3 steps 5–6 create a formatter with method-specific
// defaults and call FormatDateTime directly.
// https://tc39.es/ecma402/#sup-properties-of-the-date-prototype-object
export function formatDateWithDefaults(
  value: number,
  locales: string | string[] | undefined,
  options: Intl.DateTimeFormatOptions | undefined,
  context: DateTimeFormatContext
): string {
  const formatter = createObject(DateTimeFormat.prototype) as IDateTimeFormat
  initialize(formatter, locales, options, context)
  return FormatDateTime(formatter, value, getDateTimeImplementationDetails())
}

// ECMA-402 §7 applies ECMA-262 §18: methods are non-constructible built-ins.
// https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
// ECMA-402 §11.2.1 specifies a non-writable prototype property (no steps).
// https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype
Object.defineProperty(DateTimeFormat, 'prototype', {writable: false})

// ECMA-402 §11.3.1 links the prototype to the public constructor.
// https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.constructor
defineProperty(DateTimeFormat.prototype, 'constructor', {value: DateTimeFormat})

defineProperty(DateTimeFormat, '__formatTemporal', {
  value(
    value: TemporalDateTimeValue & {timeZone?: string},
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): string {
    // Temporal §15.11.8.1 step 3 creates the formatter before calendar checks.
    // https://tc39.es/proposal-temporal/#sup-temporal.zoneddatetime.prototype.tolocalestring
    const dtf = createObject(DateTimeFormat.prototype) as IDateTimeFormat
    const date =
      value.kind === 'PlainDate' ||
      value.kind === 'PlainYearMonth' ||
      value.kind === 'PlainMonthDay'
    initialize(dtf, locales, options, {
      required: date ? 'date' : value.kind === 'PlainTime' ? 'time' : 'any',
      defaults: date ? 'date' : value.kind === 'PlainTime' ? 'time' : 'all',
      timeZone: value.kind === 'ZonedDateTime' ? value.timeZone : undefined,
    })
    if (value.kind === 'ZonedDateTime') {
      // Temporal §15.11.8.1 steps 4–5 validate the calendar and use the instant.
      if (
        value.calendar !== 'iso8601' &&
        value.calendar !== getInternalSlots(dtf).calendar
      )
        throw new RangeErrorConstructor(
          'Temporal calendar does not match DateTimeFormat'
        )
      value = {kind: 'Instant', epochNanoseconds: value.epochNanoseconds}
    }
    return FormatDateTime(dtf, value, getDateTimeImplementationDetails())
  },
})

defineProperty(DateTimeFormat, '__addTemporalNamespace', {
  value: registerTemporalDateTimeNamespace,
})

// Static properties
const {supportedLocalesOf} = {
  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<Intl.DateTimeFormatOptions, 'localeMatcher'>
  ) {
    return SupportedLocales(
      DateTimeFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options as any
    )
  },
}

defineProperty(DateTimeFormat, 'supportedLocalesOf', {
  value: supportedLocalesOf,
})
// ECMA-402 §11.2.2 has one required parameter.
// https://tc39.es/ecma402/#sec-intl.datetimeformat.supportedlocalesof
Object.defineProperty(supportedLocalesOf, 'length', {
  value: 1,
  configurable: true,
})

const {resolvedOptions} = {
  resolvedOptions(this: IDateTimeFormat) {
    const internalSlots = getInternalSlots(unwrapDateTimeFormat(this))
    const ro: Record<string, unknown> = {}
    for (let index = 0; index < RESOLVED_OPTIONS_KEYS.length; index++) {
      const key = RESOLVED_OPTIONS_KEYS[index]
      let value = internalSlots[key]
      if (arrayIndexOf(DATE_TIME_PROPS, key as TABLE_6) > -1) {
        if (
          internalSlots.dateStyle !== undefined ||
          internalSlots.timeStyle !== undefined
        ) {
          value = undefined
        }
      }

      if (value !== undefined) {
        // ECMA-402 §11.3.2, step 5.d.ii: define own data properties.
        // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.resolvedoptions
        setDataProperty(ro, key, value)
        // ECMA-402 §11.3.2, step 5: create properties in table order.
        // hourCycle precedes hour12; style properties follow components.
        // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.resolvedoptions
        if (key === 'hourCycle') {
          const hour12 =
            value === 'h11' || value === 'h12'
              ? true
              : value === 'h23' || value === 'h24'
                ? false
                : undefined
          if (hour12 !== undefined) {
            setDataProperty(ro, 'hour12', hour12)
          }
        }
      }
    }
    return ro as any
  },
}

defineProperty(DateTimeFormat.prototype, 'resolvedOptions', {
  value: resolvedOptions,
})

// ECMA-402 §11.3.6 checks the receiver before defaulting or converting the date.
// https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatToParts
const {formatToParts} = {
  formatToParts(
    this: Intl.DateTimeFormat,
    date?: number | Date | TemporalDateTimeInput
  ) {
    getInternalSlots(this)
    let x: number | TemporalDateTimeValue
    if (date === undefined) {
      x = now()
    } else {
      x = ToDateTimeFormattable(date)
    }
    return FormatDateTimeToParts(this, x, getDateTimeImplementationDetails())
  },
}

defineProperty(DateTimeFormat.prototype, 'formatToParts', {
  value: formatToParts,
})

const candidateMillisecond = bigIntFrom(1_000_000)
const candidateSecond = candidateMillisecond * bigIntFrom(1_000)
const dayMilliseconds = 86_400_000
const localLimit =
  bigIntFrom(8_640_000_000_000_000 + dayMilliseconds) * candidateMillisecond
const instantLimit = bigIntFrom(8_640_000_000_000_000) * candidateMillisecond

function temporalLocalMilliseconds(local: bigint): number {
  let milliseconds = local / candidateMillisecond
  if (local < 0 && local % candidateMillisecond) milliseconds--
  return numberFrom(milliseconds)
}

function validTemporalOffset(offset: number): boolean {
  return numberIsInteger(offset) && offset > -86_400 && offset < 86_400
}

// Proposal comparison §8.5.1 step 1: accept both Instant limits.
function validTemporalInstant(instant: bigint): boolean {
  return instant >= -instantLimit && instant <= instantLimit
}

// Proposal comparison §11.1.13 step 3.a: collect actual candidates.
function temporalCandidates(
  local: bigint,
  zone: UnpackedTimeZoneData
): bigint[] {
  // At these bounds, whole milliseconds and sub-day offsets fit in Number.
  const localMilliseconds = temporalLocalMilliseconds(local)
  const candidates: bigint[] = []
  VisitTimeZoneOffsets(
    localMilliseconds - dayMilliseconds,
    localMilliseconds + dayMilliseconds,
    zone,
    offset => {
      if (!validTemporalOffset(offset)) return
      const instant = local - bigIntFrom(offset) * candidateSecond
      if (
        arrayIncludes(candidates, instant) ||
        TimeZoneOffset(localMilliseconds - offset * 1_000, zone)[0] !== offset
      )
        return
      setDataProperty(candidates, candidates.length, instant)
    }
  )
  return candidates
}

// Proposal comparison §11.1.13 step 4.a: reject any actual out-of-range candidate.
function checkedTemporalCandidates(
  local: bigint,
  zone: UnpackedTimeZoneData
): bigint[] {
  const candidates = temporalCandidates(local, zone)
  for (let index = 0; index < candidates.length; index++) {
    if (!validTemporalInstant(candidates[index]))
      throw new RangeErrorConstructor('Instant out of range')
  }
  return candidates
}

const gapWindowMilliseconds = 3 * dayMilliseconds
const gapDay = bigIntFrom(dayMilliseconds) * candidateMillisecond
const oneNanosecond = bigIntFrom(1)

// Proposal comparison §11.1.12 steps 6–14: recover the nearest reachable local boundaries.
function resolveTemporalGap(
  local: bigint,
  zone: UnpackedTimeZoneData,
  direction: 'earlier' | 'later'
): bigint | undefined {
  const milliseconds = temporalLocalMilliseconds(local)
  const earlier = direction === 'earlier'
  let before: bigint | undefined
  let after: bigint | undefined
  let fallback: bigint | undefined
  let validOffsets = true
  const covered = VisitTimeZoneBoundaries(
    milliseconds - gapWindowMilliseconds,
    milliseconds + gapWindowMilliseconds,
    zone,
    boundary => {
      const instant = bigIntFrom(boundary) * candidateMillisecond
      const oldOffset = TimeZoneOffset(boundary - 1, zone)[0]
      const newOffset = TimeZoneOffset(boundary, zone)[0]
      if (!validTemporalOffset(oldOffset) || !validTemporalOffset(newOffset)) {
        validOffsets = false
        return
      }
      const end =
        instant - oneNanosecond + bigIntFrom(oldOffset) * candidateSecond
      const start = instant + bigIntFrom(newOffset) * candidateSecond
      if (end < local && (before === undefined || end > before)) before = end
      if (start > local && (after === undefined || start < after)) after = start
      if (fallback === undefined && local > end && local < start)
        fallback =
          local - bigIntFrom(earlier ? newOffset : oldOffset) * candidateSecond
    }
  )
  if (!covered || !validOffsets || before === undefined || after === undefined)
    return undefined
  const beforeCandidates = temporalCandidates(before, zone)
  const afterCandidates = temporalCandidates(after, zone)
  // Only actual candidates determine whether both neighbors fit.
  if (
    beforeCandidates.length !== 1 ||
    afterCandidates.length !== 1 ||
    !validTemporalInstant(beforeCandidates[0]) ||
    !validTemporalInstant(afterCandidates[0])
  )
    return undefined
  const shift = after - afterCandidates[0] - (before - beforeCandidates[0])
  // Keep the existing fallback when the comparison's gap assumptions fail.
  if (!shift || shift < -gapDay || shift > gapDay) return undefined

  // Proposal comparison §11.1.12 steps 16.e–16.g and 22–25: requery and select the first or last instant.
  const shifted = checkedTemporalCandidates(
    local + (earlier ? -shift : shift),
    zone
  )
  // A shifted clock can still be missing when transitions overlap.
  // Reuse the containing transition, as the loaded Temporal kernels do.
  if (!shifted.length && fallback !== undefined) {
    if (!validTemporalInstant(fallback))
      throw new RangeErrorConstructor('Instant out of range')
    return fallback
  }
  let instant = shifted[0]
  for (let index = 1; index < shifted.length; index++) {
    const candidate = shifted[index]
    if (earlier ? candidate < instant : candidate > instant) instant = candidate
  }
  return instant
}

// ECMA-262 §21.4.1.20–21: Read the same named-zone rows as the formatter.
function temporalTimeZoneData(
  formatter: Intl.DateTimeFormat
): UnpackedTimeZoneData | undefined {
  const {dataTimeZone, timeZone} = getInternalSlots(formatter)
  return DateTimeFormat.tzData[dataTimeZone ?? timeZone]
}

Object.defineProperty(
  formatToParts,
  Symbol.for('@formatjs/intl-datetimeformat/checkTemporalCandidates'),
  {
    value(
      this: Intl.DateTimeFormat,
      local: bigint,
      direction?: 'earlier' | 'later'
    ): bigint[] | bigint | undefined {
      const zone = temporalTimeZoneData(this)
      if (!zone?.length || local <= -localLimit || local >= localLimit)
        return undefined
      return direction
        ? resolveTemporalGap(local, zone, direction)
        : checkedTemporalCandidates(local, zone)
    },
  }
)

Object.defineProperty(
  formatToParts,
  Symbol.for('@formatjs/intl-datetimeformat/queryTemporalTimeZone'),
  {
    value(
      this: Intl.DateTimeFormat,
      instant: bigint,
      direction?: 'next' | 'previous'
    ): bigint | null | undefined {
      const zone = temporalTimeZoneData(this)
      if (!zone?.length || !validTemporalInstant(instant)) return undefined
      if (direction) return TimeZoneTransition(instant, direction, zone)
      // Proposal comparison §11.1.9 step 3: read the same rows at millisecond precision.
      const [offset] = TimeZoneOffset(temporalLocalMilliseconds(instant), zone)
      return validTemporalOffset(offset)
        ? bigIntFrom(offset) * candidateSecond
        : undefined
    },
  }
)

let timeZoneDataGeneration = {}

Object.defineProperty(
  formatToParts,
  Symbol.for('@formatjs/intl-datetimeformat/nearestTemporalLocalAfter'),
  {
    value(this: Intl.DateTimeFormat, local: bigint): bigint | undefined {
      const zone = temporalTimeZoneData(this)
      if (!zone?.length || local <= -localLimit || local >= localLimit)
        return undefined
      return NearestTimeZoneLocalAfter(local, zone)
    },
  }
)

Object.defineProperty(
  formatToParts,
  Symbol.for('@formatjs/intl-datetimeformat/timeZoneDataGeneration'),
  {value: () => timeZoneDataGeneration}
)

// ECMA-402 §11.3.5 checks both endpoints before coercion.
// https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatRangeToParts
const {formatRangeToParts} = {
  formatRangeToParts(
    this: Intl.DateTimeFormat,
    startDate: number | Date | TemporalDateTimeInput,
    endDate: number | Date | TemporalDateTimeInput
  ) {
    // oxlint-disable-next-line no-this-alias
    const dtf = this
    // Temporal §15.7.3 steps 2–3 validate before converting endpoints.
    // https://tc39.es/proposal-temporal/#sec-Intl.DateTimeFormat.prototype.formatRangeToParts
    getInternalSlots(dtf)
    if (startDate === undefined || endDate === undefined)
      throw new TypeErrorConstructor('startDate/endDate cannot be undefined')

    // Steps 4–6 convert left to right, then format the range parts.
    const x = ToDateTimeFormattable(startDate)
    const y = ToDateTimeFormattable(endDate)
    return FormatDateTimeRangeToParts(
      dtf,
      x,
      y,
      getDateTimeImplementationDetails()
    )
  },
}

defineProperty(DateTimeFormat.prototype, 'formatRangeToParts', {
  value: formatRangeToParts,
})

// ECMA-402 §11.3.4 checks both endpoints before coercion.
// https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.formatRange
const {formatRange} = {
  formatRange(
    this: Intl.DateTimeFormat,
    startDate: number | Date | TemporalDateTimeInput,
    endDate: number | Date | TemporalDateTimeInput
  ) {
    // oxlint-disable-next-line no-this-alias
    const dtf = this
    // Temporal §15.7.2 steps 2–3 validate before converting endpoints.
    // https://tc39.es/proposal-temporal/#sec-intl.datetimeformat.prototype.formatRange
    getInternalSlots(dtf)
    if (startDate === undefined || endDate === undefined)
      throw new TypeErrorConstructor('startDate/endDate cannot be undefined')
    // Steps 4–6 convert left to right, then format the range.
    const x = ToDateTimeFormattable(startDate)
    const y = ToDateTimeFormattable(endDate)
    return FormatDateTimeRange(dtf, x, y, getDateTimeImplementationDetails())
  },
}

defineProperty(DateTimeFormat.prototype, 'formatRange', {value: formatRange})

const DEFAULT_TIMEZONE = 'UTC'

DateTimeFormat.__setDefaultTimeZone = (timeZone?: string) => {
  if (timeZone !== undefined) {
    timeZone = String(timeZone)
    if (
      !IsValidTimeZoneName(timeZone, {
        zoneNamesFromData: Object.keys(DateTimeFormat.tzData),
        uppercaseLinks: UPPERCASED_LINKS,
      })
    ) {
      throw new RangeError('Invalid timeZoneName')
    }
    const dataTimeZone = CanonicalizeTimeZoneName(timeZone, {
      zoneNames: Object.keys(DateTimeFormat.tzData),
      uppercaseLinks: UPPERCASED_LINKS,
    })
    const identifier = reflectApply(timeZoneUpperCase, timeZone, [])
    timeZone = HasOwnProperty(UPPERCASED_IDENTIFIERS, identifier)
      ? UPPERCASED_IDENTIFIERS[identifier]
      : dataTimeZone
  }
  DateTimeFormat.__defaultTimeZone = timeZone
}
// ECMA-402 §11.2.3 keeps the locale extension keys in a private list.
// https://tc39.es/ecma402/#sec-intl.datetimeformat-internal-slots
const RELEVANT_EXTENSION_KEYS = ['ca', 'hc', 'nu']
DateTimeFormat.relevantExtensionKeys = [...RELEVANT_EXTENSION_KEYS]

DateTimeFormat.__defaultTimeZone = undefined
DateTimeFormat.getDefaultTimeZone = getDefaultTimeZone

function getDefaultTimeZone(): string {
  const override = getOwnPropertyDescriptor(DateTimeFormat, '__defaultTimeZone')
  // Recheck the override against the current pack before using it.
  if (
    override &&
    HasOwnProperty(override, 'value') &&
    typeof override.value === 'string' &&
    (override.value === DEFAULT_TIMEZONE ||
      HasOwnProperty(DateTimeFormat.tzData, override.value) ||
      IsValidTimeZoneName(override.value, {
        zoneNamesFromData: objectKeys(DateTimeFormat.tzData),
        uppercaseLinks: UPPERCASED_LINKS,
      }))
  ) {
    return override.value
  }

  // ECMA-402 §11.1.2 step 18 uses the host's default zone.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  // ECMA-262 §21.4.1.24 uses a primary identifier or fixed offset.
  // https://tc39.es/ecma262/#sec-systemtimezoneidentifier
  if (hostTimeZoneProvider) {
    const {Constructor, resolvedOptions} = hostTimeZoneProvider
    try {
      const resolved = reflectApply(resolvedOptions, new Constructor(), [])
      // ECMA-402 §11.3.2 step 5 creates an own data property for the zone.
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.resolvedoptions
      const field = getOwnPropertyDescriptor(resolved, 'timeZone')
      const hostName = field && getOwnPropertyDescriptor(field, 'value')?.value
      if (typeof hostName === 'string') {
        // ECMA-402 §§6.1 and 6.5.2 step 1.a match IANA names with ASCII case folding.
        // https://tc39.es/ecma402/#sec-getavailablenamedtimezoneidentifier
        for (let index = 0; index < hostName.length; index++) {
          if (reflectApply(timeZoneCharCodeAt, hostName, [index]) > 0x7f)
            return DEFAULT_TIMEZONE
        }
        const upper = reflectApply(timeZoneUpperCase, hostName, [])
        const identifier = HasOwnProperty(UPPERCASED_IDENTIFIERS, upper)
          ? UPPERCASED_IDENTIFIERS[upper]
          : undefined
        const name = identifier ?? hostName
        const primary = HasOwnProperty(PRIMARY_TIME_ZONES, name)
          ? (PRIMARY_TIME_ZONES[name] ?? name)
          : name
        if (
          primary === DEFAULT_TIMEZONE ||
          HasOwnProperty(DateTimeFormat.tzData, primary)
        )
          return primary
        const zoneNames = objectKeys(DateTimeFormat.tzData)
        // A partial pack can retain the host alias after omitting its primary zone.
        const candidates = primary === name ? [name] : [primary, name]
        for (let index = 0; index < candidates.length; index++) {
          const timeZone = candidates[index]
          if (
            !IsValidTimeZoneName(timeZone, {
              zoneNamesFromData: zoneNames,
              uppercaseLinks: UPPERCASED_LINKS,
            })
          )
            continue
          const dataZone = CanonicalizeTimeZoneName(timeZone, {
            zoneNames,
            uppercaseLinks: UPPERCASED_LINKS,
          })
          if (dataZone !== undefined) {
            if (
              dataZone === DEFAULT_TIMEZONE ||
              dataZone[0] === '+' ||
              dataZone[0] === '-'
            )
              return dataZone
            if (HasOwnProperty(DateTimeFormat.tzData, dataZone))
              return identifier ? timeZone : dataZone
          }
        }
      }
    } catch {
      // A partial host implementation may not expose a default zone.
    }
  }
  return DEFAULT_TIMEZONE
}

/**
 * GH #4535: When a format skeleton uses raw pattern form (e.g., "MMMEd, h:mm a")
 * instead of canonical form (e.g., "MMMEd, hm"), interval formats won't match
 * by exact key. This function finds the matching canonical interval format by
 * normalizing the time portion of the skeleton.
 */
type IntervalCandidate = {key: string; format: Formats}
const intervalCandidates = new WeakMap<
  object,
  Map<number, IntervalCandidate[]>
>()
const getIntervalCandidates = intervalCandidates.get.bind(intervalCandidates)
const setIntervalCandidates = intervalCandidates.set.bind(intervalCandidates)
const deleteIntervalCandidates =
  intervalCandidates.delete.bind(intervalCandidates)
const IntervalMap = Map
const intervalMapGet = Map.prototype.get
const intervalMapSet = Map.prototype.set
const intervalIndexOf = String.prototype.indexOf
const intervalSlice = String.prototype.slice

function intervalSignature(format: Formats): number {
  let fields = 0
  for (let index = 0; index < DATE_TIME_PROPS.length; index++) {
    if (format[DATE_TIME_PROPS[index]] !== undefined) fields |= 1 << index
  }
  return (
    fields |
    (format.hour12 ? 1 << DATE_TIME_PROPS.length : 0) |
    (format.month === 'numeric' || format.month === '2-digit'
      ? 1 << (DATE_TIME_PROPS.length + 1)
      : 0)
  )
}

function findIntervalFormat(
  skeleton: string,
  intervalFormats: Record<string, any>,
  rawPattern = skeleton
): Record<string, string> | undefined {
  const commaIdx = reflectApply(intervalIndexOf, skeleton, [', '])
  if (commaIdx !== -1) {
    const datePart = reflectApply(intervalSlice, skeleton, [0, commaIdx])
    const timePart = reflectApply(intervalSlice, skeleton, [commaIdx + 2])
    let canonical = ''
    for (let index = 0; index < timePart.length; index++) {
      const c = timePart[index]
      if (
        ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) &&
        c !== 'a' &&
        c !== 'b' &&
        canonical[canonical.length - 1] !== c
      )
        canonical += c
    }
    const matched = intervalFormats[`${datePart}, ${canonical}`]
    if (matched) return matched
  }
  // CLDR date styles can use a wider month name than the interval skeleton.
  // Match the same fields; formatting retains the requested field widths.
  const target = parseDateTimeSkeleton(rawPattern)
  let best: Record<string, string> | undefined
  let bestScore = Infinity
  let candidates = getIntervalCandidates(intervalFormats)
  if (!candidates) {
    candidates = new IntervalMap()
    const keys = objectKeys(intervalFormats)
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index]
      const ranges = intervalFormats[key]
      if (typeof ranges !== 'object') continue
      const fields = objectKeys(ranges)
      if (!fields.length) continue
      const format = parseDateTimeSkeleton(
        key,
        getRangePatternInfo(ranges[fields[0]]).pattern
      )
      const signature = intervalSignature(format)
      let group: IntervalCandidate[] | undefined = reflectApply(
        intervalMapGet,
        candidates,
        [signature]
      )
      if (!group) {
        group = []
        reflectApply(intervalMapSet, candidates, [signature, group])
      }
      setDataProperty(group, group.length, {key, format})
    }
    setIntervalCandidates(intervalFormats, candidates)
  }
  const group: IntervalCandidate[] | undefined = reflectApply(
    intervalMapGet,
    candidates,
    [intervalSignature(target)]
  )
  if (!group) return undefined
  for (let index = 0; index < group.length; index++) {
    const {key, format: candidate} = group[index]
    if (!!target.hour12 !== !!candidate.hour12) continue
    const numericMonth = (month: unknown) =>
      month === 'numeric' || month === '2-digit'
    if (numericMonth(target.month) !== numericMonth(candidate.month)) continue
    if (
      target.weekdayStandalone === true &&
      candidate.weekdayStandalone === false
    )
      continue
    if (
      arrayEvery(
        DATE_TIME_PROPS,
        field =>
          (target[field] !== undefined) === (candidate[field] !== undefined)
      )
    ) {
      let score = 0
      for (let index = 0; index < DATE_TIME_PROPS.length; index++) {
        const field = DATE_TIME_PROPS[index]
        if (field !== 'timeZoneName' && target[field] !== candidate[field]) {
          score += field === 'month' ? 2 : 1
        }
      }
      if (score < bestScore) {
        best = intervalFormats[key]
        bestScore = score
      }
    }
  }
  return best
}

function parseDateTimeStyles(
  styles: Pick<
    RawDateTimeLocaleData['data'],
    | 'dateFormat'
    | 'timeFormat'
    | 'dateTimeFormat'
    | 'dateTimeFormatAtTime'
    | 'intervalFormats'
  >
) {
  const {dateFormat, timeFormat, dateTimeFormat, intervalFormats} = styles
  // ECMA-402 §11.2.3.7 uses a private connector record.
  // https://tc39.es/ecma402/#sec-datetimeformat-connector-record
  const dateTimeFormatAtTime = HasOwnProperty(styles, 'dateTimeFormatAtTime')
    ? styles.dateTimeFormatAtTime
    : undefined
  const parseStyle = (pattern: string) => {
    const format = parseDateTimeSkeleton(
      pattern,
      pattern,
      findIntervalFormat(pattern, intervalFormats),
      intervalFormats.intervalFormatFallback
    )
    // ECMA-402 §11.2.3.6 and §11.5.1 steps 2.b and 3.b use private style records.
    // https://tc39.es/ecma402/#sec-datetimeformat-style-record
    // https://tc39.es/ecma402/#sec-date-time-style-format
    const defaults = [
      format.rangePatterns.default,
      format.rangePatterns12.default,
    ]
    for (let rangeIndex = 0; rangeIndex < defaults.length; rangeIndex++) {
      const range = defaults[rangeIndex]
      if (!range) continue
      for (
        let fieldIndex = 0;
        fieldIndex < DATE_TIME_PROPS.length;
        fieldIndex++
      ) {
        const field = DATE_TIME_PROPS[fieldIndex]
        const value = format[field]
        if (value !== undefined) setDataProperty(range, field, value)
      }
    }
    return format
  }
  return {
    dateFormat: {
      full: parseStyle(dateFormat.full),
      long: parseStyle(dateFormat.long),
      medium: parseStyle(dateFormat.medium),
      short: parseStyle(dateFormat.short),
    },
    timeFormat: {
      full: parseStyle(timeFormat.full),
      long: parseStyle(timeFormat.long),
      medium: parseStyle(timeFormat.medium),
      short: parseStyle(timeFormat.short),
    },
    dateTimeFormat: {
      full: parseDateTimeSkeleton(dateTimeFormat.full).pattern,
      long: parseDateTimeSkeleton(dateTimeFormat.long).pattern,
      medium: parseDateTimeSkeleton(dateTimeFormat.medium).pattern,
      short: parseDateTimeSkeleton(dateTimeFormat.short).pattern,
    },
    ...(dateTimeFormatAtTime
      ? {
          dateTimeFormatAtTime: {
            full: parseDateTimeSkeleton(dateTimeFormatAtTime.full).pattern,
            long: parseDateTimeSkeleton(dateTimeFormatAtTime.long).pattern,
            medium: parseDateTimeSkeleton(dateTimeFormatAtTime.medium).pattern,
            short: parseDateTimeSkeleton(dateTimeFormatAtTime.short).pattern,
          },
        }
      : {}),
  }
}

// Calendar arithmetic and locale patterns may arrive in either order. Retain
// raw records so adding a calendar does not discard previously loaded calendars.
const rawLocaleData = new Map<string, RawDateTimeLocaleData>()
const calendarLocaleData = new Map<string, Map<string, RawCalendarLocaleData>>()
const processedLocales = new Map<string, DateTimeFormatLocaleInternalData>()
const forEachProcessedLocale = processedLocales.forEach.bind(processedLocales)

// ECMA-402 §6.9.1 includes calendars supported across all loaded locales.
// https://tc39.es/ecma402/#sec-availablecalendars
Object.defineProperty(
  DateTimeFormat,
  Symbol.for('@formatjs/intl-datetimeformat/availableCalendars'),
  {
    value(): string[] {
      const calendars: string[] = []
      forEachProcessedLocale(data => {
        for (let index = 0; index < data.ca.length; index++) {
          const calendar = data.ca[index]
          if (arrayIndexOf(calendars, calendar) < 0)
            setDataProperty(calendars, calendars.length, calendar)
        }
      })
      return calendars
    },
  }
)
const calendarPreferences = new WeakMap<
  DateTimeFormatLocaleInternalData,
  string[]
>()
const getCalendarPreferences = calendarPreferences.get.bind(calendarPreferences)
const setCalendarPreferences = calendarPreferences.set.bind(calendarPreferences)

function updateAvailableCalendars(data: DateTimeFormatLocaleInternalData) {
  // ResolveLocale must only select calendars with both arithmetic and patterns.
  // Preserve CLDR preference order; Gregorian remains available without add-ons.
  // https://tc39.es/ecma402/#sec-resolvelocale
  data.ca = getCalendarPreferences(data)!.filter(
    calendar =>
      HasOwnProperty(data.formats, calendar) &&
      (calendar === 'gregory' ||
        calendar === 'iso8601' ||
        HasOwnProperty(DateTimeFormat.calendarData, calendar))
  )
}

function prepareLocaleData(
  entry: RawDateTimeLocaleData,
  patches: ReadonlyMap<string, RawCalendarLocaleData> | undefined
): DateTimeFormatLocaleInternalData {
  // ECMA-402 §11.2.3.8–9 reads private date and time range records.
  // https://tc39.es/ecma402/#sec-datetimeformat-date-range-record
  // https://tc39.es/ecma402/#sec-datetimeformat-time-range-record
  const rawCalendars = HasOwnProperty(entry.data, 'calendarData')
    ? entry.data.calendarData
    : undefined
  deleteIntervalCandidates(entry.data.intervalFormats)
  if (rawCalendars) {
    for (const calendar of objectKeys(rawCalendars))
      deleteIntervalCandidates(rawCalendars[calendar].intervalFormats)
  }
  const d = {
    __proto__: null,
    ...entry.data,
    ca: [...entry.data.ca],
    // ECMA-402 §11.2.3 uses private calendar-indexed records.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat-internal-slots
    formats: {
      __proto__: null,
      ...entry.data.formats,
    } as unknown as RawDateTimeLocaleData['data']['formats'],
    calendarData: {
      __proto__: null,
      ...rawCalendars,
    } as unknown as NonNullable<RawDateTimeLocaleData['data']['calendarData']>,
  }
  for (const patch of patches?.values() ?? []) {
    if (arrayIndexOf(d.ca, patch.calendar) < 0) d.ca.push(patch.calendar)
    d.formats[patch.calendar] = patch.formats
    d.calendarData[patch.calendar] = patch.data
  }
  d.intervalFormats = expandIntervalFormatTemplates(
    d.intervalFormats,
    d.intervalFormatTemplates
  )
  delete d.intervalFormatTemplates
  for (const calendar of Object.keys(d.calendarData)) {
    const fields = {__proto__: null, ...d.calendarData[calendar]}
    fields.intervalFormats = expandIntervalFormatTemplates(
      fields.intervalFormats,
      fields.intervalFormatTemplates
    )
    delete fields.intervalFormatTemplates
    d.calendarData[calendar] = fields
  }
  const {
    dateFormat,
    timeFormat,
    dateTimeFormat,
    dateTimeFormatAtTime,
    formats,
    intervalFormats,
    calendarData,
    ...rawData
  } = d
  const processedData: DateTimeFormatLocaleInternalData = {
    ...rawData,
    ...parseDateTimeStyles({
      dateFormat,
      timeFormat,
      dateTimeFormat,
      dateTimeFormatAtTime,
      intervalFormats,
    }),
    intervalFormatFallback: intervalFormats.intervalFormatFallback,
    formats: {},
  }

  for (const calendar in formats) {
    const calendarIntervals =
      calendarData?.[calendar]?.intervalFormats ?? intervalFormats
    let parsed: DateTimeFormatLocaleInternalData['formats'][string] | undefined
    Object.defineProperty(processedData.formats, calendar, {
      enumerable: true,
      get() {
        if (parsed) return parsed
        // ECMA-402 §11.1.2 step 32.g reads the resolved calendar's private formats.
        // https://tc39.es/ecma402/#sec-createdatetimeformat
        const calendarFormats = formats[calendar]
        const skeletons = objectKeys(calendarFormats)
        const prepared: Formats[] = []
        for (let index = 0; index < skeletons.length; index++) {
          const skeleton = skeletons[index]
          const pattern = calendarFormats[skeleton]
          const format = parseDateTimeSkeleton(
            skeleton,
            pattern,
            findIntervalFormat(skeleton, calendarIntervals, pattern),
            calendarIntervals.intervalFormatFallback,
            true
          )
          setDataProperty(prepared, prepared.length, format)
        }
        parsed = prepared
        return parsed
      },
    })
  }

  // Legacy locale packs may omit separate ISO 8601 patterns.
  if (!formats.iso8601)
    Object.defineProperty(processedData.formats, 'iso8601', {
      enumerable: true,
      get: () => processedData.formats.gregory,
    })
  // ECMA-402 §6.9.1 requires ISO 8601, including with legacy locale packs.
  // https://tc39.es/ecma402/#sec-availablecalendars
  if (arrayIndexOf(d.ca, 'iso8601') < 0) d.ca.push('iso8601')

  if (calendarData) {
    const processedCalendars = {}
    setDataProperty(processedData, 'calendarData', processedCalendars)
    for (const calendar of Object.keys(calendarData)) {
      const fields = calendarData[calendar]
      const {intervalFormats: calendarIntervals, ...calendarFields} = fields
      let parsed: DateTimeFormatLocaleInternalData | undefined
      Object.defineProperty(processedCalendars, calendar, {
        enumerable: true,
        get() {
          return (parsed ??= {
            ...processedData,
            ...calendarFields,
            // ECMA-402 §11.2.3 keeps names in the selected calendar's record.
            // https://tc39.es/ecma402/#sec-intl.datetimeformat-internal-slots
            monthStandalone: fields.monthStandalone,
            yearNames: fields.yearNames,
            leapMonthPatterns: fields.leapMonthPatterns,
            // Keep parsed formats even if a caller supplies a wider locale record.
            formats: processedData.formats,
            ...parseDateTimeStyles({
              ...calendarFields,
              intervalFormats: calendarIntervals,
            }),
            intervalFormatFallback: calendarIntervals.intervalFormatFallback,
            calendarData: undefined,
          })
        },
      })
    }
  }

  setCalendarPreferences(processedData, [...d.ca])
  updateAvailableCalendars(processedData)
  return processedData
}

// Publish only prepared records. Failed registrations leave the last valid
// data available for ECMA-402 §11.1.2 steps 8–13.
// https://tc39.es/ecma402/#sec-createdatetimeformat
function publishLocaleData(
  locale: string,
  data: DateTimeFormatLocaleInternalData
): void {
  registerLocaleData(
    locale,
    data,
    DateTimeFormat.localeData,
    DateTimeFormat.availableLocales
  )
  processedLocales.set(locale, data)
  if (!defaultLocale) {
    defaultLocale = locale
  }
}

DateTimeFormat.__addLocaleData = function __addLocaleData(
  ...data: RawDateTimeLocaleData[]
) {
  for (const entry of data) {
    const [locale] = CanonicalizeLocaleList(entry.locale)
    publishLocaleData(
      locale,
      prepareLocaleData(entry, calendarLocaleData.get(locale))
    )
    rawLocaleData.set(locale, entry)
  }
}

Object.defineProperty(DateTimeFormat.prototype, 'format', formatDescriptor)

let defaultLocale = ''
// Keep the FormatJS registration hook backed by private state.
objectDefineProperty(DateTimeFormat, '__defaultLocale', {
  configurable: true,
  enumerable: true,
  get: getDefaultLocale,
  set(locale: string) {
    defaultLocale = locale
  },
})
DateTimeFormat.localeData = {}
DateTimeFormat.availableLocales = new Set()
// ECMA-402 §6.2.3 supplies the default for ResolveLocale step 3.
// https://tc39.es/ecma402/#sec-defaultlocale
function getDefaultLocale(): string {
  return defaultLocale
}
DateTimeFormat.getDefaultLocale = getDefaultLocale
DateTimeFormat.polyfilled = true
DateTimeFormat.calendarData = Object.create(null)
// Registration is a FormatJS extension. Custom providers supply their own
// ToLocalTime calendar arithmetic; loading one never changes existing selections.
DateTimeFormat.__addCalendarData = function (...data: CalendarData[]) {
  for (const {calendar, dateFromTime} of data) {
    createDataProperty(DateTimeFormat.calendarData, calendar, dateFromTime)
  }
  for (const locale of new Set(
    Object.keys(DateTimeFormat.localeData).map(
      locale => DateTimeFormat.localeData[locale]
    )
  )) {
    updateAvailableCalendars(locale)
  }
}
DateTimeFormat.__addCalendarLocaleData = function (
  ...data: RawCalendarLocaleData[]
) {
  for (const patch of data) {
    const [locale] = CanonicalizeLocaleList(patch.locale)
    const calendars = new Map(calendarLocaleData.get(locale))
    calendars.set(patch.calendar, patch)
    const raw = rawLocaleData.get(locale)
    if (raw) publishLocaleData(locale, prepareLocaleData(raw, calendars))
    calendarLocaleData.set(locale, calendars)
  }
}
// ECMA-402 §6.5.1 includes IANA fixed zones. They need no transition pack.
// https://tc39.es/ecma402/#sup-availablenamedtimezoneidentifiers
// https://data.iana.org/time-zones/tzdb/etcetera
function addFixedTimeZones(
  zones: Record<string, UnpackedTimeZoneData>
): Record<string, UnpackedTimeZoneData> {
  for (let hour = -12; hour <= 14; hour++) {
    if (hour === 0) continue
    // IANA's Etc/GMT names use the POSIX sign convention.
    const id = hour < 0 ? `Etc/GMT+${-hour}` : `Etc/GMT-${hour}`
    const abbreviation = hour < 0 ? `GMT${hour}` : `GMT+${hour}`
    if (!HasOwnProperty(zones, id)) {
      setDataProperty(zones, id, [
        [-Infinity, abbreviation, hour * 3600, false],
      ])
    }
  }
  return zones
}

DateTimeFormat.tzData = addFixedTimeZones({})
// ECMA-402 §6.5.2 resolves zone identifiers independently of locale data.
// https://tc39.es/ecma402/#sec-getavailablenamedtimezoneidentifier
objectDefineProperty(
  DateTimeFormat,
  Symbol.for('@formatjs/intl-datetimeformat/hasTimeZone'),
  {
    __proto__: null,
    value(timeZone: string): boolean {
      return IsValidTimeZoneName(timeZone, {
        zoneNamesFromData: objectKeys(DateTimeFormat.tzData),
        uppercaseLinks: UPPERCASED_LINKS,
      })
    },
  } as PropertyDescriptor
)
DateTimeFormat.__addTZData = function (d: PackedData) {
  DateTimeFormat.tzData = addFixedTimeZones(unpack(d))
  timeZoneDataGeneration = {}
}

try {
  if (typeof Symbol !== 'undefined') {
    // ECMA-402 §11.3.7.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype-%symbol.tostringtag%
    Object.defineProperty(DateTimeFormat.prototype, Symbol.toStringTag, {
      value: 'Intl.DateTimeFormat',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }
} catch {
  // Meta fix so we're test262-compliant, not important
}
