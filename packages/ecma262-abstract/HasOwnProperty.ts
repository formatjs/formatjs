const hasOwn = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty
) as (object: object, property: string) => boolean

/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-hasownproperty
 */
export function HasOwnProperty(o: object, prop: string): boolean {
  return hasOwn(o, prop)
}
