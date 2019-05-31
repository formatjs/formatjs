/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

import IntlMessageFormat from 'intl-messageformat';
import diff from './diff';
import { FIELD, STYLE, LocaleData } from './types';

// -----------------------------------------------------------------------------

const FIELDS = [
  FIELD.second,
  FIELD.secondShort,
  FIELD.minute,
  FIELD.minuteShort,
  FIELD.hour,
  FIELD.hourShort,
  FIELD.day,
  FIELD.dayShort,
  FIELD.month,
  FIELD.monthShort,
  FIELD.year,
  FIELD.yearShort
];

// -- RelativeFormat -----------------------------------------------------------

export interface IntlRelativeFormatOptions {
  style?: STYLE;
  units?: FIELD;
}

interface IntlRelativeFormat {
  new (
    locales?: string | string[],
    opts?: IntlRelativeFormatOptions
  ): IntlRelativeFormat;
  (
    locales?: string | string[],
    opts?: IntlRelativeFormatOptions
  ): IntlRelativeFormat;
  thresholds: Record<string, number>;
  defaultLocale: string;
  __localeData__: Record<string, LocaleData>;
  __addLocaleData(...data: LocaleData[]): void;
  format(
    date: ConstructorParameters<typeof Date>[0],
    opts?: { now?: Date | number | null }
  ): string;
  resolvedOptions(): {
    locale: string;
    style: STYLE;
    units?: FIELD;
  };
  _compileMessage(units: FIELD): typeof IntlMessageFormat;
}

function isValidUnits(units?: FIELD) {
  if (!units || ~FIELDS.indexOf(units)) {
    return true;
  }

  if (typeof units === 'string') {
    var suggestion = /s$/.test(units) && units.substr(0, units.length - 1);
    if (suggestion && ~FIELDS.indexOf(suggestion as FIELD)) {
      throw new Error(
        `"${units}" is not a valid IntlRelativeFormat 'units' value, did you mean: ${suggestion}`
      );
    }
  }

  throw new Error(
    `"${units}" is not a valid IntlRelativeFormat 'units' value, it must be one of: ${FIELDS.join(
      '", "'
    )}`
  );
}

