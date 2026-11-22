import {IsObject} from '#packages/ecma262-abstract/IsObject.js'

// Internal allocation must not call a replacement installed by user code.
export const createObject: typeof Object.create = Object.create

const ProxyConstructor = Proxy
const setPrototypeOf = Object.setPrototypeOf

// Proxy supplies a dense array for its private argument List.
// Temporal comparison §4.1.1 steps 2–7.
// Read a present argument or supply undefined for constructor defaults.
export function argumentAt(args: readonly unknown[], index: number): unknown {
  return index < args.length ? args[index] : undefined
}

export function createProxy<T extends object>(
  target: T,
  handler: ProxyHandler<T>
): T {
  // Callers supply private handlers. Ignore inherited traps.
  setPrototypeOf(handler, null)
  // ECMA-262 §28.2.1.1 step 2: Let the captured constructor create the proxy.
  return new ProxyConstructor(target, handler)
}

const isArray = Array.isArray
const arraySlice = Array.prototype.slice
const apply = Reflect.apply
const construct = Reflect.construct
const defineProperty = Object.defineProperty
const TypeErrorConstructor = TypeError

const reachedRealmProbe = createObject(null)
const speciesProbeHandler = {
  __proto__: null,
  get() {
    throw reachedRealmProbe
  },
}

function probeArraySpeciesRealm(newTarget: object): void {
  const array: unknown[] = []
  const descriptor = {
    __proto__: null,
    value: new ProxyConstructor(newTarget, speciesProbeHandler),
  }
  defineProperty(array, 'constructor', descriptor)
  // ECMA-262 §10.4.2.3 steps 4.b and 5.a: validate the realm, then
  // abort at our species trap before Proxy descriptor invariants can run.
  apply(arraySlice, array, [])
}

const privateConstructProbe = createProxy(function RealmProbe() {}, {
  construct() {
    throw reachedRealmProbe
  },
})

function probeConstructibleRealm(newTarget: object): void {
  // Some single-realm runtimes validate the entire constructor chain here.
  construct(
    privateConstructProbe,
    [],
    newTarget as typeof privateConstructProbe
  )
}

type ConstructorRealmProbe = (newTarget: object) => void

function supportsConstructorRealmProbe(probe: ConstructorRealmProbe): boolean {
  const pair = ProxyConstructor.revocable(function ProbeTarget() {}, {})
  const bound = pair.proxy.bind(null)
  try {
    probe(bound)
    return false
  } catch (error) {
    if (error !== reachedRealmProbe) return false
  }
  pair.revoke()
  try {
    probe(bound)
    return false
  } catch (error) {
    return error instanceof TypeErrorConstructor
  }
}

const constructorRealmProbe = supportsConstructorRealmProbe(
  probeArraySpeciesRealm
)
  ? probeArraySpeciesRealm
  : supportsConstructorRealmProbe(probeConstructibleRealm)
    ? probeConstructibleRealm
    : undefined

function validateConstructorRealm(newTarget: object): void {
  if (constructorRealmProbe) {
    try {
      constructorRealmProbe(newTarget)
    } catch (error) {
      if (error === reachedRealmProbe) return
      throw error
    }
  }
  // ECMA-262 §7.2.2 step 3 checks direct Proxy chains on other runtimes.
  isArray(newTarget)
}

export function constructorPrototype(
  newTarget: {prototype: unknown},
  target: {prototype: object}
): object {
  // ECMA-262 §10.1.14 steps 2–3: read once and return an object prototype.
  const prototype = newTarget.prototype
  if (IsObject(prototype)) return prototype

  // §7.3.24 steps 2–3: validate a primitive fallback's constructor chain.
  validateConstructorRealm(newTarget)

  // §10.1.14 steps 5–6 still need foreign-realm intrinsic selection.
  return target.prototype
}
