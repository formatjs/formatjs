/**
 * https://tc39.es/ecma402/#sec-getoptionsobject
 * @param options
 * @returns
 */
export function GetOptionsObject<T extends object>(options?: T): T {
  if (typeof options === 'undefined') {
    return Object.create(null)
  }
  if (typeof options === 'object') {
    return options
  }
  throw new TypeError('Options must be an object')
}
