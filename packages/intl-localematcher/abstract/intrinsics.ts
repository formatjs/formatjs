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
