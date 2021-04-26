/**
 * https://tc39.es/ecma402/#sec-getnumberoption
 * @param options
 * @param property
 * @param min
 * @param max
 * @param fallback
 */

import {DefaultNumberOption} from './DefaultNumberOption'

export function GetNumberOption<T extends object, K extends keyof T>(
  options: T,
  property: K,
  minimum: number,
  maximum: number,
  fallback: number
): number
export function GetNumberOption<T extends object, K extends keyof T>(
  options: T,
  property: K,
  minimum: number,
  maximum: number,
  fallback: number | undefined
): number | undefined {
  const val = options[property]
  // @ts-expect-error
  return DefaultNumberOption(val, minimum, maximum, fallback)
}
