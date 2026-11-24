// ECMA-262 §6.1.7 includes functions and host objects with [[IsHTMLDDA]].
// https://tc39.es/ecma262/#sec-object-type
// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
export function IsObject(value: unknown): value is object {
  return (
    value !== null &&
    (typeof value === 'object' ||
      typeof value === 'function' ||
      (typeof value === 'undefined' && value !== undefined))
  )
}
