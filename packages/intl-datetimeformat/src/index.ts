import {
  getOption,
  createResolveLocale,
  setInternalSlot,
  getInternalSlot,
  invariant,
  toObject,
  defineProperty,
  supportedLocales,
  objectIs,
  partitionPattern,
} from '@formatjs/intl-utils';
import getInternalSlots from './get_internal_slots';
import type {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales';
import zones from './zones';
import links from './links';
const UPPERCASED_ZONES = zones.reduce((all: Record<string, string>, z) => {
  all[z.toUpperCase()] = z;
  return all;
}, {});
const UPPERCASED_LINKS = Object.keys(links).reduce(
  (all: Record<string, string>, l) => {
    all[l.toUpperCase()] = links[l as 'Zulu'];
    return all;
  },
  {}
);

export interface IntlDateTimeFormatInternal {
  locale: string;
  calendar?: string;
  weekday: 'narrow' | 'short' | 'long';
  era: 'narrow' | 'short' | 'long';
  year: '2-year' | 'numeric';
  month: '2-year' | 'numeric' | 'narrow' | 'short' | 'long';
  day: '2-year' | 'numeric';
  hour: '2-year' | 'numeric';
  minute: '2-year' | 'numeric';
  second: '2-year' | 'numeric';
  timeZoneName: 'short' | 'long';
  hourCycle: string;
  numberingSystem: string;
  timeZone: string;
  pattern: string;
  boundFormat?: Intl.DateTimeFormat['format'];
}

export interface DateTimeFormatPart {
  type:
    | 'literal'
    | 'era'
    | 'year'
    | 'month'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second'
    | 'weekday'
    | 'timeZoneName'
    | 'dayPeriod'
    | 'relatedYear'
    | 'yearName'
    | 'unknown';
  value: 'string';
}

const DATE_TIME_PROPS: Array<
  keyof Pick<
    IntlDateTimeFormatInternal,
    | 'weekday'
    | 'era'
    | 'year'
    | 'month'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second'
    | 'timeZoneName'
  >
> = [
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

const RESOLVED_OPTIONS_KEYS: Array<
  keyof Omit<IntlDateTimeFormatInternal, 'pattern' | 'boundFormat'>
> = [
  'locale',
  'calendar',
  'numberingSystem',
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

export interface DateTimeFormatOptions extends Intl.DateTimeFormatOptions {
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24';
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  fractionalSecondDigits?: number;
  calendar?:
    | 'buddhist'
    | 'chinese'
    | 'coptic'
    | 'ethiopia'
    | 'ethiopic'
    | 'gregory'
    | 'hebrew'
    | 'indian'
    | 'islamic'
    | 'iso8601'
    | 'japanese'
    | 'persian'
    | 'roc';
  dayPeriod?: 'narrow' | 'short' | 'long';
  numberingSystem?: string;
}

const TYPE_REGEX = /^[a-z0-9]{3,8}$/i;

const __INTERNAL_SLOT_MAP__ = new WeakMap<
  DateTimeFormat,
  IntlDateTimeFormatInternal
>();

/**
 * https://tc39.es/ecma402/#sec-isvalidtimezonename
 * @param tz
 */
function isValidTimeZoneName(tz: string): boolean {
  const uppercasedTz = tz.toUpperCase();
  return uppercasedTz in UPPERCASED_ZONES || uppercasedTz in UPPERCASED_LINKS;
}

/**
 * https://tc39.es/ecma402/#sec-canonicalizetimezonename
 * @param tz
 */
function canonicalizeTimeZoneName(tz: string) {
  const uppercasedTz = tz.toUpperCase();
  const ianaTimeZone =
    UPPERCASED_LINKS[uppercasedTz] || UPPERCASED_ZONES[uppercasedTz];
  if (ianaTimeZone === 'Etc/UTC' || ianaTimeZone === 'Etc/GMT') {
    return 'UTC';
  }
  return ianaTimeZone;
}

/**
 * https://tc39.es/ecma262/#sec-tonumber
 * @param val
 */
function toNumber(val: any): number {
  if (val === undefined) {
    return NaN;
  }
  if (val === null) {
    return +0;
  }
  if (typeof val === 'boolean') {
    return val ? 1 : +0;
  }
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'symbol' || typeof val === 'bigint') {
    throw new TypeError('Cannot convert symbol/bigint to number');
  }
  return Number(val);
}

/**
 * https://tc39.es/ecma262/#sec-tointeger
 * @param n
 */
function toInteger(n: any) {
  const number = toNumber(n);
  if (isNaN(number) || objectIs(number, -0)) {
    return 0;
  }
  if (isFinite(number)) {
    return number;
  }
  let integer = Math.floor(Math.abs(number));
  if (number < 0) {
    integer = -integer;
  }
  if (objectIs(integer, -0)) {
    return 0;
  }
  return integer;
}

/**
 * https://tc39.es/ecma262/#sec-timeclip
 * @param time
 */
function timeClip(time: number) {
  if (!isFinite(time)) {
    return NaN;
  }
  if (Math.abs(time) > 8.64 * 1e16) {
    return NaN;
  }
  return toInteger(time);
}

/**
 * https://tc39.es/ecma402/#sec-initializedatetimeformat
 * @param dtf DateTimeFormat
 * @param locales locales
 * @param opts options
 */
function initializeDateTimeFormat(
  dtf: DateTimeFormat,
  locales?: string | string[],
  opts?: DateTimeFormatOptions
) {
  // @ts-ignore
  const requestedLocales: string[] = Intl.getCanonicalLocales(locales);
  const options = toDateTimeOptions(opts, 'any', 'date');
  let opt = Object.create(null);
  let matcher = getOption(
    options,
    'localeMatcher',
    'string',
    ['lookup', 'best fit'],
    'best fit'
  );
  opt.localeMatcher = matcher;
  const calendar = getOption(
    options,
    'calendar',
    'string',
    undefined,
    undefined
  );
  if (calendar !== undefined && !TYPE_REGEX.test(calendar)) {
    throw new RangeError('Malformed calendar');
  }
  opt.ca = calendar;
  const numberingSystem = getOption(
    options,
    'numberingSystem',
    'string',
    undefined,
    undefined
  );
  if (numberingSystem !== undefined && !TYPE_REGEX.test(numberingSystem)) {
    throw new RangeError('Malformed numbering system');
  }
  opt.nu = numberingSystem;
  const hour12 = getOption(options, 'hour12', 'boolean', undefined, undefined);
  let hourCycle = getOption(
    options,
    'hourCycle',
    'string',
    ['h11', 'h12', 'h23', 'h24'],
    undefined
  );
  if (hour12 !== undefined) {
    hourCycle = null;
  }
  opt.hc = hourCycle;
  const r = createResolveLocale(DateTimeFormat.getDefaultLocale)(
    DateTimeFormat.availableLocales,
    requestedLocales,
    opt,
    // [[RelevantExtensionKeys]] slot, which is a constant
    ['nu', 'ca', 'hc'],
    DateTimeFormat.localeData
  );
  setInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'locale', r.locale);
  setInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'calendar', calendar);
  setInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'hourCycle', r.hc);
  setInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'numberingSystem', r.nu);
  const {dataLocale} = r;
  let {timeZone} = options;
  if (timeZone !== undefined) {
    timeZone = String(timeZone);
    if (!isValidTimeZoneName(timeZone)) {
      throw new RangeError('Invalid timeZoneName');
    }
    timeZone = canonicalizeTimeZoneName(timeZone);
  } else {
    timeZone = DateTimeFormat.__defaultLocale;
  }
  setInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'timeZone', timeZone);
  opt = Object.create(null);
  opt.weekday = getOption(
    options,
    'weekday',
    'string',
    ['narrow', 'short', 'long'],
    undefined
  );
  opt.era = getOption(
    options,
    'era',
    'string',
    ['narrow', 'short', 'long'],
    undefined
  );
  opt.year = getOption(
    options,
    'year',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.month = getOption(
    options,
    'month',
    'string',
    ['2-digit', 'numeric', 'narrow', 'short', 'long'],
    undefined
  );
  opt.day = getOption(
    options,
    'day',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.hour = getOption(
    options,
    'hour',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.minute = getOption(
    options,
    'minute',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.second = getOption(
    options,
    'second',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.timeZoneName = getOption(
    options,
    'timeZoneName',
    'string',
    ['short', 'long'],
    undefined
  );

  const dataLocaleData = DateTimeFormat.localeData[dataLocale];
  const formats = dataLocaleData.formats[calendar];
  matcher = getOption(
    options,
    'formatMatcher',
    'string',
    ['basic', 'best fit'],
    'best fit'
  );
  let bestFormat;
  if (matcher === 'basic') {
    bestFormat = basicFormatMatcher(opt, formats);
  } else {
    bestFormat = bestFitFormatMatcher(opt, formats);
  }
  for (const prop in opt) {
    const p = bestFormat[prop];
    if (p !== undefined) {
      setInternalSlot(__INTERNAL_SLOT_MAP__, dtf, prop as 'year', p);
    }
  }
  let pattern;
  if (getInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'hour') !== undefined) {
    const hcDefault = dataLocaleData.hourCycle;
    let hc = getInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'hourCycle');
    if (hc == null) {
      hc = hcDefault;
    }
    if (hour12 !== undefined) {
      if (hour12) {
        if (hcDefault === 'h11' || hcDefault === 'h23') {
          hc = 'h11';
        } else {
          hc = 'h12';
        }
      } else {
        invariant(!hour12, 'hour12 must not be set');
        if (hcDefault === 'h11' || hcDefault === 'h23') {
          hc = 'h23';
        } else {
          hc = 'h24';
        }
      }
    }
    setInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'hourCycle', hc);

    if (hc === 'h11' || hc === 'h12') {
      pattern = bestFormat.pattern12;
    } else {
      pattern = bestFormat.pattern;
    }
  } else {
    setInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'hourCycle', undefined);
    pattern = bestFormat.pattern;
  }
  setInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'pattern', pattern);
  return dtf;
}

