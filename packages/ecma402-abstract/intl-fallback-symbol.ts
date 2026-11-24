const fallbackRealm = globalThis
const fallbackDescription = 'IntlLegacyConstructedSymbol'
const fallbackStorageName = '@formatjs/intlFallbackSymbol'
const createFallbackSymbol = Symbol
const fallbackKeyFor = Symbol.for
const fallbackDescriptor = Object.getOwnPropertyDescriptor
const fallbackDefine = Object.defineProperty
const fallbackIsExtensible = Object.isExtensible
const fallbackReceiver = Object.create
const fallbackSymbols = Object.getOwnPropertySymbols
const fallbackApply = Reflect.apply
const nativeSource = Function.prototype.toString
const startsWith = String.prototype.startsWith
const includes = String.prototype.includes
const describeSymbol = fallbackDescriptor(Symbol.prototype, 'description')?.get
const hostIntl = fallbackDescriptor(fallbackRealm, 'Intl')?.value
const hostNumberFormat =
  hostIntl && fallbackDescriptor(hostIntl, 'NumberFormat')?.value
const hostDateTimeFormat =
  hostIntl && fallbackDescriptor(hostIntl, 'DateTimeFormat')?.value
let realmFallbackSymbol: symbol | undefined

function readHostFallback(
  constructor: unknown,
  name: string
): symbol | undefined {
  if (typeof constructor !== 'function' || !describeSymbol) return undefined
  // Match an active host formatter when it coexists with the polyfill.
  if (
    fallbackDescriptor(fallbackRealm, 'Intl')?.value !== hostIntl ||
    fallbackDescriptor(hostIntl, name)?.value !== constructor
  )
    return undefined
  const source = fallbackApply(nativeSource, constructor, [])
  if (
    !fallbackApply(startsWith, source, ['function ' + name]) ||
    !fallbackApply(includes, source, ['[native code]'])
  )
    return undefined
  try {
    const receiver = fallbackReceiver(constructor.prototype)
    if (fallbackApply(constructor, receiver, []) === receiver) {
      const keys = fallbackSymbols(receiver)
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        if (fallbackApply(describeSymbol, key, []) === fallbackDescription)
          return key
      }
    }
  } catch {
    // A partial host Intl can lack legacy construction or usable locale data.
  }
  return undefined
}

// ECMA-402 §8. Legacy constructors share the realm's unregistered symbol.
// https://tc39.es/ecma402/#intl-object
export function getIntlFallbackSymbol(): symbol {
  if (realmFallbackSymbol !== undefined) return realmFallbackSymbol
  const storage = fallbackKeyFor(fallbackStorageName)
  const existing = fallbackDescriptor(fallbackRealm, storage)
  if (typeof existing?.value === 'symbol')
    return (realmFallbackSymbol = existing.value)
  realmFallbackSymbol =
    readHostFallback(hostNumberFormat, 'NumberFormat') ??
    readHostFallback(hostDateTimeFormat, 'DateTimeFormat') ??
    createFallbackSymbol(fallbackDescription)
  // Coordinate independent bundles and Hermes through a realm-local property.
  if (existing === undefined && fallbackIsExtensible(fallbackRealm)) {
    fallbackDefine(fallbackRealm, storage, {
      __proto__: null,
      value: realmFallbackSymbol,
    } as PropertyDescriptor)
  }
  return realmFallbackSymbol
}
