let canonicalIntl: typeof Intl | undefined = globalThis.Intl
const getOwnDescriptor = Object.getOwnPropertyDescriptor
const apply = Reflect.apply

function ownCanonicalizer() {
  const descriptor =
    canonicalIntl && getOwnDescriptor(canonicalIntl, 'getCanonicalLocales')
  return descriptor && getOwnDescriptor(descriptor, 'value')?.value
}

let canonicalize = ownCanonicalizer()

// ECMA-402 §9.2.1 uses an internal operation.
// https://tc39.es/ecma402/#sec-canonicalizelocalelist
export function CanonicalizeLocaleList(
  locales?: string | readonly string[]
): string[] {
  // A polyfill can supply the provider when the host has none.
  if (typeof canonicalize !== 'function') {
    if (canonicalIntl === undefined) canonicalIntl = globalThis.Intl
    canonicalize = ownCanonicalizer()
  }
  return apply(canonicalize, canonicalIntl, [locales])
}