/**
 * https://tc39.es/ecma402/#sec-todatetimeoptions
 * @param options
 * @param required
 * @param defaults
 */
function toDateTimeOptions(
  options?: DateTimeFormatOptions | null,
  required?: string,
  defaults?: string
): DateTimeFormatOptions {
  if (options === undefined) {
    options = null;
  } else {
    options = toObject(options);
  }
  options = Object.create(options) as DateTimeFormatOptions;
  let needDefaults = true;
  if (required === 'date' || required === 'any') {
    for (const prop of ['weekday', 'year', 'month', 'day'] as Array<
      keyof Pick<DateTimeFormatOptions, 'weekday' | 'year' | 'month' | 'day'>
    >) {
      const value = options[prop];
      if (value !== undefined) {
        needDefaults = false;
      }
    }
  }
  if (required === 'time' || required === 'any') {
    for (const prop of ['hour', 'minute', 'second'] as Array<
      keyof Pick<DateTimeFormatOptions, 'hour' | 'minute' | 'second'>
    >) {
      const value = options[prop];
      if (value !== undefined) {
        needDefaults = false;
      }
    }
  }
  if (needDefaults && (defaults === 'date' || defaults === 'all')) {
    for (const prop of ['year', 'month', 'day'] as Array<
      keyof Pick<DateTimeFormatOptions, 'year' | 'month' | 'day'>
    >) {
      options[prop] = 'numeric';
    }
  }
  if (needDefaults && (defaults === 'time' || defaults === 'all')) {
    for (const prop of ['hour', 'minute', 'second'] as Array<
      keyof Pick<DateTimeFormatOptions, 'hour' | 'minute' | 'second'>
    >) {
      options[prop] = 'numeric';
    }
  }
  return options;
}

