import {
  invariant,
  defineProperty,
  SupportedLocales,
  unpackData,
  InitializeDateTimeFormat,
  IsValidTimeZoneName,
  CanonicalizeTimeZoneName,
  DateTimeFormatOptions,
  TABLE_6,
  DateTimeFormat as IDateTimeFormat,
  DATE_TIME_PROPS,
  FormatDateTime,
  FormatDateTimeToParts,
  CanonicalizeLocaleList,
  DateTimeFormatLocaleInternalData,
  UnpackedZoneData,
  parseDateTimeSkeleton,
  ToNumber,
} from '@formatjs/ecma402-abstract';
import getInternalSlots from './get_internal_slots';
import links from './data/links';
import {PackedData, RawDateTimeLocaleData} from './types';
import {unpack} from './packer';

const UPPERCASED_LINKS = Object.keys(links).reduce(
  (all: Record<string, string>, l) => {
    all[l.toUpperCase()] = links[l as 'Zulu'];
    return all;
  },
  {}
);

export interface IntlDateTimeFormatInternal {
  locale: string;
  dataLocale: string;
  calendar?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  weekday: 'narrow' | 'short' | 'long';
  era: 'narrow' | 'short' | 'long';
  year: '2-digit' | 'numeric';
  month: '2-digit' | 'numeric' | 'narrow' | 'short' | 'long';
  day: '2-digit' | 'numeric';
  hour: '2-digit' | 'numeric';
  minute: '2-digit' | 'numeric';
  second: '2-digit' | 'numeric';
  timeZoneName: 'short' | 'long';
  hourCycle: string;
  numberingSystem: string;
  timeZone: string;
  pattern: string;
  boundFormat?: Intl.DateTimeFormat['format'];
}

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
];

const formatDescriptor = {
  enumerable: false,
  configurable: true,
  get(this: IDateTimeFormat) {
    if (typeof this !== 'object' || !(this instanceof DateTimeFormat)) {
      throw TypeError(
        'Intl.DateTimeFormat format property accessor called on incompatible receiver'
      );
    }
    const internalSlots = getInternalSlots(this);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const dtf = this;
    let boundFormat = internalSlots.boundFormat;
    if (boundFormat === undefined) {
      // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_diff_out.html#sec-number-format-functions
      boundFormat = (date?: Date | number) => {
        let x: number;
        if (date === undefined) {
          x = Date.now();
        } else {
          x = Number(date);
        }
        return FormatDateTime(dtf, x, {
          getInternalSlots,
          localeData: DateTimeFormat.localeData,
          tzData: DateTimeFormat.tzData,
          getDefaultTimeZone: DateTimeFormat.getDefaultTimeZone,
        });
      };
      try {
        // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/format-function-name.js
        Object.defineProperty(boundFormat, 'name', {
          configurable: true,
          enumerable: false,
          writable: false,
          value: '',
        });
      } catch (e) {
        // In older browser (e.g Chrome 36 like polyfill.io)
        // TypeError: Cannot redefine property: name
      }
      internalSlots.boundFormat = boundFormat;
    }
    return boundFormat;
  },
} as const;
try {
  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/name.js
  Object.defineProperty(formatDescriptor.get, 'name', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 'get format',
  });
} catch (e) {
  // In older browser (e.g Chrome 36 like polyfill.io)
  // TypeError: Cannot redefine property: name
}

export interface DateTimeFormatConstructor {
  new (
    locales?: string | string[],
    options?: DateTimeFormatOptions
  ): Intl.DateTimeFormat;
  (
    locales?: string | string[],
    options?: DateTimeFormatOptions
  ): Intl.DateTimeFormat;

  __addLocaleData(...data: RawDateTimeLocaleData[]): void;
  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<DateTimeFormatOptions, 'localeMatcher'>
  ): string[];
  getDefaultLocale(): string;
  relevantExtensionKeys: string[];
  __defaultLocale: string;
  __defaultTimeZone: string;
  __setDefaultTimeZone(tz: string): void;
  getDefaultTimeZone(): string;
  localeData: Record<string, DateTimeFormatLocaleInternalData>;
  availableLocales: string[];
  polyfilled: boolean;
  tzData: Record<string, UnpackedZoneData[]>;
  __addTZData(d: PackedData): void;
}

export const DateTimeFormat = function (
  this: IDateTimeFormat,
  locales?: string | string[],
  options?: DateTimeFormatOptions
) {
  // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
  if (!this || !(this instanceof DateTimeFormat)) {
    return new DateTimeFormat(locales, options);
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
  });

  /** IMPL START */
  const internalSlots = getInternalSlots(this);

  const dataLocale = internalSlots.dataLocale;
  const dataLocaleData = DateTimeFormat.localeData[dataLocale];
  invariant(
    dataLocaleData !== undefined,
    `Cannot load locale-dependent data for ${dataLocale}.`
  );
  /** IMPL END */
} as DateTimeFormatConstructor;

