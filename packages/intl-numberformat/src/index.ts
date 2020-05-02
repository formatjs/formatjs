/* eslint-disable import/no-cycle */
export * from './core';
export * from './to_locale_string';
export {NumberFormatOptions} from './types';

/**
 * Check if a formatting number with unit is supported
 * @public
 * @param unit unit to check
 */
export function isUnitSupported(unit: string) {
  try {
    new Intl.NumberFormat(undefined, {
      style: 'unit',
      // @ts-ignore
      unit,
    });
  } catch (e) {
    return false;
  }
  return true;
}
