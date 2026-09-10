import {defaultContent} from '@formatjs_generated/cldr.supported-locales/default-content.js'

const explicitLocales = new WeakMap<object, Set<string>>()

// ECMA-402 §9.1 [[AvailableLocales]] requires fallback tags, including the
// scriptless language-region tag. Fill missing fallbacks without replacing
// explicitly loaded locale data with another locale's likely-subtag alias.
// https://tc39.es/ecma402/#sec-internal-slots
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L18-L26
export function registerLocaleData<T>(
  locale: string,
  data: T,
  localeData: Record<string, T | undefined>,
  availableLocales: Set<string>
): void {
  let loaded = explicitLocales.get(localeData)
  if (!loaded) {
    loaded = new Set<string>()
    explicitLocales.set(localeData, loaded)
  }
  loaded.add(locale)
  const locales = [locale, ...(defaultContent[locale] || [])]
  for (const tag of locales) {
    if (tag === locale || !loaded.has(tag) || localeData[tag] === undefined) {
      localeData[tag] = data
    }
    availableLocales.add(tag)
  }
  for (const tag of locales) {
    const parts = tag.split('-')
    const fallbacks: string[] = []
    while (parts.length > 1) {
      if (parts.length > 2 && parts[1].length === 4) {
        fallbacks.push([parts[0], ...parts.slice(2)].join('-'))
      }
      parts.pop()
      fallbacks.push(parts.join('-'))
    }
    for (const fallback of fallbacks) {
      if (localeData[fallback] === undefined)
        localeData[fallback] = localeData[tag]
      availableLocales.add(fallback)
    }
  }
}
