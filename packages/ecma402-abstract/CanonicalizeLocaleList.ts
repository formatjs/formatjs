let canonicalIntl: typeof Intl | undefined = globalThis.Intl
const canonicalDescriptor = Object.getOwnPropertyDescriptor
const canonicalApply = Reflect.apply
const canonicalDefine = Object.defineProperty
const canonicalIsExtensible = Object.isExtensible
const providerKey = Symbol.for('@formatjs/intlCanonicalizeLocaleList')
function ownCanonicalProvider() {
  const descriptor =
    canonicalIntl && canonicalDescriptor(canonicalIntl, 'getCanonicalLocales')
  const value = descriptor && canonicalDescriptor(descriptor, 'value')
  return value?.value
}
let canonicalProvider = ownCanonicalProvider()

// Locale and getCanonicalLocales installers share their provider across bundles.
export function registerCanonicalizeLocaleList(
  intl: typeof Intl,
  provider: (locales?: any) => string[]
): void {
  if (canonicalDescriptor(intl, providerKey) || canonicalIsExtensible(intl)) {
    canonicalDefine(intl, providerKey, {
      __proto__: null,
      configurable: true,
      value: provider,
    } as PropertyDescriptor)
  }
}

// ECMA-402 §9.2.1 uses an internal operation.
// https://tc39.es/ecma402/#sec-canonicalizelocalelist
export function CanonicalizeLocaleList(
  locales?: string | ReadonlyArray<string>
): string[] {
  // Official installs can add FormatJS Locale brand support after setup.
  if (canonicalIntl === undefined) canonicalIntl = globalThis.Intl
  const descriptor =
    canonicalIntl && canonicalDescriptor(canonicalIntl, providerKey)
  const registered =
    descriptor && canonicalDescriptor(descriptor, 'value')?.value
  if (typeof registered === 'function')
    return canonicalApply(registered, canonicalIntl, [locales])

  // A host without a canonicalizer can still load one before first use.
  if (typeof canonicalProvider !== 'function') {
    canonicalProvider = ownCanonicalProvider()
  }
  return canonicalApply(canonicalProvider, canonicalIntl, [locales])
}
