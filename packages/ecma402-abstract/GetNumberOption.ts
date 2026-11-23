import {DefaultNumberOption} from '#packages/ecma402-abstract/DefaultNumberOption.js'

// ECMA-402 §9.2.14 steps 1–2 read the option once before coercing it.
// https://tc39.es/ecma402/#sec-getnumberoption
export function GetNumberOption<
  T extends object,
  K extends keyof T,
  F extends number | undefined,
>(
  options: T,
  property: K,
  minimum: number,
  maximum: number,
  fallback: F
): F extends number ? number : number | undefined {
  const val = options[property]
  return DefaultNumberOption(val, minimum, maximum, fallback)
}
