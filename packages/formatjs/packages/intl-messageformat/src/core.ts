/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

import {
  parse,
  isArgumentElement,
  MessageFormatElement,
  isLiteralElement,
  isDateElement,
  isTimeElement,
  isNumberElement,
  isSelectElement,
  isPluralElement
} from 'intl-messageformat-parser';
import memoizeIntlConstructor from 'intl-format-cache';
import {
  FormatterCache,
  Formatters,
  Formats,
  formatToString,
  formatToParts,
  FormatXMLElementFn,
  formatXMLMessage,
  PrimitiveType
} from './formatters';

// -- MessageFormat --------------------------------------------------------

function resolveLocale(locales: string | string[]): string {
  if (typeof locales === 'string') {
    locales = [locales];
  }
  try {
    return Intl.NumberFormat.supportedLocalesOf(locales, {
      // IE11 localeMatcher `lookup` seems to convert `en` -> `en-US`
      // but not other browsers,
      localeMatcher: 'best fit'
    })[0];
  } catch (e) {
    return IntlMessageFormat.defaultLocale;
  }
}

function prewarmFormatters(
  els: MessageFormatElement[],
  locales: string | string[],
  formatters: Formatters,
  formats: Formats
) {
  els
    .filter(el => !isArgumentElement(el) && !isLiteralElement(el))
    .forEach(el => {
      // Recursively format plural and select parts' option — which can be a
      // nested pattern structure. The choosing of the option to use is
      // abstracted-by and delegated-to the part helper object.
      if (isDateElement(el)) {
        const style = el.style ? formats.date[el.style] : undefined;
        return formatters.getDateTimeFormat(locales, style);
      }
      if (isTimeElement(el)) {
        const style = el.style ? formats.time[el.style] : undefined;
        return formatters.getDateTimeFormat(locales, style);
      }
      if (isNumberElement(el)) {
        const style = el.style ? formats.number[el.style] : undefined;
        return formatters.getNumberFormat(locales, style);
      }
      if (isSelectElement(el)) {
        return Object.keys(el.options).forEach(id =>
          prewarmFormatters(el.options[id].value, locales, formatters, formats)
        );
      }
      if (isPluralElement(el)) {
        formatters.getPluralRules(locales, { type: el.pluralType });
        return Object.keys(el.options).forEach(id =>
          prewarmFormatters(el.options[id].value, locales, formatters, formats)
        );
      }
    });
}

function mergeConfig(c1: Record<string, object>, c2?: Record<string, object>) {
  if (!c2) {
    return c1;
  }
  return {
    ...(c1 || {}),
    ...(c2 || {}),
    ...Object.keys(c1).reduce((all: Record<string, object>, k) => {
      all[k] = {
        ...c1[k],
        ...(c2[k] || {})
      };
      return all;
    }, {})
  };
}

function mergeConfigs(
  defaultConfig: Formats,
  configs?: Partial<Formats>
): Formats {
  if (!configs) {
    return defaultConfig;
  }

  return (Object.keys(defaultConfig) as Array<keyof Formats>).reduce(
    (all: Formats, k: keyof Formats) => {
      all[k] = mergeConfig(defaultConfig[k], configs[k]);
      return all;
    },
    { ...defaultConfig }
  );
}

export interface Options {
  formatters?: Formatters;
}

export function createDefaultFormatters(
  cache: FormatterCache = {
    number: {},
    dateTime: {},
    pluralRules: {}
  }
): Formatters {
  return {
    getNumberFormat: memoizeIntlConstructor(Intl.NumberFormat, cache.number),
    getDateTimeFormat: memoizeIntlConstructor(
      Intl.DateTimeFormat,
      cache.dateTime
    ),
    getPluralRules: memoizeIntlConstructor(Intl.PluralRules, cache.pluralRules)
  };
}

export class IntlMessageFormat {
  private readonly ast: MessageFormatElement[];
  private readonly locale: string;
  private readonly formatters: Formatters;
  private readonly formats: Formats;
  private readonly message: string | undefined;
  private readonly formatterCache: FormatterCache = {
    number: {},
    dateTime: {},
    pluralRules: {}
  };
  constructor(
    message: string | MessageFormatElement[],
    locales: string | string[] = IntlMessageFormat.defaultLocale,
    overrideFormats?: Partial<Formats>,
    opts?: Options
  ) {
    if (typeof message === 'string') {
      this.message = message;
      if (!IntlMessageFormat.__parse) {
        throw new TypeError(
          'IntlMessageFormat.__parse must be set to process `message` of type `string`'
        );
      }
      // Parse string messages into an AST.
      this.ast = IntlMessageFormat.__parse(message);
    } else {
      this.ast = message;
    }

    if (!Array.isArray(this.ast)) {
      throw new TypeError('A message must be provided as a String or AST.');
    }

    // Creates a new object with the specified `formats` merged with the default
    // formats.
    this.formats = mergeConfigs(IntlMessageFormat.formats, overrideFormats);

    // Defined first because it's used to build the format pattern.
    this.locale = resolveLocale(locales || []);

    this.formatters =
      (opts && opts.formatters) || createDefaultFormatters(this.formatterCache);
    prewarmFormatters(this.ast, this.locale, this.formatters, this.formats);
  }

  format = (values?: Record<string, PrimitiveType>) =>
    formatToString(
      this.ast,
      this.locale,
      this.formatters,
      this.formats,
      values,
      this.message
    );

  formatToParts = (values?: Record<string, any>) =>
    formatToParts(
      this.ast,
      this.locale,
      this.formatters,
      this.formats,
      values,
      this.message
    );
  formatXMLMessage = (
    values?: Record<string, PrimitiveType | object | FormatXMLElementFn>
  ) =>
    formatXMLMessage(
      this.ast,
      this.locale,
      this.formatters,
      this.formats,
      values,
      this.message
    );

  resolvedOptions = () => ({ locale: this.locale });
  getAst = () => this.ast;
  static defaultLocale = 'en';
  static __parse: typeof parse | undefined = undefined;
  // Default format options used as the prototype of the `formats` provided to the
  // constructor. These are used when constructing the internal Intl.NumberFormat
  // and Intl.DateTimeFormat instances.
  static formats = {
    number: {
      currency: {
        style: 'currency'
      },

      percent: {
        style: 'percent'
      }
    },

    date: {
      short: {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit'
      },

      medium: {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      },

      long: {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      },

      full: {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }
    },

    time: {
      short: {
        hour: 'numeric',
        minute: 'numeric'
      },

      medium: {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      },

      long: {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short'
      },

      full: {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short'
      }
    }
  };
}

export default IntlMessageFormat;
