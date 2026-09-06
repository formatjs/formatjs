/**
 * ECMA-402 §9.2.13 DefaultNumberOption, step 2.
 * https://tc39.es/ecma402/#sec-defaultnumberoption
 * https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L437
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
  // ECMA-402 §9.2.13 DefaultNumberOption, step 2.
  // https://tc39.es/ecma402/#sec-defaultnumberoption
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L437
  const val = +(inputVal as any)
  if (isNaN(val) || val < min || val > max) {
    throw new RangeError(`${val} is outside of range [${min}, ${max}]`)
  }
  return Math.floor(val)
}
