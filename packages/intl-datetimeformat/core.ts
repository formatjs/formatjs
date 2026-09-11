import {registerLocaleData} from '#packages/ecma402-abstract/registerLocaleData.js'
import {OrdinaryHasInstance} from '#packages/ecma262-abstract/OrdinaryHasInstance.js'
import {
  ToDateTimeFormattable,
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
  type TABLE_6,
  type TemporalDateTimeInput,
  type UnpackedZoneData,
} from '#packages/ecma402-abstract/types/date-time.js'
import {
  defineProperty,
  createDataProperty,
  invariant,
} from '#packages/ecma402-abstract/utils.js'
import Decimal from '@formatjs/bigdecimal'
import {FormatDateTime} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTime.js'
import {FormatDateTimeRange} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimeRange.js'
import {FormatDateTimeRangeToParts} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimeRangeToParts.js'
import {FormatDateTimeToParts} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimeToParts.js'
import {InitializeDateTimeFormat} from '#packages/ecma402-abstract/DateTimeFormat/InitializeDateTimeFormat.js'
import {parseDateTimeSkeleton} from '#packages/ecma402-abstract/DateTimeFormat/skeleton.js'
import {DATE_TIME_PROPS} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'
import links from '@formatjs_generated/tz/links.js'
import getInternalSlots from '#packages/intl-datetimeformat/get_internal_slots.js'
import {unpack} from '#packages/intl-datetimeformat/unpack.js'
import {
  type PackedData,
  type RawDateTimeLocaleData,
} from '#packages/intl-datetimeformat/types.js'

const UPPERCASED_LINKS = Object.keys(links).reduce(
  (all: Record<string, string>, l) => {
    all[l.toUpperCase()] = links[l as 'Zulu']
    return all
  },
  {}
)

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
    getDefaultTimeZone: DateTimeFormat.getDefaultTimeZone,
  }
}

const formatDescriptor = {
  enumerable: false,
  configurable: true,
  get(this: IDateTimeFormat) {
    const internalSlots = getInternalSlots(this)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dtf = this
    let boundFormat = internalSlots.boundFormat
    if (boundFormat === undefined) {
      // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_diff_out.html#sec-number-format-functions
      boundFormat = (date?: Date | number | TemporalDateTimeInput) => {
        let x: Decimal | TemporalDateTimeValue
        if (date === undefined) {
          x = new Decimal(Date.now())
        } else {
          x = ToDateTimeFormattable(date)
        }
        return FormatDateTime(
          dtf as Intl.DateTimeFormat,
          x,
          getDateTimeImplementationDetails()
        )
      }
      try {
        // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/format-function-name.js
        Object.defineProperty(boundFormat, 'name', {
          configurable: true,
          enumerable: false,
          writable: false,
          value: '',
        })
      } catch {
        // In older browser (e.g Chrome 36 like polyfill-fastly.io)
        // TypeError: Cannot redefine property: name
      }
      internalSlots.boundFormat = boundFormat
    }
    return boundFormat
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

  __addLocaleData(...data: RawDateTimeLocaleData[]): void
  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<Intl.DateTimeFormatOptions, 'localeMatcher'>
  ): string[]
  getDefaultLocale(): string
  relevantExtensionKeys: string[]
  __defaultLocale: string
  __defaultTimeZone: string
  __setDefaultTimeZone(tz: string): void
  getDefaultTimeZone(): string
  localeData: Record<string, DateTimeFormatLocaleInternalData>
  availableLocales: Set<string>
  polyfilled: boolean
  tzData: Record<string, UnpackedZoneData[]>
  __addTZData(d: PackedData): void
}

export const DateTimeFormat = function (
  this: IDateTimeFormat,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions
) {
  // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
  if (!this || !OrdinaryHasInstance(DateTimeFormat, this)) {
    return new DateTimeFormat(locales, options)
  }

  InitializeDateTimeFormat(this, locales, options, {
    tzData: DateTimeFormat.tzData,
    uppercaseLinks: UPPERCASED_LINKS,
    availableLocales: DateTimeFormat.availableLocales,
    relevantExtensionKeys: DateTimeFormat.relevantExtensionKeys,
    getDefaultLocale: DateTimeFormat.getDefaultLocale,
    getDefaultTimeZone: DateTimeFormat.getDefaultTimeZone,
    getInternalSlots: dtf => getInternalSlots(dtf, true),
    localeData: DateTimeFormat.localeData,
  })

  /** IMPL START */
  const internalSlots = getInternalSlots(this)

  const dataLocale = internalSlots.dataLocale
  const dataLocaleData = DateTimeFormat.localeData[dataLocale]
  invariant(
    dataLocaleData !== undefined,
    `Cannot load locale-dependent data for ${dataLocale}.`
  )
  /** IMPL END */
} as DateTimeFormatConstructor

