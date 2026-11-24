const hasOwn = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty
) as (object: object, property: string | symbol) => boolean

// ECMA-262 §7.3.12 uses [[GetOwnProperty]]. The captured method delegates to it.
// https://tc39.es/ecma262/#sec-hasownproperty
export function HasOwnProperty(o: object, prop: string | symbol): boolean {
  return hasOwn(o, prop)
}
