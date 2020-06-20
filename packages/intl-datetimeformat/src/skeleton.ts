import {Formats} from './types';

/**
 * https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * Credit: https://github.com/caridy/intl-datetimeformat-pattern/blob/master/index.js
 * with some tweaks
 */
const DATE_TIME_REGEX = /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;

// trim patterns after transformations
const expPatternTrimmer = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

/**
 * Parse Date time skeleton into Intl.DateTimeFormatOptions
 * Ref: https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * @public
 * @param skeleton skeleton string
 */
export function parseDateTimeSkeleton(skeleton: string): Formats {
  const result: Formats = {
    pattern: '',
    pattern12: '',
    skeleton,
  };

  const literals: string[] = [];

  result.pattern12 = skeleton
    // Double apostrophe
    .replace(/'{2}/g, '{apostrophe}')
    // Apostrophe-escaped
    .replace(/'(.*?)'/g, (_, literal) => {
      literals.push(literal);
      return `$$${literals.length - 1}$$`;
    })
    .replace(DATE_TIME_REGEX, match => {
      const len = match.length;
      switch (match[0]) {
        // Era
        case 'G':
          result.era = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short';
          return '{era}';

        // Year
        case 'y':
        case 'Y':
        case 'u':
        case 'U':
        case 'r':
          result.year = len === 2 ? '2-digit' : 'numeric';
          return '{year}';

        // Quarter
        case 'q':
        case 'Q':
          return '{quarter}';
        // Month
        case 'M':
        case 'L':
          result.month = ['numeric', '2-digit', 'short', 'long', 'narrow'][
            len - 1
          ];
          return '{month}';

        // Week
        case 'w':
        case 'W':
          return '{weekday}';
        case 'd':
          result.day = ['numeric', '2-digit'][len - 1];
          return '{day}';

        case 'D':
        case 'F':
        case 'g':
          result.day = 'numeric';
          return '{day}';

        // Weekday
        case 'E':
          result.weekday = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short';
          return '{weekday}';

        case 'e':
          result.weekday = [
            'numeric',
            '2-digit',
            'short',
            'long',
            'narrow',
            'short',
          ][len - 1];
          return '{weekday}';

        case 'c':
          result.weekday = [
            'numeric',
            undefined,
            'short',
            'long',
            'narrow',
            'short',
          ][len - 1];
          return '{weekday}';

        // Period
        case 'a': // AM, PM
        case 'b': // am, pm, noon, midnight
        case 'B': // flexible day periods
          result.hour12 = true;
          return '{ampm}';
        // Hour
        case 'h':
          result.hour = ['numeric', '2-digit'][len - 1];
          return '{hour}';

        case 'H':
          result.hour = ['numeric', '2-digit'][len - 1];
          return '{hour}';

        case 'K':
          result.hour = ['numeric', '2-digit'][len - 1];
          return '{hour}';

        case 'k':
          result.hour = ['numeric', '2-digit'][len - 1];
          return '{hour}';

        case 'j':
        case 'J':
        case 'C':
          throw new RangeError(
            '`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead'
          );
        // Minute
        case 'm':
          result.minute = ['numeric', '2-digit'][len - 1];
          return '{minute}';

        // Second
        case 's':
          result.second = ['numeric', '2-digit'][len - 1];
          return '{second}';

        case 'S':
        case 'A':
          result.second = 'numeric';
          return '{second}';
        // Zone
        case 'z': // 1..3, 4: specific non-location format
        case 'Z': // 1..3, 4, 5: The ISO8601 varios formats
        case 'O': // 1, 4: miliseconds in day short, long
        case 'v': // 1, 4: generic non-location format
        case 'V': // 1, 2, 3, 4: time zone ID or city
        case 'X': // 1, 2, 3, 4: The ISO8601 varios formats
        case 'x': // 1, 2, 3, 4: The ISO8601 varios formats
          result.timeZoneName = len < 4 ? 'short' : 'long';
          return '{timeZoneName}';
      }
      return '';
    });
  //Restore literals
  if (literals.length) {
    result.pattern12 = result.pattern12
      .replace(/\$\$(\d+)\$\$/g, (_, i) => {
        return literals[+i];
      })
      .replace(/\{apostrophe\}/g, "'");
  }
  // Handle apostrophe-escaped things
  result.pattern = result.pattern12
    .replace(/([\s\uFEFF\xA0])\{ampm\}([\s\uFEFF\xA0])/, '$1')
    .replace('{ampm}', '')
    .replace(expPatternTrimmer, '');
  return result;
}