function resolveLocale(locales: string | string[] = []) {
  if (typeof locales === 'string') {
    locales = [locales];
  }

  // Create a copy of the array so we can push on the default locale.
  locales = (locales || []).concat(RelativeFormat.defaultLocale);

  var localeData = RelativeFormat.__localeData__;
  var i, len, localeParts, data;

  // Using the set of locales + the default locale, we look for the first one
  // which that has been registered. When data does not exist for a locale, we
  // traverse its ancestors to find something that's been registered within
  // its hierarchy of locales. Since we lack the proper `parentLocale` data
  // here, we must take a naive approach to traversal.
  for (i = 0, len = locales.length; i < len; i += 1) {
    localeParts = locales[i].toLowerCase().split('-');

    while (localeParts.length) {
      data = localeData[localeParts.join('-')];
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
    'No locale data has been added to IntlRelativeFormat for: ' +
      locales.join(', ') +
      ', or the default locale: ' +
      defaultLocale
  );
}

function findFields(locale: string) {
  const localeData = RelativeFormat.__localeData__;
  let data: LocaleData | undefined = localeData[locale.toLowerCase()];

  // The locale data is de-duplicated, so we have to traverse the locale's
  // hierarchy until we find `fields` to return.
  while (data) {
    if (data.fields) {
      return data.fields;
    }

    data = !!data.parentLocale
      ? localeData[data.parentLocale.toLowerCase()]
      : undefined;
  }

  throw new Error(
    'Locale data added to IntlRelativeFormat is missing `fields` for :' + locale
  );
}

function resolveStyle(style?: IntlRelativeFormatOptions['style']) {
  // Default to "best fit" style.
  if (!style) {
    return 'best fit';
  }

  if (style === 'best fit' || style === 'numeric') {
    return style;
  }

  throw new Error(
    `"${style}" is not a valid IntlRelativeFormat 'style' value, it must be one of: 'best fit' or 'numeric'`
  );
}

function selectUnits(diffReport: Record<FIELD, number>) {
  const fields = FIELDS.filter(function(field) {
    return field.indexOf('-short') < 1;
  });
  let units = fields[0];
  for (units of fields) {
    if (Math.abs(diffReport[units]) < RelativeFormat.thresholds[units]) {
      break;
    }
  }

  return units;
}

const RelativeFormat: IntlRelativeFormat = ((
  locales?: string | string[],
  options: IntlRelativeFormatOptions = {}
) => {
  // Make a copy of `locales` if it's an array, so that it doesn't change
  // since it's used lazily.
  if (Array.isArray(locales)) {
    locales = [...locales];
  }

  const locale = resolveLocale(locales);
  const resolvedOptions = {
    style: resolveStyle(options.style),
    units: isValidUnits(options.units) && options.units
  };
  const fields = findFields(locale);
  const messages: Record<string, typeof IntlMessageFormat> = {};

  function getRelativeUnits(difference: string, units: FIELD) {
    var field = fields[units];

    if (field.relative) {
      return field.relative[difference];
    }
  }

  function getMessage(units: FIELD) {
    // Create a new synthetic message based on the locale data from CLDR.
    if (!messages[units]) {
      messages[units] = compileMessage(units);
    }

    return messages[units];
  }

  function compileMessage(units: FIELD) {
    const { relativeTime } = fields[units];
    const future = Object.keys(relativeTime.future).reduce(
      (future: string, i) =>
        future + ` ${i} {${relativeTime.future[i].replace('{0}', '#')}}`,
      ''
    );
    const past = Object.keys(relativeTime.past).reduce(
      (past: string, i) =>
        past + ` ${i} {${relativeTime.past[i].replace('{0}', '#')}}`,
      ''
    );

    const message =
      '{when, select, future {{0, plural, ' +
      future +
      '}}' +
      'past {{0, plural, ' +
      past +
      '}}}';

    // Create the synthetic IntlMessageFormat instance using the original
    // locales value specified by the user when constructing the the parent
    // IntlRelativeFormat instance.
    return new IntlMessageFormat(message, locales);
  }

  return {
    format(
      date?: Date | number,
      options?: { now?: number | Date | null }
    ) {
      const now =
        options && options.now !== undefined
          ? options.now === null
            ? 0
            : options.now
          : Date.now();

      if (date === undefined) {
        date = now;
      }

      // Determine if the `date` and optional `now` values are valid, and throw a
      // similar error to what `Intl.DateTimeFormat#format()` would throw.
      if (!isFinite(now as number)) {
        throw new RangeError(
          'The `now` option provided to IntlRelativeFormat#format() is not ' +
            'in valid range.'
        );
      }

      if (!isFinite(date as number)) {
        throw new RangeError(
          'The date value provided to IntlRelativeFormat#format() is not ' +
            'in valid range.'
        );
      }

      var diffReport = diff(now, date);
      var units = resolvedOptions.units || selectUnits(diffReport);
      var diffInUnits = diffReport[units];

      if (resolvedOptions.style !== STYLE.numeric) {
        var relativeUnits = getRelativeUnits(diffInUnits + '', units);
        if (relativeUnits) {
          return relativeUnits;
        }
      }

      return getMessage(units).format({
        '0': Math.abs(diffInUnits),
        when: diffInUnits < 0 ? 'past' : 'future'
      });
    },
    resolvedOptions() {
      return {
        locale,
        style: resolvedOptions.style,
        units: resolvedOptions.units
      };
    },
    _compileMessage: compileMessage
  };
}) as any;

RelativeFormat.__localeData__ = {};
RelativeFormat.__addLocaleData = (...data: LocaleData[]) => {
  for (const datum of data) {
    if (!(datum && datum.locale)) {
      throw new Error(
        'Locale data provided to IntlRelativeFormat is missing a ' +
          '`locale` property value'
      );
    }

    RelativeFormat.__localeData__[datum.locale.toLowerCase()] = datum;
  }
};

// Define public `defaultLocale` property which can be set by the developer, or
// it will be set when the first RelativeFormat instance is created by
// leveraging the resolved locale from `Intl`.
RelativeFormat.defaultLocale = 'en';

RelativeFormat.thresholds = {
  second: 45,
  'second-short': 45, // seconds to minute
  minute: 45,
  'minute-short': 45, // minutes to hour
  hour: 22,
  'hour-short': 22, // hours to day
  day: 26,
  'day-short': 26, // days to month
  month: 11,
  'month-short': 11 // months to year
};

export default RelativeFormat;
