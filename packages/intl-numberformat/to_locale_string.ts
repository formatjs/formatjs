// eslint-disable-next-line import/no-cycle
import {NumberFormat} from '#packages/intl-numberformat/core.js'
import {type NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'

/**
 * Number.prototype.toLocaleString and BigInt.prototype.toLocaleString ponyfill
 * https://tc39.es/ecma402/#sup-number.prototype.tolocalestring
 */
export function toLocaleString(
  x: number | bigint,
  locales?: string | string[],
  options?: NumberFormatOptions
): string {
  const numberFormat = new NumberFormat(locales, options)
  return numberFormat.format(x)
}
