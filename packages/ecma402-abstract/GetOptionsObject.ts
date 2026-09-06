/**
 * ECMA-262 §7.3.36 GetOptionsObject, steps 2–3.
 * https://tc39.es/ecma262/#sec-getoptionsobject
 * https://github.com/tc39/ecma262/blob/dcf59856a8184792a9e42f0ffb7dc064094a5dcc/spec.html#L7008-L7010
 * @param options
 * @returns
 */
export function GetOptionsObject<T extends object>(options?: T): T {
  if (typeof options === 'undefined') {
    return Object.create(null)
  }
  // Functions are Objects; null is not.
  if (
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
  ) {
    return options
  }
  throw new TypeError('Options must be an object')
}
