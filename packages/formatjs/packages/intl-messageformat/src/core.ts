/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

import Compiler, { Formats, isSelectOrPluralFormat, Pattern } from "./compiler";
import parser, { MessageFormatPattern } from "intl-messageformat-parser";

// -- MessageFormat --------------------------------------------------------

interface LocaleData {
  locale: string
  parentLocale?: string
  [k: string]: any
}

export default class MessageFormat {
  public static defaultLocale: string = "en";
  public static __localeData__: Record<string, any> = {};
  // Default format options used as the prototype of the `formats` provided to the
  // constructor. These are used when constructing the internal Intl.NumberFormat
  // and Intl.DateTimeFormat instances.
  public static readonly formats: Formats = {
    number: {
      currency: {
        style: "currency"
      },

      percent: {
        style: "percent"
      }
    },

    date: {
      short: {
        month: "numeric",
        day: "numeric",
        year: "2-digit"
      },

      medium: {
        month: "short",
        day: "numeric",
        year: "numeric"
      },

      long: {
        month: "long",
        day: "numeric",
        year: "numeric"
      },

      full: {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }
    },

    time: {
      short: {
        hour: "numeric",
        minute: "numeric"
      },

      medium: {
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      },

      long: {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short"
      },

      full: {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short"
      }
    }
  };
  private _locale: string;
  private pattern: ReturnType<Compiler["compile"]>;
  private message: string;
  constructor(
    message: string,
    locales?: string | string[],
    overrideFormats?: Partial<Formats>
  ) {
    // Parse string messages into an AST.
    var ast =
      typeof message === "string" ? MessageFormat.__parse(message) : message;

    if (!(ast && ast.type === "messageFormatPattern")) {
      throw new TypeError("A message must be provided as a String or AST.");
    }

    // Creates a new object with the specified `formats` merged with the default
    // formats.
    const formats = mergeConfigs(MessageFormat.formats, overrideFormats);

    // Defined first because it's used to build the format pattern.
    this._locale = this._resolveLocale(locales || []);

    // Compile the `ast` to a pattern that is highly optimized for repeated
    // `format()` invocations. **Note:** This passes the `locales` set provided
    // to the constructor instead of just the resolved locale.
    this.pattern = this._compilePattern(ast, locales || [], formats);

    this.message = message;
  }
  static __addLocaleData(...data: LocaleData[]) {
    data.forEach(datum => {
      if (!(datum && datum.locale)) {
        throw new Error(
          "Locale data provided to IntlMessageFormat is missing a " +
            "`locale` property"
        );
      }
  
      MessageFormat.__localeData__[datum.locale.toLowerCase()] = datum;
    })
  }

  public static __parse = parser.parse;

  // "Bind" `format()` method to `this` so it can be passed by reference like
  // the other `Intl` APIs.
  format = (
    values?: Record<string, string | number | boolean | null | undefined>
  ) => {
    try {
      return this._format(this.pattern, values);
    } catch (e) {
      if (e.variableId) {
        throw new Error(
          "The intl string context variable '" +
            e.variableId +
            "'" +
            " was not provided to the string '" +
            this.message +
            "'"
        );
      } else {
        throw e;
      }
    }
  };
  resolvedOptions() {
    return { locale: this._locale };
  }

  _resolveLocale(locales: string | string[]): string {
    if (typeof locales === "string") {
      locales = [locales];
    }

    // Create a copy of the array so we can push on the default locale.
    locales = (locales || []).concat(MessageFormat.defaultLocale);

    var localeData = MessageFormat.__localeData__;
    var i, len, localeParts, data;

    // Using the set of locales + the default locale, we look for the first one
    // which that has been registered. When data does not exist for a locale, we
    // traverse its ancestors to find something that's been registered within
    // its hierarchy of locales. Since we lack the proper `parentLocale` data
    // here, we must take a naive approach to traversal.
    for (i = 0, len = locales.length; i < len; i += 1) {
      localeParts = locales[i].toLowerCase().split("-");

      while (localeParts.length) {
        data = localeData[localeParts.join("-")];
        if (data) {
          // Return the normalized locale string; e.g., we return "en-US",
          // instead of "en-us".
          return data.locale;
        }

        localeParts.pop();
      }
    }

    var defaultLocale = locales.pop();
    throw new Error(
      "No locale data has been added to IntlMessageFormat for: " +
        locales.join(", ") +
        ", or the default locale: " +
        defaultLocale
    );
  }
  _compilePattern(
    ast: MessageFormatPattern,
    locales: string | string[],
    formats: Formats
  ) {
    var compiler = new Compiler(locales, formats);
    return compiler.compile(ast);
  }
  _format(
    pattern: Pattern[],
    values?: Record<string, string | number | boolean | null | undefined>
  ) {
    var result = "",
      i,
      len,
      part,
      id,
      value;

    for (i = 0, len = pattern.length; i < len; i += 1) {
      part = pattern[i];

      // Exist early for string parts.
      if (typeof part === "string") {
        result += part;
        continue;
      }

      id = part.id;

      // Enforce that all required values are provided by the caller.
      if (!(values && id in values)) {
        throw new FormatError("A value must be provided for: " + id, id);
      }

      value = values[id];

      // Recursively format plural and select parts' option — which can be a
      // nested pattern structure. The choosing of the option to use is
      // abstracted-by and delegated-to the part helper object.
      if (isSelectOrPluralFormat(part)) {
        result += this._format(part.getOption(value as any), values);
      } else {
        result += part.format(value as any);
      }
    }

    return result;
  }
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
