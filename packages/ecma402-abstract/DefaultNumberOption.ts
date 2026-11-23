import {
  RangeErrorConstructor,
  floor,
  numberIsFinite,
} from '#packages/ecma262-abstract/intrinsics.js'

// ECMA-402 §9.2.13 steps 1–4 coerce, check the range, then truncate.
// https://tc39.es/ecma402/#sec-defaultnumberoption
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
  // Step 2 uses ToNumber, which rejects BigInt after coercion.
  // https://tc39.es/ecma262/#sec-tonumber
  const val = +(inputVal as any)
  if (!numberIsFinite(val) || val < min || val > max) {
    throw new RangeErrorConstructor(
      `${val} is outside of range [${min}, ${max}]`
    )
  }
  // Step 4 truncates a mathematical value. Both Number zeros map to 0.
  // https://tc39.es/ecma262/#sec-mathematical-operations
  return val === 0 ? 0 : floor(val)
}
