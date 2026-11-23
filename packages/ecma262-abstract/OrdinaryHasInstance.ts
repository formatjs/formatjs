const apply = Reflect.apply
const hasInstance = Function.prototype[Symbol.hasInstance]

/** ECMA-262 §7.3.21, via §20.2.3.6 step 2. */
export function OrdinaryHasInstance(
  constructor: unknown,
  instance: unknown
): boolean {
  return apply(hasInstance, constructor, [instance])
}
