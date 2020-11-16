// eslint-disable-next-line import/no-cycle
import {DateTimeFormat} from './core';
import {
  ToDateTimeOptions,
  DateTimeFormatOptions,
} from '@formatjs/ecma402-abstract';

/**
 * Number.prototype.toLocaleString ponyfill
 * https://tc39.es/ecma402/#sup-number.prototype.tolocalestring
 */
export function toLocaleString(
  x?: Date | number,
  locales?: string | string[],
  options?: DateTimeFormatOptions
): string {
  const dtf = new DateTimeFormat(locales, options);
  return dtf.format(x);
}

export function toLocaleDateString(
  x?: Date | number,
  locales?: string | string[],
  options?: DateTimeFormatOptions
): string {
  const dtf = new DateTimeFormat(
    locales,
    ToDateTimeOptions(options, 'date', 'date')
  );
  return dtf.format(x);
}

export function toLocaleTimeString(
  x?: Date | number,
  locales?: string | string[],
  options?: DateTimeFormatOptions
): string {
  const dtf = new DateTimeFormat(
    locales,
    ToDateTimeOptions(options, 'time', 'time')
  );
  return dtf.format(x);
}
