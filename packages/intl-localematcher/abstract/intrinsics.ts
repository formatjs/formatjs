// Keep locale matching independent of higher-layer abstract-operation packages.
const apply = Reflect.apply
const includes = Array.prototype.includes
const indexOf = Array.prototype.indexOf

export function arrayIncludes(
  values: readonly unknown[],
  search: unknown
): boolean {
  return apply(includes, values, [search])
}

export function arrayIndexOf(
  values: readonly unknown[],
  search: unknown
): number {
  return apply(indexOf, values, [search])
}

const find = Array.prototype.find

// ECMA-402 §9.2.7: private keyword Lists use the supplied Array algorithm.
export function arrayFind<T>(
  values: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => unknown
): T | undefined {
  return apply(find, values, [predicate])
}

const defineProperty = Object.defineProperty

// ECMA-262 §7.3.5: private List append creates an own data element.
export function setDataProperty(
  target: object,
  key: PropertyKey,
  value: unknown
): void {
  const descriptor = {
    __proto__: null,
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  }
  defineProperty(target, key, descriptor)
}

export const stringSlice = Function.prototype.call.bind(
  String.prototype.slice
) as (value: string, start: number, end?: number) => string

export const stringIndexOf = Function.prototype.call.bind(
  String.prototype.indexOf
) as (value: string, search: string, start?: number) => number

export const stringLastIndexOf = Function.prototype.call.bind(
  String.prototype.lastIndexOf
) as (value: string, search: string) => number

export const stringLowerCase = Function.prototype.call.bind(
  String.prototype.toLowerCase
) as (value: string) => string

export const stringCharCodeAt = Function.prototype.call.bind(
  String.prototype.charCodeAt
) as (value: string, index: number) => number