/**
 * https://tc39.es/ecma402/#sec-basicformatmatcher
 * @param options
 * @param formats
 */
function basicFormatMatcher(options: DateTimeFormatOptions, formats: {}[]) {
  let removalPenalty = 120;
  let additionPenalty = 20;
  let longLessPenalty = 8;
  let longMorePenalty = 6;
  let shortLessPenalty = 6;
  let shortMorePenalty = 3;
  let bestScore = -Infinity;
  let bestFormat = undefined;
  invariant(Array.isArray(formats), 'formats should be a list of strings');
  for (const format of formats) {
    let score = 0;
    for (const prop of DATE_TIME_PROPS) {
      let optionsProp = options[prop];
      let formatProp = format[prop];
      if (optionsProp === undefined && formatProp !== undefined) {
        score -= additionPenalty;
      } else if (optionsProp !== undefined && formatProp === undefined) {
        score -= removalPenalty;
      } else if (optionsProp !== formatProp) {
        let values = ['2-digit', 'numeric', 'narrow', 'short', 'long'];
        let optionsPropIndex = values.indexOf(optionsProp);
        let formatPropIndex = values.indexOf(formatProp);
        let delta = Math.max(
          -2,
          Math.min(formatPropIndex - optionsPropIndex, 2)
        );
        if (delta === 2) {
          score -= longMorePenalty;
        } else if (delta === 1) {
          score -= shortMorePenalty;
        } else if (delta === -1) {
          score -= shortLessPenalty;
        } else if (delta === -2) {
          score -= longLessPenalty;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestFormat = format;
    }
  }
  return bestFormat;
}

/**
 * https://tc39.es/ecma402/#sec-bestfitformatmatcher
 * Just alias to basic for now
 * @param options
 * @param formats
 */
function bestFitFormatMatcher(options: DateTimeFormatOptions, formats: {}[]) {
  return basicFormatMatcher(options, formats);
}

const formatDescriptor = {
  enumerable: false,
  configurable: true,
  get() {
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
        return formatDateTime(dtf, x);
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

/**
 * https://tc39.es/ecma402/#sec-partitiondatetimepattern
 * @param dtf
 * @param x
 */
function partitionDateTimePattern(dtf: DateTimeFormat, x: number) {
  x = timeClip(x);
  if (isNaN(x)) {
    throw new RangeError('invalid time');
  }
  let locale = getInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'locale');
  let nfOptions = Object.create(null);
  nfOptions.useGrouping = false;
  // TODO
  let nf = new Intl.NumberFormat(locale, nfOptions);
  let nf2Options = Object.create(null);
  nf2Options.minimumIntegerDigits = 2;
  nf2Options.useGrouping = false;
  let nf2 = new Intl.NumberFormat(locale, nf2Options);
  let tm = toLocalTime(
    x,
    getInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'calendar'),
    getInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'timeZone')
  );
  let result = [];
  let patternParts = partitionPattern(
    getInternalSlot(__INTERNAL_SLOT_MAP__, dtf, 'pattern')
  );
  for (const patternPart of patternParts) {
    let p = patternPart.type;
    if (p === 'literal') {
      result.push({
        type: 'literal',
        value: patternPart.value,
      });
    } else if (DATE_TIME_PROPS.indexOf(p) > -1) {
      let f = getInternalSlot(__INTERNAL_SLOT_MAP__, dtf, p);
      // TODO
      let v = tm[f];
      if (p === 'year' && v <= 0) {
        v = 1 - v;
      }
      if (p === 'month') {
        v++;
      }
      const hourCycle = getInternalSlot(
        __INTERNAL_SLOT_MAP__,
        dtf,
        'hourCycle'
      );
      if (p === 'hour' && (hourCycle === 'h11' || hourCycle === 'h12')) {
        v = v % 12;
        if (v === 0 && hourCycle === 'h12') {
          v = 12;
        }
      }
      if (p === 'hour' && hourCycle === 'h24') {
        if (v === 0) {
          v = 24;
        }
      }
      let fv;
      if (f === 'numeric') {
        fv = nf.format(v);
      } else if (f === '2-digit') {
        fv = nf2.format(v);
        if (fv.length > 2) {
          fv = fv.slice(fv.length - 2, fv.length);
        }
      } else if (f === 'narrow' || f === 'short' || f === 'long') {
        // TODO
      }
      result.push({
        type: p,
        value: fv,
      });
    } else if (p === 'ampm') {
      let v = tm.hour;
      let fv;
      if (v >= 11) {
        //TODO
      } else {
        // TODO
      }
      result.push({
        type: 'dayPeriod',
        value: fv,
      });
    } else if (p === 'relatedYear') {
      let v = tm.relatedYear;
      let fv = nf.format(v);
      result.push({
        type: 'relatedYear',
        value: fv,
      });
    } else if (p === 'yearName') {
      let v = tm.yearName;
      let fv = nf.format(v);
      result.push({
        type: 'yearName',
        value: fv,
      });
    } else {
      result.push({
        type: 'unknown',
        value: x,
      });
    }
  }
  return result;
}

/**
 * https://tc39.es/ecma402/#sec-formatdatetime
 * @param dtf DateTimeFormat
 * @param x
 */
function formatDateTime(dtf: DateTimeFormat, x: number) {
  const parts = partitionDateTimePattern(dtf, x);
  let result = '';
  for (const part of parts) {
    result += part.value;
  }
  return result;
}

/**
 * https://tc39.es/ecma402/#sec-formatdatetimetoparts
 * @param dtf DateTimeFormat
 * @param x
 */
function formatDateTimeParts(dtf: DateTimeFormat, x: number) {
  return partitionDateTimePattern(dtf, x);
}

/**
 * https://tc39.es/ecma262/#sec-local-time-zone-adjustment
 * @param t
 * @param isUTC
 * @param timeZone
 */
function localTZA(t: number, isUTC: boolean, timeZone: string) {
  invariant(isUTC, 'We only support UTC time for localTZA');
}

const MS_PER_DAY = 86400000;

/**
 * https://tc39.es/ecma262/#eqn-Day
 * @param t
 */
function day(t: number) {
  return Math.floor(t / MS_PER_DAY);
}

/**
 * https://tc39.es/ecma262/#sec-week-day
 * @param t
 */
function weekDay(t: number) {
  return (day(t) + 4) % 7;
}

function dayFromYear(y: number) {
  return (
    365 * (y - 1970) +
    Math.floor((y - 1969) / 4) -
    Math.floor((y - 1901) / 100) +
    Math.floor((y - 1601) / 400)
  );
}

function timeFromYear(y: number) {
  return MS_PER_DAY * dayFromYear(y);
}

function yearFromTime(t: number) {
  const min = Math.ceil(t / MS_PER_DAY / 366);
  let y = min;
  while (timeFromYear(y) <= t) {
    y++;
  }
  return y - 1;
}

function daysInYear(y: number) {
  if (y % 4 !== 0) {
    return 365;
  }
  if (y % 100 !== 0) {
    return 366;
  }
  if (y % 400 !== 0) {
    return 365;
  }
  return 366;
}

function dayWithinYear(t: number) {
  return day(t) - dayFromYear(yearFromTime(t));
}

function inLeapYear(t: number): 0 | 1 {
  return daysInYear(yearFromTime(t)) === 365 ? 0 : 1;
}

function monthFromTime(t: number) {
  const dwy = dayWithinYear(t);
  const leap = inLeapYear(t);
  if (dwy >= 0 && dwy < 31) {
    return 0;
  }
  if (dwy < 59 + leap) {
    return 1;
  }
  if (dwy < 90 + leap) {
    return 2;
  }
  if (dwy < 120 + leap) {
    return 3;
  }
  if (dwy < 151 + leap) {
    return 4;
  }
  if (dwy < 181 + leap) {
    return 5;
  }
  if (dwy < 212 + leap) {
    return 6;
  }
  if (dwy < 243 + leap) {
    return 7;
  }
  if (dwy < 273 + leap) {
    return 8;
  }
  if (dwy < 304 + leap) {
    return 9;
  }
  if (dwy < 334 + leap) {
    return 10;
  }
  if (dwy < 365 + leap) {
    return 11;
  }
}

function dateFromTime(t: number) {
  const dwy = dayWithinYear(t);
  const mft = monthFromTime(t);
  const leap = inLeapYear(t);
  if (mft === 0) {
    return dwy + 1;
  }
  if (mft === 1) {
    return dwy - 30;
  }
  if (mft === 2) {
    return dwy - 58 - leap;
  }
  if (mft === 3) {
    return dwy - 89 - leap;
  }
  if (mft === 4) {
    return dwy - 119 - leap;
  }
  if (mft === 5) {
    return dwy - 150 - leap;
  }
  if (mft === 6) {
    return dwy - 180 - leap;
  }
  if (mft === 7) {
    return dwy - 211 - leap;
  }
  if (mft === 8) {
    return dwy - 242 - leap;
  }
  if (mft === 9) {
    return dwy - 272 - leap;
  }
  if (mft === 10) {
    return dwy - 303 - leap;
  }
  if (mft === 11) {
    return dwy - 333 - leap;
  }
}

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1e3;
const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;

function hourFromTime(t: number) {
  return Math.floor(t / MS_PER_HOUR) % HOURS_PER_DAY;
}

function minFromTime(t: number) {
  return Math.floor(t / MS_PER_MINUTE) % MINUTES_PER_HOUR;
}

function secFromTime(t: number) {
  return Math.floor(t / MS_PER_SECOND) % SECONDS_PER_MINUTE;
}

function toLocalTime(t: number, calendar: string, timeZone: string) {
  invariant(typeof t === 'number', 'invalid time');
  invariant(
    calendar === 'gregory',
    'We only support Gregory calendar right now'
  );
  let timeZoneOffset = localTZA(t, true, timeZone);
  let tz = t + timeZoneOffset;
  const year = yearFromTime(tz);
  return {
    weekday: weekDay(tz),
    era: year < 0 ? 'BC' : 'AD',
    year,
    relatedYear: undefined,
    yearName: undefined,
    month: monthFromTime(t),
    day: dateFromTime(t),
    hour: hourFromTime(t),
    minute: minFromTime(t),
    second: secFromTime(t),
    inDST: false,
  };
}

export interface DateTimeFormatConstructor {
  new (
    locales?: string | string[],
    options?: DateTimeFormatOptions
  ): DateTimeFormat;
  (
    locales?: string | string[],
    options?: DateTimeFormatOptions
  ): DateTimeFormat;

  __addLocaleData(...data: RawDateTimeLocaleData[]): void;
  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<DateTimeFormatOptions, 'localeMatcher'>
  ): string[];
  getDefaultLocale(): string;

  __defaultLocale: string;
  __defaultTimeZone: string;
  localeData: Record<string, DateTimeFormatLocaleInternalData>;
  availableLocales: string[];
  polyfilled: boolean;
}

