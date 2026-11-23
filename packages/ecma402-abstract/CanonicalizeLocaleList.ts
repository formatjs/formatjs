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

/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-canonicalizelocalelist
 * @param locales
 */
export function CanonicalizeLocaleList(
  locales?: string | ReadonlyArray<string>
): string[] {
  // ECMA-402 §9.2.1: delegate canonicalization without a mutable accessor Get.
  // Late real polyfill assignments remain available before the next call.
  if (canonicalIntl === undefined) canonicalIntl = globalThis.Intl
  const candidate = ownCanonicalProvider()
  if (typeof candidate === 'function') canonicalProvider = candidate
  return canonicalApply(canonicalProvider, canonicalIntl, [locales])
}
