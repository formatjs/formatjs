let canonicalIntl: typeof Intl | undefined = globalThis.Intl
const canonicalDescriptor = Object.getOwnPropertyDescriptor
const canonicalApply = Reflect.apply
function ownCanonicalProvider() {
  const descriptor =
    canonicalIntl && canonicalDescriptor(canonicalIntl, 'getCanonicalLocales')
  const value = descriptor && canonicalDescriptor(descriptor, 'value')
  return value?.value
}
let canonicalProvider = ownCanonicalProvider()

// ECMA-402 §9.2.1 uses an internal operation.
// https://tc39.es/ecma402/#sec-canonicalizelocalelist
export function CanonicalizeLocaleList(
  locales?: string | ReadonlyArray<string>
): string[] {
  // A polyfill can supply the provider when the host has none.
  if (typeof canonicalProvider !== 'function') {
    if (canonicalIntl === undefined) canonicalIntl = globalThis.Intl
    canonicalProvider = ownCanonicalProvider()
  }
  return canonicalApply(canonicalProvider, canonicalIntl, [locales])
}