export interface DateTimeFormat {
  resolvedOptions(): ResolvedDateTimeFormatOptions;
  formatToParts(x: number): DateTimeFormatPart[];
  format(x: number): string;
}

export const DateTimeFormat = function (
  this: DateTimeFormat,
  locales?: string | string[],
  options?: DateTimeFormatOptions
) {
  // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
  if (!this || !(this instanceof DateTimeFormat)) {
    return new DateTimeFormat(locales, options);
  }

  initializeDateTimeFormat(this, locales, options);

  const internalSlots = getInternalSlots(this);

  const dataLocale = internalSlots.dataLocale;
  const dataLocaleData = DateTimeFormat.localeData[dataLocale];
  invariant(
    dataLocaleData !== undefined,
    `Cannot load locale-dependent data for ${dataLocale}.`
  );
} as DateTimeFormatConstructor;

// Static properties
defineProperty(DateTimeFormat, 'supportedLocalesOf', {
  value: function supportedLocalesOf(
    locales: string | string[],
    options?: Pick<DateTimeFormatOptions, 'localeMatcher'>
  ) {
    return supportedLocales(
      DateTimeFormat.availableLocales,
      ((Intl as any).getCanonicalLocales as typeof getCanonicalLocales)(
        locales
      ),
      options as any
    );
  },
});

defineProperty(DateTimeFormat.prototype, 'resolvedOptions', {
  value: function resolvedOptions() {
    if (typeof this !== 'object' || !(this instanceof DateTimeFormat)) {
      throw TypeError(
        'Method Intl.DateTimeFormat.prototype.resolvedOptions called on incompatible receiver'
      );
    }
    const internalSlots = getInternalSlots(this);
    const ro: Record<string, unknown> = {};
    for (const key of RESOLVED_OPTIONS_KEYS) {
      const value = internalSlots[key];
      if (value !== undefined) {
        ro[key] = value;
      }
    }
    return ro as any;
  },
});

defineProperty(DateTimeFormat.prototype, 'formatToParts', {
  value: function formatToParts(x: number) {
    return formatDateTimeParts(this, x);
  },
});

Object.defineProperty(DateTimeFormat.prototype, 'format', formatDescriptor);

DateTimeFormat.__defaultLocale = 'en';
DateTimeFormat.localeData = {};
DateTimeFormat.availableLocales = [];
DateTimeFormat.getDefaultLocale = () => {
  return DateTimeFormat.__defaultLocale;
};
DateTimeFormat.polyfilled = true;

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
