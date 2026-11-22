let canonicalIntl: typeof Intl | undefined = globalThis.Intl
const getOwnDescriptor = Object.getOwnPropertyDescriptor
const apply = Reflect.apply

function ownCanonicalizer() {
  const descriptor =
    canonicalIntl && getOwnDescriptor(canonicalIntl, 'getCanonicalLocales')
  return descriptor && getOwnDescriptor(descriptor, 'value')?.value
}

let canonicalize = ownCanonicalizer()

/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-canonicalizelocalelist
 * @param locales
 */
export function CanonicalizeLocaleList(
  locales?: string | readonly string[]
): string[] {
  // ECMA-402 §9.2.1: reuse the canonicalization provider without accessor Gets.
  // A later data property can supply a polyfill.
  if (canonicalIntl === undefined) canonicalIntl = globalThis.Intl
  const installed = ownCanonicalizer()
  if (typeof installed === 'function') canonicalize = installed
  return apply(canonicalize, canonicalIntl, [locales])
}
