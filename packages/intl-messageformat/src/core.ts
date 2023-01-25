/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

import {
  parse,
  MessageFormatElement,
  ParserOptions,
} from '@formatjs/icu-messageformat-parser'
import memoize, {Cache, strategies} from '@formatjs/fast-memoize'
import {
  FormatterCache,
  Formatters,
  Formats,
  formatToParts,
  FormatXMLElementFn,
  PrimitiveType,
  MessageFormatPart,
  PART_TYPE,
} from './formatters'

// -- MessageFormat --------------------------------------------------------

function mergeConfig(c1: Record<string, object>, c2?: Record<string, object>) {
  if (!c2) {
    return c1
  }
  return {
    ...(c1 || {}),
    ...(c2 || {}),
    ...Object.keys(c1).reduce((all: Record<string, object>, k) => {
      all[k] = {
        ...c1[k],
        ...(c2[k] || {}),
      }
      return all
    }, {}),
  }
}

function mergeConfigs(
  defaultConfig: Formats,
  configs?: Partial<Formats>
): Formats {
  if (!configs) {
    return defaultConfig
  }

  return (Object.keys(defaultConfig) as Array<keyof Formats>).reduce(
    (all: Formats, k: keyof Formats) => {
      all[k] = mergeConfig(defaultConfig[k], configs[k])
      return all
    },
    {...defaultConfig}
  )
}

export interface Options extends Omit<ParserOptions, 'locale'> {
  formatters?: Formatters
}

function createFastMemoizeCache<V>(
  store: Record<string, V | undefined>
): Cache<string, V> {
  return {
    create() {
      return {
        get(key) {
          return store[key]
        },
        set(key, value) {
          store[key] = value
        },
      }
    },
  }
}

function createDefaultFormatters(
  cache: FormatterCache = {
    number: {},
    dateTime: {},
    pluralRules: {},
  }
): Formatters {
  return {
    getNumberFormat: memoize((...args) => new Intl.NumberFormat(...args), {
      cache: createFastMemoizeCache(cache.number),
      strategy: strategies.variadic,
    }),
    getDateTimeFormat: memoize((...args) => new Intl.DateTimeFormat(...args), {
      cache: createFastMemoizeCache(cache.dateTime),
      strategy: strategies.variadic,
    }),
    getPluralRules: memoize((...args) => new Intl.PluralRules(...args), {
      cache: createFastMemoizeCache(cache.pluralRules),
      strategy: strategies.variadic,
    }),
  }
}

export class IntlMessageFormat {
  private readonly ast: MessageFormatElement[]
  private readonly locales: string | string[]
  private readonly resolvedLocale?: Intl.Locale
  private readonly formatters: Formatters
  private readonly formats: Formats
  private readonly message: string | undefined
  private readonly formatterCache: FormatterCache = {
    number: {},
    dateTime: {},
    pluralRules: {},
  }
  constructor(
    message: string | MessageFormatElement[],
    locales: string | string[] = IntlMessageFormat.defaultLocale,
    overrideFormats?: Partial<Formats>,
    opts?: Options
  ) {
    // Defined first because it's used to build the format pattern.
    this.locales = locales
    this.resolvedLocale = IntlMessageFormat.resolveLocale(locales)

    if (typeof message === 'string') {
      this.message = message
      if (!IntlMessageFormat.__parse) {
        throw new TypeError(
          'IntlMessageFormat.__parse must be set to process `message` of type `string`'
        )
      }
      const {formatters, ...parseOpts} = opts || {}
      // Parse string messages into an AST.
      this.ast = IntlMessageFormat.__parse(message, {
        ...parseOpts,
        locale: this.resolvedLocale,
      })
    } else {
      this.ast = message
    }

    if (!Array.isArray(this.ast)) {
      throw new TypeError('A message must be provided as a String or AST.')
    }

    // Creates a new object with the specified `formats` merged with the default
    // formats.
    this.formats = mergeConfigs(IntlMessageFormat.formats, overrideFormats)

    this.formatters =
      (opts && opts.formatters) || createDefaultFormatters(this.formatterCache)
  }

  format = <T = void>(
    values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T>>
  ) => {
    const parts = this.formatToParts(values)
    // Hot path for straight simple msg translations
    if (parts.length === 1) {
      return parts[0].value
    }
    const result = parts.reduce((all, part) => {
      if (
        !all.length ||
        part.type !== PART_TYPE.literal ||
        typeof all[all.length - 1] !== 'string'
      ) {
        all.push(part.value)
      } else {
        all[all.length - 1] += part.value
      }
      return all
    }, [] as Array<string | T>)

    if (result.length <= 1) {
      return result[0] || ''
    }
    return result
  }
  formatToParts = <T>(
    values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T>>
  ): MessageFormatPart<T>[] =>
    formatToParts(
      this.ast,
      this.locales,
      this.formatters,
      this.formats,
      values,
      undefined,
      this.message
    )
  resolvedOptions = () => ({
    locale:
      this.resolvedLocale?.toString() ||
      Intl.NumberFormat.supportedLocalesOf(this.locales)[0],
  })
  getAst = () => this.ast
  private static memoizedDefaultLocale: string | null = null

  static get defaultLocale() {
    if (!IntlMessageFormat.memoizedDefaultLocale) {
      IntlMessageFormat.memoizedDefaultLocale =
        new Intl.NumberFormat().resolvedOptions().locale
    }

    return IntlMessageFormat.memoizedDefaultLocale
  }
  static resolveLocale = (
    locales: string | string[]
  ): Intl.Locale | undefined => {
    if (typeof Intl.Locale === 'undefined') {
      return
    }
    const supportedLocales = Intl.NumberFormat.supportedLocalesOf(locales)
    if (supportedLocales.length > 0) {
      return new Intl.Locale(supportedLocales[0])
    }

    return new Intl.Locale(typeof locales === 'string' ? locales : locales[0])
  }
  static __parse: typeof parse | undefined = parse
  // Default format options used as the prototype of the `formats` provided to the
  // constructor. These are used when constructing the internal Intl.NumberFormat
  // and Intl.DateTimeFormat instances.
  static formats: Formats = {
    number: {
      integer: {
        maximumFractionDigits: 0,
      },
      currency: {
        style: 'currency',
      },

      percent: {
        style: 'percent',
      },
    },

    date: {
      short: {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
      },

      medium: {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },

      long: {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },

      full: {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    },

    time: {
      short: {
        hour: 'numeric',
        minute: 'numeric',
      },

      medium: {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      },

      long: {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      },

      full: {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      },
    },
  }
}
