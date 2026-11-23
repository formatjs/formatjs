const hasOwn = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty
) as (object: object, property: string | symbol) => boolean

/** ECMA-262 §7.3.12, via §20.1.3.2. */
export function HasOwnProperty(o: object, prop: string | symbol): boolean {
  return hasOwn(o, prop)
}
