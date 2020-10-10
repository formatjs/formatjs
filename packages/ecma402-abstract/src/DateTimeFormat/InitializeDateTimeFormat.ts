import {
  DateTimeFormatOptions,
  Formats,
  IntlDateTimeFormatInternal,
  DateTimeFormatLocaleInternalData,
} from '../../types/date-time';
import {CanonicalizeLocaleList} from '../CanonicalizeLocaleList';
import {ToDateTimeOptions} from './ToDateTimeOptions';
import {GetOption} from '../GetOption';
import {ResolveLocale} from '../ResolveLocale';
import {IsValidTimeZoneName} from '../IsValidTimeZoneName';
import {CanonicalizeTimeZoneName} from '../CanonicalizeTimeZoneName';
import {BasicFormatMatcher} from './BasicFormatMatcher';
import {BestFitFormatMatcher} from './BestFitFormatMatcher';
import {invariant} from '../utils';
import {DATE_TIME_PROPS} from './utils';
import {DateTimeStyleFormat} from './DateTimeStyleFormat';

function isTimeRelated(opt: Opt) {
  for (const prop of ['hour', 'minute', 'second'] as Array<
    keyof Pick<Opt, 'hour' | 'minute' | 'second'>
  >) {
    const value = opt[prop];
    if (value !== undefined) {
      return true;
    }
  }
  return false;
}

interface Opt extends Omit<Formats, 'pattern' | 'pattern12'> {
  localeMatcher: string;
  ca: DateTimeFormatOptions['calendar'];
  nu: DateTimeFormatOptions['numberingSystem'];
  hc: DateTimeFormatOptions['hourCycle'];
}
const TYPE_REGEX = /^[a-z0-9]{3,8}$/i;
/**
 * https://tc39.es/ecma402/#sec-initializedatetimeformat
 * @param dtf DateTimeFormat
 * @param locales locales
 * @param opts options
 */
