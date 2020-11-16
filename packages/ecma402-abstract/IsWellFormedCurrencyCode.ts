/**
 * This follows https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
 * @param str string to convert
 */
function toUpperCase(str: string): string {
  return str.replace(/([a-z])/g, (_, c) => c.toUpperCase());
}

const NOT_A_Z_REGEX = /[^A-Z]/;

/**
 * https://tc39.es/ecma402/#sec-iswellformedcurrencycode
 */
export function IsWellFormedCurrencyCode(currency: string): boolean {
  currency = toUpperCase(currency);
  if (currency.length !== 3) {
    return false;
  }
  if (NOT_A_Z_REGEX.test(currency)) {
    return false;
  }
  return true;
}
