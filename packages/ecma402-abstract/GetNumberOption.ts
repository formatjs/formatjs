/**
 * https://tc39.es/ecma402/#sec-getnumberoption
 * @param options
 * @param property
 * @param min
 * @param max
 * @param fallback
 */

import {DefaultNumberOption} from './DefaultNumberOption.js'

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
