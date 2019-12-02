import {NumberSkeletonToken} from './types';
import {UnifiedNumberFormatOptions} from '@formatjs/intl-unified-numberformat';

/**
 * https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * Credit: https://github.com/caridy/intl-datetimeformat-pattern/blob/master/index.js
 * with some tweaks
 */
const DATE_TIME_REGEX = /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;

export interface ExtendedDateTimeFormatOptions
  extends Intl.DateTimeFormatOptions {
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24';
}

/**
 * Parse Date time skeleton into Intl.DateTimeFormatOptions
 * Ref: https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * @public
 * @param skeleton skeleton string
 */
export function parseDateTimeSkeleton(
  skeleton: string
): ExtendedDateTimeFormatOptions {
  const result: ExtendedDateTimeFormatOptions = {};
  skeleton.replace(DATE_TIME_REGEX, match => {
    const len = match.length;
    switch (match[0]) {
      // Era
      case 'G':
        result.era = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short';
        break;
      // Year
      case 'y':
        result.year = len === 2 ? '2-digit' : 'numeric';
        break;
      case 'Y':
      case 'u':
      case 'U':
      case 'r':
        throw new RangeError(
          '`Y/u/U/r` (year) patterns are not supported, use `y` instead'
        );
      // Quarter
      case 'q':
      case 'Q':
        throw new RangeError('`q/Q` (quarter) patterns are not supported');
      // Month
      case 'M':
      case 'L':
        result.month = ['numeric', '2-digit', 'short', 'long', 'narrow'][
          len - 1
        ];
        break;
      // Week
      case 'w':
      case 'W':
        throw new RangeError('`w/W` (week) patterns are not supported');
      case 'd':
        result.day = ['numeric', '2-digit'][len - 1];
        break;
      case 'D':
      case 'F':
      case 'g':
        throw new RangeError(
          '`D/F/g` (day) patterns are not supported, use `d` instead'
        );
      // Weekday
      case 'E':
        result.weekday = len === 4 ? 'short' : len === 5 ? 'narrow' : 'short';
        break;
      case 'e':
        if (len < 4) {
          throw new RangeError('`e..eee` (weekday) patterns are not supported');
        }
        result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
        break;
      case 'c':
        if (len < 4) {
          throw new RangeError('`c..ccc` (weekday) patterns are not supported');
        }
        result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
        break;

      // Period
      case 'a': // AM, PM
        result.hour12 = true;
        break;
      case 'b': // am, pm, noon, midnight
      case 'B': // flexible day periods
        throw new RangeError(
          '`b/B` (period) patterns are not supported, use `a` instead'
        );
      // Hour
      case 'h':
        result.hourCycle = 'h12';
        result.hour = ['numeric', '2-digit'][len - 1];
        break;
      case 'H':
        result.hourCycle = 'h23';
        result.hour = ['numeric', '2-digit'][len - 1];
        break;
      case 'K':
        result.hourCycle = 'h11';
        result.hour = ['numeric', '2-digit'][len - 1];
        break;
      case 'k':
        result.hourCycle = 'h24';
        result.hour = ['numeric', '2-digit'][len - 1];
        break;
      case 'j':
      case 'J':
      case 'C':
        throw new RangeError(
          '`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead'
        );
      // Minute
      case 'm':
        result.minute = ['numeric', '2-digit'][len - 1];
        break;
      // Second
      case 's':
        result.second = ['numeric', '2-digit'][len - 1];
        break;
      case 'S':
      case 'A':
        throw new RangeError(
          '`S/A` (second) pattenrs are not supported, use `s` instead'
        );
      // Zone
      case 'z': // 1..3, 4: specific non-location format
        result.timeZoneName = len < 4 ? 'short' : 'long';
        break;
      case 'Z': // 1..3, 4, 5: The ISO8601 varios formats
      case 'O': // 1, 4: miliseconds in day short, long
      case 'v': // 1, 4: generic non-location format
      case 'V': // 1, 2, 3, 4: time zone ID or city
      case 'X': // 1, 2, 3, 4: The ISO8601 varios formats
      case 'x': // 1, 2, 3, 4: The ISO8601 varios formats
        throw new RangeError(
          '`Z/O/v/V/X/x` (timeZone) pattenrs are not supported, use `z` instead'
        );
    }
    return '';
  });
  return result;
}

function icuUnitToEcma(unit: string): UnifiedNumberFormatOptions['unit'] {
  return unit.replace(/^(.*?)-/, '') as UnifiedNumberFormatOptions['unit'];
}

