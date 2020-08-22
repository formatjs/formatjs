import {
  IntlConfig,
  IntlCache,
  CustomFormats,
  Formatters,
  OnErrorFn,
} from './types';
import {IntlMessageFormat} from 'intl-messageformat';
import * as memoize from 'fast-memoize';
import {Cache} from 'fast-memoize';
import {IntlRelativeTimeFormatOptions} from '@formatjs/intl-relativetimeformat';
import {UnsupportedFormatterError} from './error';

export function filterProps<T extends Record<string, any>, K extends string>(
  props: T,
  whitelist: Array<K>,
  defaults: Partial<T> = {}
): Pick<T, K> {
  return whitelist.reduce((filtered, name) => {
    if (name in props) {
      filtered[name] = props[name];
    } else if (name in defaults) {
      filtered[name] = defaults[name]!;
    }

    return filtered;
  }, {} as Pick<T, K>);
}

const defaultErrorHandler: OnErrorFn = error => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }
};

export const DEFAULT_INTL_CONFIG: Pick<
  IntlConfig<any>,
  | 'formats'
  | 'messages'
  | 'timeZone'
  | 'defaultLocale'
  | 'defaultFormats'
  | 'onError'
> = {
  formats: {},
  messages: {},
  timeZone: undefined,

  defaultLocale: 'en',
  defaultFormats: {},

  onError: defaultErrorHandler,
};

export function createIntlCache(): IntlCache {
  return {
    dateTime: {},
    number: {},
    message: {},
    relativeTime: {},
    pluralRules: {},
    list: {},
    displayNames: {},
  };
}

function createFastMemoizeCache<V>(store: Record<string, V>): Cache<string, V> {
  return {
    create() {
      return {
        has(key) {
          return key in store;
        },
        get(key) {
          return store[key];
        },
        set(key, value) {
          store[key] = value;
        },
      };
    },
  };
}

// @ts-ignore this is to deal with rollup's default import shenanigans
const _memoizeIntl = memoize.default || memoize;
const memoizeIntl = _memoizeIntl as typeof memoize.default;

/**
 * Create intl formatters and populate cache
 * @param cache explicit cache to prevent leaking memory
 */
export function createFormatters(
  cache: IntlCache = createIntlCache()
): Formatters {
  const RelativeTimeFormat = (Intl as any).RelativeTimeFormat;
  const ListFormat = (Intl as any).ListFormat;
  const DisplayNames = (Intl as any).DisplayNames;
  const getDateTimeFormat = memoizeIntl(
    (...args) => new Intl.DateTimeFormat(...args),
    {
      cache: createFastMemoizeCache(cache.dateTime),
      strategy: memoizeIntl.strategies.variadic,
    }
  );
  const getNumberFormat = memoizeIntl(
    (...args) => new Intl.NumberFormat(...args),
    {
      cache: createFastMemoizeCache(cache.number),
      strategy: memoizeIntl.strategies.variadic,
    }
  );
  const getPluralRules = memoizeIntl(
    (...args) => new Intl.PluralRules(...args),
    {
      cache: createFastMemoizeCache(cache.pluralRules),
      strategy: memoizeIntl.strategies.variadic,
    }
  );
  return {
    getDateTimeFormat,
    getNumberFormat,
    getMessageFormat: memoizeIntl(
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
        strategy: memoizeIntl.strategies.variadic,
      }
    ),
    getRelativeTimeFormat: memoizeIntl(
      (...args) => new RelativeTimeFormat(...args),
      {
        cache: createFastMemoizeCache(cache.relativeTime),
        strategy: memoizeIntl.strategies.variadic,
      }
    ),
    getPluralRules,
    getListFormat: memoizeIntl((...args) => new ListFormat(...args), {
      cache: createFastMemoizeCache(cache.list),
      strategy: memoizeIntl.strategies.variadic,
    }),
    getDisplayNames: memoizeIntl((...args) => new DisplayNames(...args), {
      cache: createFastMemoizeCache(cache.displayNames),
      strategy: memoizeIntl.strategies.variadic,
    }),
  };
}

export function getNamedFormat<T extends keyof CustomFormats>(
  formats: CustomFormats,
  type: T,
  name: string,
  onError: OnErrorFn
):
  | Intl.NumberFormatOptions
  | Intl.DateTimeFormatOptions
  | IntlRelativeTimeFormatOptions
  | undefined {
  const formatType = formats && formats[type];
  let format;
  if (formatType) {
    format = formatType[name];
  }
  if (format) {
    return format;
  }

  onError(new UnsupportedFormatterError(`No ${type} format named: ${name}`));
}
