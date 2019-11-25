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
      case 'Y':
      case 'u':
      case 'U':
      case 'r':
        result.year = len === 2 ? '2-digit' : 'numeric';
        break;
      // Quarter
      case 'q':
      case 'Q':
        throw new RangeError('Quarter (q/Q) is not supported');
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
        throw new RangeError('Week (w/W) is not supported');
      case 'd':
        result.day = ['numeric', '2-digit'][len - 1];
        break;
      case 'D':
      case 'F':
      case 'g':
        throw new RangeError('Day (D/F/g) is not supported');
      // Weekday
      case 'E':
        result.weekday = len === 4 ? 'short' : len === 5 ? 'narrow' : 'short';
        break;
      case 'e':
        if (len < 4) {
          throw new RangeError('Weekday e..eee is not supported');
        }
        result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
        break;
      case 'c':
        if (len < 4) {
          throw new RangeError('Weekday c..ccc is not supported');
        }
        result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
        break;

      // Period
      case 'a': // AM, PM
      case 'b': // am, pm, noon, midnight
      case 'B': // flexible day periods
        result.hour12 = true;
        break;

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
        throw new RangeError('Pattern (j/J/C) is not supported');
      // Minute
      case 'm':
        result.minute = ['numeric', '2-digit'][len - 1];
        break;
      case 's':
        result.second = ['numeric', '2-digit'][len - 1];
        break;
      case 'S':
      case 'A':
        throw new RangeError('Pattern (S/A) is not supported');
      // Zone
      case 'z': // 1..3, 4: specific non-location format
      case 'Z': // 1..3, 4, 5: The ISO8601 varios formats
      case 'O': // 1, 4: miliseconds in day short, long
      case 'v': // 1, 4: generic non-location format
      case 'V': // 1, 2, 3, 4: time zone ID or city
      case 'X': // 1, 2, 3, 4: The ISO8601 varios formats
      case 'x': // 1, 2, 3, 4: The ISO8601 varios formats
        // this polyfill only supports much, for now, we are just doing something dummy
        result.timeZoneName = len < 4 ? 'short' : 'long';
        break;
    }
    return '';
  });
  return result;
}
