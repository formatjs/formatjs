let canonicalIntl: typeof Intl | undefined = globalThis.Intl
const getOwnDescriptor = Object.getOwnPropertyDescriptor
const apply = Reflect.apply
const providerKey = Symbol.for('@formatjs/intlCanonicalizeLocaleList')

function ownCanonicalizer() {
  const descriptor =
    canonicalIntl && getOwnDescriptor(canonicalIntl, 'getCanonicalLocales')
  return descriptor && getOwnDescriptor(descriptor, 'value')?.value
}

let canonicalize = ownCanonicalizer()

function registeredCanonicalizer() {
  try {
    const descriptor =
      canonicalIntl && getOwnDescriptor(canonicalIntl, providerKey)
    return descriptor && getOwnDescriptor(descriptor, 'value')?.value
  } catch {
    // The shared registry is optional. Keep using the captured canonicalizer.
  }
}

// ECMA-402 §9.2.1 uses an internal operation.
// https://tc39.es/ecma402/#sec-canonicalizelocalelist
export function CanonicalizeLocaleList(
  locales?: string | readonly string[]
): string[] {
  // Read the provider registered by the FormatJS installers.
  if (canonicalIntl === undefined) canonicalIntl = globalThis.Intl
  const registered = registeredCanonicalizer()
  if (typeof registered === 'function')
    return apply(registered, canonicalIntl, [locales])

  if (typeof canonicalize !== 'function') {
    canonicalize = ownCanonicalizer()
  }
  return apply(canonicalize, canonicalIntl, [locales])
}
