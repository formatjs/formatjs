import {
  invariant,
  defineProperty,
  SupportedLocales,
  IsValidTimeZoneName,
  CanonicalizeTimeZoneName,
  TABLE_6,
  DateTimeFormat as IDateTimeFormat,
  CanonicalizeLocaleList,
  DateTimeFormatLocaleInternalData,
  UnpackedZoneData,
  ToNumber,
  IntlDateTimeFormatInternal,
  OrdinaryHasInstance,
} from '@formatjs/ecma402-abstract'
import getInternalSlots from './get_internal_slots'
import links from './data/links'
import {PackedData, RawDateTimeLocaleData} from './types'
import {unpack} from './packer'
import {FormatDateTime} from './abstract/FormatDateTime'
import {InitializeDateTimeFormat} from './abstract/InitializeDateTimeFormat'
import {DATE_TIME_PROPS} from './abstract/utils'
import {FormatDateTimeToParts} from './abstract/FormatDateTimeToParts'
import {FormatDateTimeRangeToParts} from './abstract/FormatDateTimeRangeToParts'
import {FormatDateTimeRange} from './abstract/FormatDateTimeRange'
import {parseDateTimeSkeleton} from './abstract/skeleton'

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
  'dateStyle',
  'timeStyle',
  'timeZone',
  'hourCycle',
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'timeZoneName',
]

