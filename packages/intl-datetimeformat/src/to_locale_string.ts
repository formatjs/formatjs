// eslint-disable-next-line import/no-cycle
import {DateTimeFormat} from './core';
import {DateTimeFormatOptions} from './types';

/**
 * Number.prototype.toLocaleString ponyfill
 * https://tc39.es/ecma402/#sup-number.prototype.tolocalestring
 */
export function toLocaleString(
  x?: Date | number,
  locales?: string | string[],
  options?: DateTimeFormatOptions
): string {
  const numberFormat = new DateTimeFormat(locales, options);
  return numberFormat.format(x);
}
