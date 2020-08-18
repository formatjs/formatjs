/**
 * Check if a formatting number with unit is supported
 * @public
 * @param unit unit to check
 */
function isUnitSupported(unit: string) {
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

export function shouldPolyfill() {
  return (
    typeof Intl === 'undefined' ||
    !('NumberFormat' in Intl) ||
    !isUnitSupported('bit')
  );
}