const formatDescriptor = {
  enumerable: false,
  configurable: true,
  get(this: IDateTimeFormat) {
    if (
      typeof this !== 'object' ||
      !OrdinaryHasInstance(DateTimeFormat, this)
    ) {
      throw TypeError(
        'Intl.DateTimeFormat format property accessor called on incompatible receiver'
      )
    }
    const internalSlots = getInternalSlots(this)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dtf = this
    let boundFormat = internalSlots.boundFormat
    if (boundFormat === undefined) {
      // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_diff_out.html#sec-number-format-functions
      boundFormat = (date?: Date | number) => {
        let x: number
        if (date === undefined) {
          x = Date.now()
        } else {
          x = Number(date)
        }
        return FormatDateTime(dtf, x, {
          getInternalSlots,
          localeData: DateTimeFormat.localeData,
          tzData: DateTimeFormat.tzData,
          getDefaultTimeZone: DateTimeFormat.getDefaultTimeZone,
        })
      }
      try {
        // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/format-function-name.js
        Object.defineProperty(boundFormat, 'name', {
          configurable: true,
          enumerable: false,
          writable: false,
          value: '',
        })
      } catch (e) {
        // In older browser (e.g Chrome 36 like polyfill.io)
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
} catch (e) {
  // In older browser (e.g Chrome 36 like polyfill.io)
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
    getInternalSlots,
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

// Static properties
defineProperty(DateTimeFormat, 'supportedLocalesOf', {
  value: function supportedLocalesOf(
    locales: string | string[],
    options?: Pick<Intl.DateTimeFormatOptions, 'localeMatcher'>
  ) {
    return SupportedLocales(
      DateTimeFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options as any
    )
  },
})

defineProperty(DateTimeFormat.prototype, 'resolvedOptions', {
  value: function resolvedOptions(this: IDateTimeFormat) {
    if (
      typeof this !== 'object' ||
      !OrdinaryHasInstance(DateTimeFormat, this)
    ) {
      throw TypeError(
        'Method Intl.DateTimeFormat.prototype.resolvedOptions called on incompatible receiver'
      )
    }
    const internalSlots = getInternalSlots(this)
    const ro: Record<string, unknown> = {}
    for (const key of RESOLVED_OPTIONS_KEYS) {
      let value = internalSlots[key]
      if (key === 'hourCycle') {
        const hour12 =
          value === 'h11' || value === 'h12'
            ? true
            : value === 'h23' || value === 'h24'
            ? false
            : undefined
        if (hour12 !== undefined) {
          ro.hour12 = hour12
        }
      }
      if (DATE_TIME_PROPS.indexOf(key as TABLE_6) > -1) {
        if (
          internalSlots.dateStyle !== undefined ||
          internalSlots.timeStyle !== undefined
        ) {
          value = undefined
        }
      }

      if (value !== undefined) {
        ro[key] = value
      }
    }
    return ro as any
  },
})

defineProperty(DateTimeFormat.prototype, 'formatToParts', {
  value: function formatToParts(date?: number | Date) {
    if (date === undefined) {
      date = Date.now()
    } else {
      date = ToNumber(date)
    }
    return FormatDateTimeToParts(this, date, {
      getInternalSlots,
      localeData: DateTimeFormat.localeData,
      tzData: DateTimeFormat.tzData,
      getDefaultTimeZone: DateTimeFormat.getDefaultTimeZone,
    })
  },
})

defineProperty(DateTimeFormat.prototype, 'formatRangeToParts', {
  value: function formatRangeToParts(
    startDate: number | Date,
    endDate: number | Date
  ) {
    const dtf = this
    if (typeof dtf !== 'object') {
      throw new TypeError()
    }
    if (startDate === undefined || endDate === undefined) {
      throw new TypeError('startDate/endDate cannot be undefined')
    }
    const x = ToNumber(startDate)
    const y = ToNumber(endDate)
    return FormatDateTimeRangeToParts(dtf, x, y, {
      getInternalSlots,
      localeData: DateTimeFormat.localeData,
      tzData: DateTimeFormat.tzData,
      getDefaultTimeZone: DateTimeFormat.getDefaultTimeZone,
    })
  },
})

defineProperty(DateTimeFormat.prototype, 'formatRange', {
  value: function formatRange(
    startDate: number | Date,
    endDate: number | Date
  ) {
    const dtf = this
    if (typeof dtf !== 'object') {
      throw new TypeError()
    }
    if (startDate === undefined || endDate === undefined) {
      throw new TypeError('startDate/endDate cannot be undefined')
    }
    const x = ToNumber(startDate)
    const y = ToNumber(endDate)
    return FormatDateTimeRange(dtf, x, y, {
      getInternalSlots,
      localeData: DateTimeFormat.localeData,
      tzData: DateTimeFormat.tzData,
      getDefaultTimeZone: DateTimeFormat.getDefaultTimeZone,
    })
  },
})

const DEFAULT_TIMEZONE = 'UTC'

DateTimeFormat.__setDefaultTimeZone = (timeZone: string) => {
  if (timeZone !== undefined) {
    timeZone = String(timeZone)
    if (
      !IsValidTimeZoneName(timeZone, {
        tzData: DateTimeFormat.tzData,
        uppercaseLinks: UPPERCASED_LINKS,
      })
    ) {
      throw new RangeError('Invalid timeZoneName')
    }
    timeZone = CanonicalizeTimeZoneName(timeZone, {
      tzData: DateTimeFormat.tzData,
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
      ...rawData
    } = d
    const processedData: DateTimeFormatLocaleInternalData = {
      ...rawData,
      dateFormat: {
        full: parseDateTimeSkeleton(dateFormat.full),
        long: parseDateTimeSkeleton(dateFormat.long),
        medium: parseDateTimeSkeleton(dateFormat.medium),
        short: parseDateTimeSkeleton(dateFormat.short),
      },
      timeFormat: {
        full: parseDateTimeSkeleton(timeFormat.full),
        long: parseDateTimeSkeleton(timeFormat.long),
        medium: parseDateTimeSkeleton(timeFormat.medium),
        short: parseDateTimeSkeleton(timeFormat.short),
      },
      dateTimeFormat: {
        full: parseDateTimeSkeleton(dateTimeFormat.full).pattern,
        long: parseDateTimeSkeleton(dateTimeFormat.long).pattern,
        medium: parseDateTimeSkeleton(dateTimeFormat.medium).pattern,
        short: parseDateTimeSkeleton(dateTimeFormat.short).pattern,
      },
      formats: {},
    }

    for (const calendar in formats) {
      processedData.formats[calendar] = Object.keys(formats[calendar]).map(
        skeleton =>
          parseDateTimeSkeleton(
            skeleton,
            formats[calendar][skeleton],
            intervalFormats[skeleton],
            intervalFormats.intervalFormatFallback
          )
      )
    }

    const minimizedLocale = new (Intl as any).Locale(locale)
      .minimize()
      .toString()
    DateTimeFormat.localeData[locale] = DateTimeFormat.localeData[
      minimizedLocale
    ] = processedData
    DateTimeFormat.availableLocales.add(locale)
    DateTimeFormat.availableLocales.add(minimizedLocale)
    if (!DateTimeFormat.__defaultLocale) {
      DateTimeFormat.__defaultLocale = minimizedLocale
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

  Object.defineProperty(DateTimeFormat.prototype.constructor, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}
