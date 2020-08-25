import {
  IntlDateTimeFormatInternal,
  DateTimeFormatLocaleInternalData,
  UnpackedZoneData,
} from '../../types/date-time';
import {TimeClip} from '../../262';
import {PartitionPattern} from '../PartitionPattern';
import {DATE_TIME_PROPS} from './utils';
import {ToLocalTime} from './ToLocalTime';

function pad(n: number): string {
  if (n < 10) {
    return `0${n}`;
  }
  return String(n);
}

function offsetToGmtString(
  gmtFormat: string,
  hourFormat: string,
  offsetInMs: number,
  style: 'long' | 'short'
) {
  const offsetInMinutes = Math.floor(offsetInMs / 60000);
  const mins = Math.abs(offsetInMinutes) % 60;
  const hours = Math.floor(Math.abs(offsetInMinutes) / 60);
  const [positivePattern, negativePattern] = hourFormat.split(';');

  let offsetStr = '';
  let pattern = offsetInMs < 0 ? negativePattern : positivePattern;
  if (style === 'long') {
    offsetStr = pattern
      .replace('HH', pad(hours))
      .replace('H', String(hours))
      .replace('mm', pad(mins))
      .replace('m', String(mins));
  } else if (mins || hours) {
    if (!mins) {
      pattern = pattern.replace(/:?m+/, '');
    }
    offsetStr = pattern
      .replace(/H+/, String(hours))
      .replace(/m+/, String(mins));
  }

  return gmtFormat.replace('{0}', offsetStr);
}

/**
 * https://tc39.es/ecma402/#sec-partitiondatetimepattern
 * @param dtf
 * @param x
 */
export function PartitionDateTimePattern(
  dtf: Intl.DateTimeFormat,
  x: number,
  {
    getInternalSlots,
    localeData,
    getDefaultTimeZone,
    tzData,
  }: {
    getInternalSlots(dtf: Intl.DateTimeFormat): IntlDateTimeFormatInternal;
    localeData: Record<string, DateTimeFormatLocaleInternalData>;
    getDefaultTimeZone(): string;
    tzData: Record<string, UnpackedZoneData[]>;
  }
): Intl.DateTimeFormatPart[] {
  x = TimeClip(x);
  if (isNaN(x)) {
    throw new RangeError('invalid time');
  }

  /** IMPL START */
  const internalSlots = getInternalSlots(dtf);
  const dataLocale = internalSlots.dataLocale;
  const dataLocaleData = localeData[dataLocale];
  /** IMPL END */

  const locale = internalSlots.locale;
  const nfOptions = Object.create(null);
  nfOptions.useGrouping = false;

  const nf = new Intl.NumberFormat(locale, nfOptions);
  const nf2Options = Object.create(null);
  nf2Options.minimumIntegerDigits = 2;
  nf2Options.useGrouping = false;
  const nf2 = new Intl.NumberFormat(locale, nf2Options);
  const tm = ToLocalTime(
    x,
    // @ts-ignore
    internalSlots.calendar,
    internalSlots.timeZone,
    {tzData}
  );
  const result: Intl.DateTimeFormatPart[] = [];
  const patternParts = PartitionPattern(internalSlots.pattern);
  for (const patternPart of patternParts) {
    const p = patternPart.type;
    if (p === 'literal') {
      result.push({
        type: 'literal',
        value: patternPart.value!,
      });
    } else if (DATE_TIME_PROPS.indexOf(p as 'era') > -1) {
      let fv = '';
      const f = internalSlots[p as 'year'] as
        | 'numeric'
        | '2-digit'
        | 'narrow'
        | 'long'
        | 'short';
      // @ts-ignore
      let v = tm[p];
      if (p === 'year' && v <= 0) {
        v = 1 - v;
      }
      if (p === 'month') {
        v++;
      }
      const hourCycle = internalSlots.hourCycle;
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
      if (f === 'numeric') {
        fv = nf.format(v);
      } else if (f === '2-digit') {
        fv = nf2.format(v);
        if (fv.length > 2) {
          fv = fv.slice(fv.length - 2, fv.length);
        }
      } else if (f === 'narrow' || f === 'short' || f === 'long') {
        if (p === 'era') {
          fv = dataLocaleData[p][f][v as 'BC'];
        } else if (p === 'timeZoneName') {
          const {timeZoneName, gmtFormat, hourFormat} = dataLocaleData;
          const timeZone = internalSlots.timeZone || getDefaultTimeZone();
          const timeZoneData = timeZoneName[timeZone];
          if (timeZoneData && timeZoneData[f as 'short']) {
            fv = timeZoneData[f as 'short']![+tm.inDST];
          } else {
            // Fallback to gmtFormat
            fv = offsetToGmtString(
              gmtFormat,
              hourFormat,
              tm.timeZoneOffset,
              f as 'long'
            );
          }
        } else if (p === 'month') {
          fv = dataLocaleData.month[f][v - 1];
        } else {
          fv = dataLocaleData[p as 'weekday'][f][v];
        }
      }
      result.push({
        type: p as Intl.DateTimeFormatPartTypes,
        value: fv,
      });
    } else if (p === 'ampm') {
      const v = tm.hour;
      let fv;
      if (v >= 11) {
        fv = dataLocaleData.pm;
      } else {
        fv = dataLocaleData.am;
      }
      result.push({
        type: 'dayPeriod',
        value: fv,
      });
    } else if (p === 'relatedYear') {
      const v = tm.relatedYear;
      // @ts-ignore
      const fv = nf.format(v);
      result.push({
        // @ts-ignore TODO: Fix TS type
        type: 'relatedYear',
        value: fv,
      });
    } else if (p === 'yearName') {
      const v = tm.yearName;
      // @ts-ignore
      const fv = nf.format(v);
      result.push({
        // @ts-ignore TODO: Fix TS type
        type: 'yearName',
        value: fv,
      });
    } else {
      result.push({
        // @ts-ignore TODO: Fix TS type
        type: 'unknown',
        value: String(x),
      });
    }
  }
  return result;
}