// Static properties
defineProperty(DateTimeFormat, 'supportedLocalesOf', {
  value: function supportedLocalesOf(
    locales: string | string[],
    options?: Pick<DateTimeFormatOptions, 'localeMatcher'>
  ) {
    return SupportedLocales(
      DateTimeFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options as any
    );
  },
});

defineProperty(DateTimeFormat.prototype, 'resolvedOptions', {
  value: function resolvedOptions(this: IDateTimeFormat) {
    if (typeof this !== 'object' || !(this instanceof DateTimeFormat)) {
      throw TypeError(
        'Method Intl.DateTimeFormat.prototype.resolvedOptions called on incompatible receiver'
      );
    }
    const internalSlots = getInternalSlots(this);
    const ro: Record<string, unknown> = {};
    for (const key of RESOLVED_OPTIONS_KEYS) {
      let value = internalSlots[key];
      if (key === 'hourCycle') {
        const hour12 =
          value === 'h11' || value === 'h12'
            ? true
            : value === 'h23' || value === 'h24'
            ? false
            : undefined;
        if (hour12 !== undefined) {
          ro.hour12 = hour12;
        }
      }
      if (DATE_TIME_PROPS.indexOf(key as TABLE_6) > -1) {
        if (
          internalSlots.dateStyle !== undefined ||
          internalSlots.timeStyle !== undefined
        ) {
          value = undefined;
        }
      }

      if (value !== undefined) {
        ro[key] = value;
      }
    }
    return ro as any;
  },
});

defineProperty(DateTimeFormat.prototype, 'formatToParts', {
  value: function formatToParts(date?: number | Date) {
    if (date === undefined) {
      date = Date.now();
    } else {
      date = ToNumber(date);
    }
    return FormatDateTimeToParts(this, date, {
      getInternalSlots,
      localeData: DateTimeFormat.localeData,
      tzData: DateTimeFormat.tzData,
      getDefaultTimeZone: DateTimeFormat.getDefaultTimeZone,
    });
  },
});

const DEFAULT_TIMEZONE = 'UTC';

DateTimeFormat.__setDefaultTimeZone = (timeZone: string) => {
  if (timeZone !== undefined) {
    timeZone = String(timeZone);
    if (
      !IsValidTimeZoneName(timeZone, {
        tzData: DateTimeFormat.tzData,
        uppercaseLinks: UPPERCASED_LINKS,
      })
    ) {
      throw new RangeError('Invalid timeZoneName');
    }
    timeZone = CanonicalizeTimeZoneName(timeZone, {
      tzData: DateTimeFormat.tzData,
      uppercaseLinks: UPPERCASED_LINKS,
    });
  } else {
    timeZone = DEFAULT_TIMEZONE;
  }
  DateTimeFormat.__defaultTimeZone = timeZone;
};
DateTimeFormat.relevantExtensionKeys = ['nu', 'ca', 'hc'];

DateTimeFormat.__defaultTimeZone = DEFAULT_TIMEZONE;
DateTimeFormat.getDefaultTimeZone = () => DateTimeFormat.__defaultTimeZone;

DateTimeFormat.__addLocaleData = function __addLocaleData(
  ...data: RawDateTimeLocaleData[]
) {
  for (const datum of data) {
    const availableLocales: string[] = datum.availableLocales;
    for (const locale of availableLocales) {
      try {
        const {
          dateFormat,
          timeFormat,
          dateTimeFormat,
          formats,
          ...rawData
        } = unpackData(locale, datum);
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
        };

        for (const calendar in formats) {
          processedData.formats[calendar] = Object.keys(
            formats[calendar]
          ).map(skeleton =>
            parseDateTimeSkeleton(skeleton, formats[calendar][skeleton])
          );
        }

        DateTimeFormat.localeData[locale] = processedData;
      } catch (e) {
        // Ignore if we got no data
      }
    }
  }
  DateTimeFormat.availableLocales = Object.keys(DateTimeFormat.localeData);
  if (!DateTimeFormat.__defaultLocale) {
    DateTimeFormat.__defaultLocale = DateTimeFormat.availableLocales[0];
  }
};

Object.defineProperty(DateTimeFormat.prototype, 'format', formatDescriptor);

DateTimeFormat.__defaultLocale = '';
DateTimeFormat.localeData = {};
DateTimeFormat.availableLocales = [];
DateTimeFormat.getDefaultLocale = () => {
  return DateTimeFormat.__defaultLocale;
};
DateTimeFormat.polyfilled = true;
DateTimeFormat.tzData = {};
DateTimeFormat.__addTZData = function (d: PackedData) {
  DateTimeFormat.tzData = unpack(d);
};

try {
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(DateTimeFormat.prototype, Symbol.toStringTag, {
      value: 'Intl.DateTimeFormat',
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  Object.defineProperty(DateTimeFormat.prototype.constructor, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  });
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}
