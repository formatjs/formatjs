import {Cache, memoize, strategies} from '@formatjs/fast-memoize'
import {IntlMessageFormat} from 'intl-messageformat'
import {UnsupportedFormatterError} from './error'
import {
  CustomFormats,
  Formatters,
  IntlCache,
  OnErrorFn,
  OnWarnFn,
  ResolvedIntlConfig,
} from './types'

export function invariant(
  condition: boolean,
  message: string,
  Err: any = Error
): asserts condition {
  if (!condition) {
    throw new Err(message)
  }
}

export function filterProps<T extends Record<string, any>, K extends string>(
  props: T,
  allowlist: Array<K>,
  defaults: Partial<T> = {}
): Pick<T, K> {
  return allowlist.reduce(
    (filtered, name) => {
      if (name in props) {
        filtered[name] = props[name]
      } else if (name in defaults) {
        filtered[name] = defaults[name]!
      }

      return filtered
    },
    {} as Pick<T, K>
  )
}

const defaultErrorHandler: OnErrorFn = error => {
  // @ts-ignore just so we don't need to declare dep on @types/node
  if (process.env.NODE_ENV !== 'production') {
    console.error(error)
  }
}

const defaultWarnHandler: OnWarnFn = (warning: string) => {
  // @ts-ignore just so we don't need to declare dep on @types/node
  if (process.env.NODE_ENV !== 'production') {
    console.warn(warning)
  }
}

export const DEFAULT_INTL_CONFIG: Pick<
  ResolvedIntlConfig<any>,
  | 'fallbackOnEmptyString'
  | 'formats'
  | 'messages'
  | 'timeZone'
  | 'defaultLocale'
  | 'defaultFormats'
  | 'onError'
  | 'onWarn'
> = {
  formats: {},
  messages: {},
  timeZone: undefined,

  defaultLocale: 'en',
  defaultFormats: {},

  fallbackOnEmptyString: true,

  onError: defaultErrorHandler,
  onWarn: defaultWarnHandler,
}

export function createIntlCache(): IntlCache {
  return {
    dateTime: {},
    number: {},
    message: {},
    relativeTime: {},
    pluralRules: {},
    list: {},
    displayNames: {},
  }
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

/**
 * Create intl formatters and populate cache
 * @param cache explicit cache to prevent leaking memory
 */
export function createFormatters(
  cache: IntlCache = createIntlCache()
): Formatters {
  const RelativeTimeFormat = (Intl as any).RelativeTimeFormat
  const ListFormat = (Intl as any).ListFormat
  const DisplayNames = (Intl as any).DisplayNames
  const getDateTimeFormat = memoize(
    (...args) => new Intl.DateTimeFormat(...args),
    {
      cache: createFastMemoizeCache(cache.dateTime),
      strategy: strategies.variadic,
    }
  )
  const getNumberFormat = memoize((...args) => new Intl.NumberFormat(...args), {
    cache: createFastMemoizeCache(cache.number),
    strategy: strategies.variadic,
  })
  const getPluralRules = memoize((...args) => new Intl.PluralRules(...args), {
    cache: createFastMemoizeCache(cache.pluralRules),
    strategy: strategies.variadic,
  })
  return {
    getDateTimeFormat,
    getNumberFormat,
    getMessageFormat: memoize(
      (message, locales, overrideFormats, opts) =>
        new IntlMessageFormat(message, locales, overrideFormats, {
          formatters: {
            getNumberFormat,
            getDateTimeFormat,
            getPluralRules,
          },
          ...(opts || {}),
        }),
      {
        cache: createFastMemoizeCache(cache.message),
        strategy: strategies.variadic,
      }
    ),
    getRelativeTimeFormat: memoize(
      (...args) => new RelativeTimeFormat(...args),
      {
        cache: createFastMemoizeCache(cache.relativeTime),
        strategy: strategies.variadic,
      }
    ),
    getPluralRules,
    getListFormat: memoize((...args) => new ListFormat(...args), {
      cache: createFastMemoizeCache(cache.list),
      strategy: strategies.variadic,
    }),
    getDisplayNames: memoize((...args) => new DisplayNames(...args), {
      cache: createFastMemoizeCache(cache.displayNames),
      strategy: strategies.variadic,
    }),
  }
}

export function getNamedFormat<T extends keyof CustomFormats>(
  formats: CustomFormats,
  type: T,
  name: string,
  onError: OnErrorFn
):
  | Intl.NumberFormatOptions
  | Intl.DateTimeFormatOptions
  | Intl.RelativeTimeFormatOptions
  | undefined {
  const formatType = formats && formats[type]
  let format
  if (formatType) {
    format = formatType[name]
  }
  if (format) {
    return format
  }

  onError(new UnsupportedFormatterError(`No ${type} format named: ${name}`))
}
