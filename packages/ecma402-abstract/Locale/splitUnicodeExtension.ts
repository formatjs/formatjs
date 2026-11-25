const apply = Reflect.apply
const split = String.prototype.split
// A private separator supplies "-" without a mutable @@split lookup.
const hyphen = {__proto__: null, toString: () => '-'}

export function splitLocaleSubtags(value: string): string[] {
  return apply(split, value, [hyphen])
}

// ECMA-402 §9.2.3, steps 1.b.i–ii: extract only the Unicode extension.
// A private-use subtag named "u" does not start a Unicode extension.
// https://tc39.es/ecma402/#sec-lookupmatchinglocalebyprefix
export function splitUnicodeExtension(locale: string): {
  locale: string
  extension?: string
} {
  const subtags = splitLocaleSubtags(locale)
  for (let i = 1; i < subtags.length; i++) {
    if (subtags[i] === 'x') break
    if (subtags[i] !== 'u') continue
    let end = i + 1
    while (end < subtags.length && subtags[end].length > 1) end++
    let base = subtags[0]
    for (let j = 1; j < i; j++) base += '-' + subtags[j]
    for (let j = end; j < subtags.length; j++) base += '-' + subtags[j]
    let extension = ''
    for (let j = i; j < end; j++) extension += '-' + subtags[j]
    return {locale: base, extension}
  }
  // ECMA-402 §9.2.3 step 1.a: the private extension field starts empty.
  return {locale, extension: undefined}
}
