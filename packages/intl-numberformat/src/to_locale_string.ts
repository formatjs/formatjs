// eslint-disable-next-line import/no-cycle
import {NumberFormat} from './core';
import {NumberFormatOptions} from './types';

/**
 * Number.prototype.toLocaleString ponyfill
 * https://tc39.es/ecma402/#sup-number.prototype.tolocalestring
 */
export function toLocaleString(
  x: number,
  locales?: string | string[],
  options?: NumberFormatOptions
): string {
  const numberFormat = new NumberFormat(locales, options);
  return numberFormat.format(x);
}