export function InitializeDateTimeFormat(
  dtf: Intl.DateTimeFormat,
  locales: string | string[] | undefined,
  opts: DateTimeFormatOptions | undefined,
  {
    getInternalSlots,
    availableLocales,
    localeData,
    getDefaultLocale,
    getDefaultTimeZone,
    relevantExtensionKeys,
    tzData,
    uppercaseLinks,
  }: {
    getInternalSlots(dtf: Intl.DateTimeFormat): IntlDateTimeFormatInternal;
    availableLocales: string[];
    getDefaultLocale(): string;
    getDefaultTimeZone(): string;
    relevantExtensionKeys: string[];
    localeData: Record<string, DateTimeFormatLocaleInternalData | undefined>;
    tzData: Record<string, unknown>;
    uppercaseLinks: Record<string, string>;
  }
): Intl.DateTimeFormat {
  // @ts-ignore
  const requestedLocales: string[] = CanonicalizeLocaleList(locales);
  const options = ToDateTimeOptions(opts, 'any', 'date');
  let opt: Opt = Object.create(null);
  let matcher = GetOption(
    options,
    'localeMatcher',
    'string',
    ['lookup', 'best fit'],
    'best fit'
  );
  opt.localeMatcher = matcher;
  let calendar = GetOption(options, 'calendar', 'string', undefined, undefined);
  if (calendar !== undefined && !TYPE_REGEX.test(calendar)) {
    throw new RangeError('Malformed calendar');
  }
  const internalSlots = getInternalSlots(dtf);
  opt.ca = calendar;
  const numberingSystem = GetOption(
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
  const hour12 = GetOption(options, 'hour12', 'boolean', undefined, undefined);
  let hourCycle = GetOption(
    options,
    'hourCycle',
    'string',
    ['h11', 'h12', 'h23', 'h24'],
    undefined
  );
  if (hour12 !== undefined) {
    // @ts-ignore
    hourCycle = null;
  }
  opt.hc = hourCycle;
  const r = ResolveLocale(
    availableLocales,
    requestedLocales,
    opt as any,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale
  );
  internalSlots.locale = r.locale;
  calendar = r.ca;
  internalSlots.calendar = calendar;
  internalSlots.hourCycle = r.hc;
  internalSlots.numberingSystem = r.nu;
  const {dataLocale} = r;
  internalSlots.dataLocale = dataLocale;
  let {timeZone} = options;
  if (timeZone !== undefined) {
    timeZone = String(timeZone);
    if (!IsValidTimeZoneName(timeZone, {tzData, uppercaseLinks})) {
      throw new RangeError('Invalid timeZoneName');
    }
    timeZone = CanonicalizeTimeZoneName(timeZone, {tzData, uppercaseLinks});
  } else {
    timeZone = getDefaultTimeZone();
  }
  internalSlots.timeZone = timeZone;

  opt = Object.create(null);
  opt.weekday = GetOption(
    options,
    'weekday',
    'string',
    ['narrow', 'short', 'long'],
    undefined
  );
  opt.era = GetOption(
    options,
    'era',
    'string',
    ['narrow', 'short', 'long'],
    undefined
  );
  opt.year = GetOption(
    options,
    'year',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.month = GetOption(
    options,
    'month',
    'string',
    ['2-digit', 'numeric', 'narrow', 'short', 'long'],
    undefined
  );
  opt.day = GetOption(
    options,
    'day',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.hour = GetOption(
    options,
    'hour',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.minute = GetOption(
    options,
    'minute',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.second = GetOption(
    options,
    'second',
    'string',
    ['2-digit', 'numeric'],
    undefined
  );
  opt.timeZoneName = GetOption(
    options,
    'timeZoneName',
    'string',
    ['short', 'long'],
    undefined
  );

  const dataLocaleData = localeData[dataLocale];
  invariant(!!dataLocaleData, `Missing locale data for ${dataLocale}`);
  const formats = dataLocaleData.formats[calendar as string];
  // UNSPECCED: IMPLEMENTATION DETAILS
  if (!formats) {
    throw new RangeError(
      `Calendar "${calendar}" is not supported. Try setting "calendar" to 1 of the following: ${Object.keys(
        dataLocaleData.formats
      ).join(', ')}`
    );
  }
  matcher = GetOption(
    options,
    'formatMatcher',
    'string',
    ['basic', 'best fit'],
    'best fit'
  );
  const dateStyle = GetOption(
    options,
    'dateStyle',
    'string',
    ['full', 'long', 'medium', 'short'],
    undefined
  );
  internalSlots.dateStyle = dateStyle;
  const timeStyle = GetOption(
    options,
    'timeStyle',
    'string',
    ['full', 'long', 'medium', 'short'],
    undefined
  );
  internalSlots.timeStyle = timeStyle;

  let bestFormat;
  if (dateStyle === undefined && timeStyle === undefined) {
    if (matcher === 'basic') {
      bestFormat = BasicFormatMatcher(opt, formats);
    } else {
      if (isTimeRelated(opt)) {
        opt.hour12 =
          internalSlots.hourCycle === 'h11' ||
          internalSlots.hourCycle === 'h12';
      }
      bestFormat = BestFitFormatMatcher(opt, formats);
    }
  } else {
    for (const prop of DATE_TIME_PROPS) {
      const p = opt[prop];
      if (p !== undefined) {
        throw new TypeError(
          `Intl.DateTimeFormat can't set option ${prop} when ${
            dateStyle ? 'dateStyle' : 'timeStyle'
          } is used`
        );
      }
    }
    bestFormat = DateTimeStyleFormat(dateStyle, timeStyle, dataLocaleData);
  }
  for (const prop in opt) {
    const p = bestFormat[prop as 'era'];
    if (p !== undefined) {
      internalSlots[prop as 'year'] = p as 'numeric';
    }
  }
  let pattern;
  if (internalSlots.hour !== undefined) {
    const hcDefault = dataLocaleData.hourCycle;
    let hc = internalSlots.hourCycle;
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
    internalSlots.hourCycle = hc;

    if (hc === 'h11' || hc === 'h12') {
      pattern = bestFormat.pattern12;
    } else {
      pattern = bestFormat.pattern;
    }
  } else {
    // @ts-ignore
    internalSlots.hourCycle = undefined;
    pattern = bestFormat.pattern;
  }
  internalSlots.pattern = pattern;
  return dtf;
}
