/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

import Compiler, { Formats, isSelectOrPluralFormat, Pattern } from './compiler';
import parser, { MessageFormatPattern } from 'intl-messageformat-parser';

// -- MessageFormat --------------------------------------------------------

export interface LocaleData {
  locale: string;
  parentLocale?: string;
  [k: string]: any;
}

function resolveLocale(locales: string | string[]): string {
  if (typeof locales === 'string') {
    locales = [locales];
  }
  try {
    return Intl.NumberFormat.supportedLocalesOf(locales, {
      localeMatcher: 'lookup'
    })[0];
  } catch (e) {
    return MessageFormat.defaultLocale;
  }
}

function formatPatterns(
  pattern: Pattern[],
  values?: Record<string, string | number | boolean | null | undefined>
) {
  let result = '';
  for (const part of pattern) {
    // Exist early for string parts.
    if (typeof part === 'string') {
      result += part;
      continue;
    }

    const { id } = part;

    // Enforce that all required values are provided by the caller.
    if (!(values && id in values)) {
      throw new FormatError(`A value must be provided for: ${id}`, id);
    }

    const value = values[id];

    // Recursively format plural and select parts' option — which can be a
    // nested pattern structure. The choosing of the option to use is
    // abstracted-by and delegated-to the part helper object.
    if (isSelectOrPluralFormat(part)) {
      result += formatPatterns(part.getOption(value as any), values);
    } else {
      result += part.format(value as any);
    }
  }

  return result;
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

  return {
    ...defaultConfig,
    date: mergeConfig(defaultConfig.date, configs.date)
  };
}

class FormatError extends Error {
  public readonly variableId?: string;
  constructor(msg?: string, variableId?: string) {
    super(msg);
    this.variableId = variableId;
  }
}

export default class MessageFormat {
  public static defaultLocale: string = 'en';
  // Default format options used as the prototype of the `formats` provided to the
  // constructor. These are used when constructing the internal Intl.NumberFormat
  // and Intl.DateTimeFormat instances.
  public static readonly formats: Formats = {
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
  private _locale: string;
  private pattern: Pattern[];
  private message: string | MessageFormatPattern;
  constructor(
    message: string | MessageFormatPattern,
    locales: string | string[] = MessageFormat.defaultLocale,
    overrideFormats?: Partial<Formats>
  ) {
    // Parse string messages into an AST.
    const ast =
      typeof message === 'string' ? MessageFormat.__parse(message) : message;

    if (!(ast && ast.type === 'messageFormatPattern')) {
      throw new TypeError('A message must be provided as a String or AST.');
    }

    // Creates a new object with the specified `formats` merged with the default
    // formats.
    const formats = mergeConfigs(MessageFormat.formats, overrideFormats);

    // Defined first because it's used to build the format pattern.
    this._locale = resolveLocale(locales || []);

    // Compile the `ast` to a pattern that is highly optimized for repeated
    // `format()` invocations. **Note:** This passes the `locales` set provided
    // to the constructor instead of just the resolved locale.
    this.pattern = new Compiler(locales, formats).compile(ast);

    this.message = message;
  }
  public static __parse = parser.parse;

  // "Bind" `format()` method to `this` so it can be passed by reference like
  // the other `Intl` APIs.
  format = (
    values?: Record<string, string | number | boolean | null | undefined>
  ) => {
    try {
      return formatPatterns(this.pattern, values);
    } catch (e) {
      if (e.variableId) {
        throw new Error(
          `The intl string context variable '${
            e.variableId
          }' was not provided to the string '${this.message}'`
        );
      } else {
        throw e;
      }
    }
  };
  resolvedOptions() {
    return { locale: this._locale };
  }
}
