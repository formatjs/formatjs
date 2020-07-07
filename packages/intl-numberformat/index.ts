/* eslint-disable import/no-cycle */
export * from './src/core';
export * from './src/to_locale_string';
export {NumberFormatOptions} from './src/types';

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
