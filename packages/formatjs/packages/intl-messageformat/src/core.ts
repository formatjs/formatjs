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

export interface Formats {
  number: Record<string, Intl.NumberFormatOptions>;
  date: Record<string, Intl.DateTimeFormatOptions>;
  time: Record<string, Intl.DateTimeFormatOptions>;
}

export interface FormatterCache {
  number: Record<string, Intl.NumberFormat>;
  dateTime: Record<string, Intl.DateTimeFormat>;
  pluralRules: Record<string, Intl.PluralRules>;
}

export interface Formatters {
  getNumberFormat(
    ...args: ConstructorParameters<typeof Intl.NumberFormat>
  ): Intl.NumberFormat;
  getDateTimeFormat(
    ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
  ): Intl.DateTimeFormat;
  getPluralRules(
    ...args: ConstructorParameters<typeof Intl.PluralRules>
  ): Intl.PluralRules;
}

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

const ESCAPE_HASH_REGEX = /\\#/g;

export const enum PART_TYPE {
  literal,
  argument
}

export interface LiteralPart {
  type: PART_TYPE.literal;
  value: string;
}

export interface ArgumentPart {
  type: PART_TYPE.argument;
  value: any;
}

export type MessageFormatPart = LiteralPart | ArgumentPart;

function mergeLiteral(parts: MessageFormatPart[]): MessageFormatPart[] {
  if (parts.length < 2) {
    return parts;
  }
  return parts.reduce(
    (all, part) => {
      const lastPart = all[all.length - 1];
      if (
        !lastPart ||
        lastPart.type !== PART_TYPE.literal ||
        part.type !== PART_TYPE.literal
      ) {
        all.push(part);
      } else {
        lastPart.value += part.value;
      }
      return all;
    },
    [] as MessageFormatPart[]
  );
}

function formatToParts(
  els: MessageFormatElement[],
  locales: string | string[],
  formatters: Formatters,
  formats: Formats,
  values?: Record<string, any>,
  // For debugging
  originalMessage?: string
): MessageFormatPart[] {
  // Hot path for straight simple msg translations
  if (els.length === 1 && isLiteralElement(els[0])) {
    return [
      {
        type: PART_TYPE.literal,
        value: els[0].value.replace(ESCAPE_HASH_REGEX, '#')
      }
    ];
  }
  const result: MessageFormatPart[] = [];
  for (const el of els) {
    // Exit early for string parts.
    if (isLiteralElement(el)) {
      result.push({
        type: PART_TYPE.literal,
        value: el.value.replace(ESCAPE_HASH_REGEX, '#')
      });
      continue;
    }
    const { value: varName } = el;

    // Enforce that all required values are provided by the caller.
    if (!(values && varName in values)) {
      throw new FormatError(
        `The intl string context variable '${varName}' was not provided to the string '${originalMessage}'`
      );
    }

    const value = values[varName];
    if (isArgumentElement(el)) {
      if (!value || typeof value === 'string' || typeof value === 'number') {
        result.push({
          type: PART_TYPE.literal,
          value:
            typeof value === 'string' || typeof value === 'number'
              ? String(value)
              : ''
        });
      } else {
        result.push({
          type: PART_TYPE.argument,
          value
        });
      }
      continue;
    }

    // Recursively format plural and select parts' option — which can be a
    // nested pattern structure. The choosing of the option to use is
    // abstracted-by and delegated-to the part helper object.
    if (isDateElement(el)) {
      const style = el.style ? formats.date[el.style] : undefined;
      result.push({
        type: PART_TYPE.literal,
        value: formatters
          .getDateTimeFormat(locales, style)
          .format(value as number)
      });
      continue;
    }
    if (isTimeElement(el)) {
      const style = el.style ? formats.time[el.style] : undefined;
      result.push({
        type: PART_TYPE.literal,
        value: formatters
          .getDateTimeFormat(locales, style)
          .format(value as number)
      });
      continue;
    }
    if (isNumberElement(el)) {
      const style = el.style ? formats.number[el.style] : undefined;
      result.push({
        type: PART_TYPE.literal,
        value: formatters
          .getNumberFormat(locales, style)
          .format(value as number)
      });
      continue;
    }
    if (isSelectElement(el)) {
      const opt = el.options[value as string] || el.options.other;
      if (!opt) {
        throw new RangeError(
          `Invalid values for "${
            el.value
          }": "${value}". Options are "${Object.keys(el.options).join('", "')}"`
        );
      }
      result.push(
        ...formatToParts(opt.value, locales, formatters, formats, values)
      );
      continue;
    }
    if (isPluralElement(el)) {
      let opt = el.options[`=${value}`];
      if (!opt) {
        const rule = formatters
          .getPluralRules(locales, { type: el.pluralType })
          .select((value as number) - (el.offset || 0));
        opt = el.options[rule] || el.options.other;
      }
      if (!opt) {
        throw new RangeError(
          `Invalid values for "${
            el.value
          }": "${value}". Options are "${Object.keys(el.options).join('", "')}"`
        );
      }
      result.push(
        ...formatToParts(opt.value, locales, formatters, formats, values)
      );
      continue;
    }
  }
  return mergeLiteral(result);
}

function formatToString(
  els: MessageFormatElement[],
  locales: string | string[],
  formatters: Formatters,
  formats: Formats,
  values?: Record<string, string | number | boolean | null | undefined>,
  // For debugging
  originalMessage?: string
): string {
  const parts = formatToParts(
    els,
    locales,
    formatters,
    formats,
    values,
    originalMessage
  );
  // Hot path for straight simple msg translations
  if (parts.length === 1) {
    return parts[0].value;
  }
  return parts.reduce((all, part) => (all += part.value), '');
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

class FormatError extends Error {
  public readonly variableId?: string;
  constructor(msg?: string, variableId?: string) {
    super(msg);
    this.variableId = variableId;
  }
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

  format = (
    values?: Record<string, string | number | boolean | null | undefined>
  ) => {
    return formatToString(
      this.ast,
      this.locale,
      this.formatters,
      this.formats,
      values,
      this.message
    );
  };
  formatToParts = (values?: Record<string, any>) => {
    return formatToParts(
      this.ast,
      this.locale,
      this.formatters,
      this.formats,
      values,
      this.message
    );
  };
  resolvedOptions() {
    return { locale: this.locale };
  }
  getAst() {
    return this.ast;
  }
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