const FRACTION_PRECISION_REGEX = /^\.(?:(0+)(\+|#+)?)?$/g;
const SIGNIFICANT_PRECISION_REGEX = /^(@+)?(\+|#+)?$/g;

function parseSignificantPrecision(str: string): UnifiedNumberFormatOptions {
  const result: UnifiedNumberFormatOptions = {};
  str.replace(SIGNIFICANT_PRECISION_REGEX, function(
    _: string,
    g1: string,
    g2: string | number
  ) {
    // @@@ case
    if (typeof g2 !== 'string') {
      result.minimumSignificantDigits = g1.length;
      result.maximumSignificantDigits = g1.length;
    }
    // @@@+ case
    else if (g2 === '+') {
      result.minimumSignificantDigits = g1.length;
    }
    // .### case
    else if (g1[0] === '#') {
      result.maximumSignificantDigits = g1.length;
    }
    // .@@## or .@@@ case
    else {
      result.minimumSignificantDigits = g1.length;
      result.maximumSignificantDigits =
        g1.length + (typeof g2 === 'string' ? g2.length : 0);
    }
    return '';
  });
  return result;
}

function parseSign(str: string): UnifiedNumberFormatOptions | undefined {
  switch (str) {
    case 'sign-auto':
      return {
        signDisplay: 'auto',
      };
    case 'sign-accounting':
      return {
        currencySign: 'accounting',
      };
    case 'sign-always':
      return {
        signDisplay: 'always',
      };
    case 'sign-accounting-always':
      return {
        signDisplay: 'always',
        currencySign: 'accounting',
      };
    case 'sign-except-zero':
      return {
        signDisplay: 'exceptZero',
      };
    case 'sign-accounting-except-zero':
      return {
        signDisplay: 'exceptZero',
        currencySign: 'accounting',
      };
    case 'sign-never':
      return {
        signDisplay: 'never',
      };
  }
}

function parseNotationOptions(opt: string): UnifiedNumberFormatOptions {
  const result: UnifiedNumberFormatOptions = {};
  const signOpts = parseSign(opt);
  if (signOpts) {
    return signOpts;
  }
  return result;
}

/**
 * https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md#skeleton-stems-and-options
 */
export function convertNumberSkeletonToNumberFormatOptions(
  tokens: NumberSkeletonToken[]
): UnifiedNumberFormatOptions {
  let result: UnifiedNumberFormatOptions = {};
  for (const token of tokens) {
    switch (token.stem) {
      case 'percent':
        result.style = 'percent';
        continue;
      case 'currency':
        result.style = 'currency';
        result.currency = token.options[0];
        continue;
      case 'group-off':
        result.useGrouping = false;
        continue;
      case 'precision-integer':
        result.maximumFractionDigits = 0;
        continue;
      case 'measure-unit':
        result.style = 'unit';
        result.unit = icuUnitToEcma(token.options[0]);
        continue;
      case 'compact-short':
        result.notation = 'compact';
        result.compactDisplay = 'short';
        continue;
      case 'compact-long':
        result.notation = 'compact';
        result.compactDisplay = 'long';
        continue;
      case 'scientific':
        result = {
          ...result,
          notation: 'scientific',
          ...token.options.reduce(
            (all, opt) => ({...all, ...parseNotationOptions(opt)}),
            {}
          ),
        };
        continue;
      case 'engineering':
        result = {
          ...result,
          notation: 'engineering',
          ...token.options.reduce(
            (all, opt) => ({...all, ...parseNotationOptions(opt)}),
            {}
          ),
        };
        continue;
      case 'notation-simple':
        result.notation = 'standard';
        continue;
      // https://github.com/unicode-org/icu/blob/master/icu4c/source/i18n/unicode/unumberformatter.h
      case 'unit-width-narrow':
        result.currencyDisplay = 'narrowSymbol';
        result.unitDisplay = 'narrow';
        continue;
      case 'unit-width-short':
        result.currencyDisplay = 'code';
        result.unitDisplay = 'short';
        continue;
      case 'unit-width-full-name':
        result.currencyDisplay = 'name';
        result.unitDisplay = 'long';
        continue;
      case 'unit-width-iso-code':
        result.currencyDisplay = 'symbol';
        continue;
    }
    // Precision
    // https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md#fraction-precision
    if (FRACTION_PRECISION_REGEX.test(token.stem)) {
      if (token.options.length > 1) {
        throw new RangeError(
          'Fraction-precision stems only accept a single optional option'
        );
      }
      token.stem.replace(FRACTION_PRECISION_REGEX, function(
        match: string,
        g1: string,
        g2: string | number
      ) {
        // precision-integer case
        if (match === '.') {
          result.maximumFractionDigits = 0;
        }
        // .000+ case
        else if (g2 === '+') {
          result.minimumFractionDigits = g2.length;
        }
        // .### case
        else if (g1[0] === '#') {
          result.maximumFractionDigits = g1.length;
        }
        // .00## or .000 case
        else {
          result.minimumFractionDigits = g1.length;
          result.maximumFractionDigits =
            g1.length + (typeof g2 === 'string' ? g2.length : 0);
        }
        return '';
      });
      if (token.options.length) {
        result = {...result, ...parseSignificantPrecision(token.options[0])};
      }
      continue;
    }
    if (SIGNIFICANT_PRECISION_REGEX.test(token.stem)) {
      result = {...result, ...parseSignificantPrecision(token.stem)};
      continue;
    }
    const signOpts = parseSign(token.stem);
    if (signOpts) {
      result = {...result, ...signOpts};
    }
  }
  return result;
}
