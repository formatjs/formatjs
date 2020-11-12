/**
 * https://tc39.es/ecma402/#sec-defaultnumberoption
 * @param val
 * @param min
 * @param max
 * @param fallback
 */
export function DefaultNumberOption(
  val: any,
  min: number,
  max: number,
  fallback: number
) {
  if (val !== undefined) {
    val = Number(val);
    if (isNaN(val) || val < min || val > max) {
      throw new RangeError(`${val} is outside of range [${min}, ${max}]`);
    }
    return Math.floor(val);
  }
  return fallback;
}
