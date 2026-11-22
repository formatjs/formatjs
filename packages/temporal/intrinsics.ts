import {IsObject} from '#packages/ecma262-abstract/IsObject.js'

// Internal allocation must not call a replacement installed by user code.
export const createObject: typeof Object.create = Object.create

const ProxyConstructor = Proxy
const setPrototypeOf = Object.setPrototypeOf

// Proxy supplies a dense array for its private argument List.
export function argumentAt(args: readonly unknown[], index: number): unknown {
  return index < args.length ? args[index] : undefined
}

// Callers supply fresh, private handler literals; absent traps have no prototype.
export function createProxy<T extends object>(
  target: T,
  handler: ProxyHandler<T>
): T {
  setPrototypeOf(handler, null)
  return new ProxyConstructor(target, handler)
}

const isArray = Array.isArray

export function constructorPrototype(
  newTarget: {prototype: unknown},
  target: {prototype: object}
): object {
  // ECMA-262 §10.1.14 steps 2–3: read once and return an object prototype.
  const prototype = newTarget.prototype
  if (IsObject(prototype)) return prototype

  // §7.3.24 steps 3.a, 3.d: reject revoked proxies without invoking traps.
  // §7.2.2 step 3 supplies this check through the runtime.
  isArray(newTarget)

  // §10.1.14 steps 5–6 still need bound-function and foreign-realm support.
  return target.prototype
}
