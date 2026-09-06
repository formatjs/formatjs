/**
 * https://tc39.es/ecma402/#sec-defaultnumberoption
 * @param val
 * @param min
 * @param max
 * @param fallback
 */
export function DefaultNumberOption<F extends number | undefined>(
  inputVal: unknown,
  min: number,
  max: number,
  fallback: F
): F extends number ? number : number | undefined {
  if (inputVal === undefined) {
    // @ts-expect-error
    return fallback
  }
  // DefaultNumberOption uses ToNumber, which rejects BigInt even after coercion.
  // https://tc39.es/ecma402/#sec-defaultnumberoption
  const val = +(inputVal as any)
  if (isNaN(val) || val < min || val > max) {
    throw new RangeError(`${val} is outside of range [${min}, ${max}]`)
  }
  return Math.floor(val)
}