// ECMA-402 §7 applies ECMA-262 §18: methods are non-constructible built-ins.
// https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
// https://github.com/tc39/ecma262/blob/b7865f0eed2021720f84d561289401bc414874d0/spec.html#L30375-L30385
// ECMA-402 §11.2.1 specifies a non-writable prototype property (no steps).
// https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L193-L194
Object.defineProperty(DateTimeFormat, 'prototype', {writable: false})

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
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L198
Object.defineProperty(supportedLocalesOf, 'length', {
  value: 1,
  configurable: true,
})

const {resolvedOptions} = {
  resolvedOptions(this: IDateTimeFormat) {
    const internalSlots = getInternalSlots(this)
    const ro: Record<string, unknown> = {}
    for (const key of RESOLVED_OPTIONS_KEYS) {
      let value = internalSlots[key]
      if (DATE_TIME_PROPS.indexOf(key as TABLE_6) > -1) {
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
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L905
        createDataProperty(ro, key, value)
        // ECMA-402 §11.3.2, step 5: create properties in table order.
        // hourCycle precedes hour12; style properties follow components.
        // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.resolvedoptions
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L887-L905
        if (key === 'hourCycle') {
          const hour12 =
            value === 'h11' || value === 'h12'
              ? true
              : value === 'h23' || value === 'h24'
                ? false
                : undefined
          if (hour12 !== undefined) {
            createDataProperty(ro, 'hour12', hour12)
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

const {formatToParts} = {
  formatToParts(
    this: Intl.DateTimeFormat,
    date?: number | Date | TemporalDateTimeInput
  ) {
    getInternalSlots(this)
    let x: Decimal | TemporalDateTimeValue
    if (date === undefined) {
      x = new Decimal(Date.now())
    } else {
      x = ToDateTimeFormattable(date)
    }
    return FormatDateTimeToParts(this, x, getDateTimeImplementationDetails())
  },
}

defineProperty(DateTimeFormat.prototype, 'formatToParts', {
  value: formatToParts,
})

const {formatRangeToParts} = {
  formatRangeToParts(
    this: Intl.DateTimeFormat,
    startDate: number | Date | TemporalDateTimeInput,
    endDate: number | Date | TemporalDateTimeInput
  ) {
    // oxlint-disable-next-line no-this-alias
    const dtf = this
    // ECMA-402 §11.3.5, step 2: validate before reading arguments.
    // https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatRangeToParts
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L1072-L1077
    getInternalSlots(dtf)
    invariant(
      startDate !== undefined && endDate !== undefined,
      'startDate/endDate cannot be undefined',
      TypeError
    )

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

const {formatRange} = {
  formatRange(
    this: Intl.DateTimeFormat,
    startDate: number | Date | TemporalDateTimeInput,
    endDate: number | Date | TemporalDateTimeInput
  ) {
    // oxlint-disable-next-line no-this-alias
    const dtf = this
    // ECMA-402 §11.3.4, step 2: validate before reading arguments.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.formatRange
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L1057-L1062
    getInternalSlots(dtf)
    invariant(
      startDate !== undefined && endDate !== undefined,
      'startDate/endDate cannot be undefined',
      TypeError
    )
    const x = ToDateTimeFormattable(startDate)
    const y = ToDateTimeFormattable(endDate)
    return FormatDateTimeRange(dtf, x, y, getDateTimeImplementationDetails())
  },
}

defineProperty(DateTimeFormat.prototype, 'formatRange', {value: formatRange})

const DEFAULT_TIMEZONE = 'UTC'

DateTimeFormat.__setDefaultTimeZone = (timeZone: string) => {
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
    timeZone = CanonicalizeTimeZoneName(timeZone, {
      zoneNames: Object.keys(DateTimeFormat.tzData),
      uppercaseLinks: UPPERCASED_LINKS,
    })
  } else {
    timeZone = DEFAULT_TIMEZONE
  }
  DateTimeFormat.__defaultTimeZone = timeZone
}
DateTimeFormat.relevantExtensionKeys = ['nu', 'ca', 'hc']

DateTimeFormat.__defaultTimeZone = DEFAULT_TIMEZONE
DateTimeFormat.getDefaultTimeZone = () => DateTimeFormat.__defaultTimeZone

/**
 * GH #4535: When a format skeleton uses raw pattern form (e.g., "MMMEd, h:mm a")
 * instead of canonical form (e.g., "MMMEd, hm"), interval formats won't match
 * by exact key. This function finds the matching canonical interval format by
 * normalizing the time portion of the skeleton.
 */
function findIntervalFormat(
  skeleton: string,
  intervalFormats: Record<string, any>
): Record<string, string> | undefined {
  const commaIdx = skeleton.indexOf(', ')
  if (commaIdx !== -1) {
    const datePart = skeleton.slice(0, commaIdx)
    const timePart = skeleton.slice(commaIdx + 2)
    const canonical = timePart
      .replace(/[^a-zA-Z]/g, '')
      .replace(/[abB]/g, '')
      .replace(/(.)\1+/g, '$1')
    const matched = intervalFormats[`${datePart}, ${canonical}`]
    if (matched) return matched
  }
  // CLDR date styles can use a wider month name than the interval skeleton.
  // Match the same fields; formatting retains the requested field widths.
  const target = parseDateTimeSkeleton(skeleton)
  if (
    target.hour ||
    target.minute ||
    target.second ||
    target.dayPeriod ||
    target.timeZoneName
  )
    return undefined
  for (const key of Object.keys(intervalFormats)) {
    if (typeof intervalFormats[key] !== 'object') continue
    const candidate = parseDateTimeSkeleton(key)
    const numericMonth = (month: unknown) =>
      month === 'numeric' || month === '2-digit'
    if (numericMonth(target.month) !== numericMonth(candidate.month)) continue
    if (
      DATE_TIME_PROPS.every(
        field =>
          (target[field] !== undefined) === (candidate[field] !== undefined)
      )
    ) {
      return intervalFormats[key]
    }
  }
  return undefined
}

function parseDateTimeStyles({
  dateFormat,
  timeFormat,
  dateTimeFormat,
  intervalFormats,
}: Pick<
  RawDateTimeLocaleData['data'],
  'dateFormat' | 'timeFormat' | 'dateTimeFormat' | 'intervalFormats'
>) {
  const parseStyle = (pattern: string) =>
    parseDateTimeSkeleton(
      pattern,
      pattern,
      findIntervalFormat(pattern, intervalFormats),
      intervalFormats.intervalFormatFallback
    )
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
  }
}

DateTimeFormat.__addLocaleData = function __addLocaleData(
  ...data: RawDateTimeLocaleData[]
) {
  for (const {data: d, locale} of data) {
    const {
      dateFormat,
      timeFormat,
      dateTimeFormat,
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
        intervalFormats,
      }),
      intervalFormatFallback: intervalFormats.intervalFormatFallback,
      formats: {},
    }

    for (const calendar in formats) {
      const calendarIntervals =
        calendarData?.[calendar]?.intervalFormats ?? intervalFormats
      let parsed:
        | DateTimeFormatLocaleInternalData['formats'][string]
        | undefined
      Object.defineProperty(processedData.formats, calendar, {
        enumerable: true,
        get() {
          return (parsed ??= Object.keys(formats[calendar]).map(skeleton =>
            parseDateTimeSkeleton(
              skeleton,
              formats[calendar][skeleton],
              calendarIntervals[skeleton] ||
                findIntervalFormat(skeleton, calendarIntervals),
              calendarIntervals.intervalFormatFallback
            )
          ))
        },
      })
    }

    // ISO 8601 uses Gregorian year/month/day fields; week-date fields are
    // not exposed by DateTimeFormat. Reuse patterns without duplicating data.
    // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/common/bcp47/calendar.xml#L27
    processedData.formats.iso8601 = processedData.formats.gregory

    if (calendarData) {
      processedData.calendarData = {}
      for (const calendar of Object.keys(calendarData)) {
        const fields = calendarData[calendar]
        const {intervalFormats: calendarIntervals, ...calendarFields} = fields
        let parsed: DateTimeFormatLocaleInternalData | undefined
        Object.defineProperty(processedData.calendarData, calendar, {
          enumerable: true,
          get() {
            return (parsed ??= {
              ...processedData,
              ...calendarFields,
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

    registerLocaleData(
      locale,
      processedData,
      DateTimeFormat.localeData,
      DateTimeFormat.availableLocales
    )
    if (!DateTimeFormat.__defaultLocale) {
      DateTimeFormat.__defaultLocale = locale
    }
  }
}

Object.defineProperty(DateTimeFormat.prototype, 'format', formatDescriptor)

DateTimeFormat.__defaultLocale = ''
DateTimeFormat.localeData = {}
DateTimeFormat.availableLocales = new Set()
DateTimeFormat.getDefaultLocale = () => {
  return DateTimeFormat.__defaultLocale
}
DateTimeFormat.polyfilled = true
DateTimeFormat.tzData = {}
DateTimeFormat.__addTZData = function (d: PackedData) {
  DateTimeFormat.tzData = unpack(d)
}

try {
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(DateTimeFormat.prototype, Symbol.toStringTag, {
      value: 'Intl.DateTimeFormat',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  // ECMA-402 §11.1.1 has no required parameters.
  // https://tc39.es/ecma402/#sec-intl.datetimeformat
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L16
  Object.defineProperty(DateTimeFormat.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch {
  // Meta fix so we're test262-compliant, not important
}
