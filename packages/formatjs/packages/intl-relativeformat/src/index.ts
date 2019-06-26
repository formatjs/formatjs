/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

import {
  default as IntlRelativeTimeFormat,
  FormattableUnit
} from '@formatjs/intl-relativetimeformat';
import diff from './diff';
import { SUPPORTED_FIELD, STYLE, LocaleData } from './types';
declare global {
  namespace Intl {
    var RelativeTimeFormat: typeof IntlRelativeTimeFormat;
  }
}
// -----------------------------------------------------------------------------

const SUPPORTED_FIELDS = [
  SUPPORTED_FIELD.second,
  SUPPORTED_FIELD.secondShort,
  SUPPORTED_FIELD.minute,
  SUPPORTED_FIELD.minuteShort,
  SUPPORTED_FIELD.hour,
  SUPPORTED_FIELD.hourShort,
  SUPPORTED_FIELD.day,
  SUPPORTED_FIELD.dayShort,
  SUPPORTED_FIELD.month,
  SUPPORTED_FIELD.monthShort,
  SUPPORTED_FIELD.year,
  SUPPORTED_FIELD.yearShort
];

// -- RelativeFormat -----------------------------------------------------------

export interface IntlRelativeFormatOptions {
  style?: STYLE;
  units?: SUPPORTED_FIELD;
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
    units?: SUPPORTED_FIELD;
  };
}

function isValidUnits(units?: SUPPORTED_FIELD): units is SUPPORTED_FIELD {
  if (!units || ~SUPPORTED_FIELDS.indexOf(units)) {
    return true;
  }

  if (typeof units === 'string') {
    var suggestion = /s$/.test(units) && units.substr(0, units.length - 1);
    if (
      suggestion &&
      ~SUPPORTED_FIELDS.indexOf(suggestion as SUPPORTED_FIELD)
    ) {
      throw new Error(
        `"${units}" is not a valid IntlRelativeFormat 'units' value, did you mean: ${suggestion}`
      );
    }
  }

  throw new Error(
    `"${units}" is not a valid IntlRelativeFormat 'units' value, it must be one of: ${SUPPORTED_FIELDS.join(
      '", "'
    )}`
  );
}

function resolveStyle(style?: IntlRelativeFormatOptions['style']) {
  // Default to "best fit" style.
  if (!style) {
    return STYLE.bestFit;
  }

  if (style === 'best fit' || style === 'numeric') {
    return style;
  }

  throw new Error(
    `"${style}" is not a valid IntlRelativeFormat 'style' value, it must be one of: 'best fit' or 'numeric'`
  );
}

function selectUnits(diffReport: Record<SUPPORTED_FIELD, number>) {
  const fields = SUPPORTED_FIELDS.filter(function(field) {
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
  const resolvedOptions = {
    style: resolveStyle(options.style),
    units: isValidUnits(options.units) && options.units
  };
  const numeric = resolvedOptions.style === 'best fit' ? 'auto' : 'always';
  const rtf = new Intl.RelativeTimeFormat(locales, {
    numeric
  });

  return {
    format(date?: Date | number, options?: { now?: number | Date | null }) {
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
      const style =
        units.substring(units.length - 6, units.length) === '-short'
          ? 'narrow'
          : 'long';
      const rtfUnit = units.replace('-short', '') as FormattableUnit;
      return new Intl.RelativeTimeFormat(locales, {
        numeric,
        style
      }).format(diffInUnits, rtfUnit);
    },
    resolvedOptions() {
      return {
        locale: rtf.resolvedOptions().locale,
        style: resolvedOptions.style,
        units: resolvedOptions.units
      };
    }
  };
}) as any;

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
