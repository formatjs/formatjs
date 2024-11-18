import {BestFitMatcher} from './BestFitMatcher'
import {CanonicalizeUValue} from './CanonicalizeUValue'
import {InsertUnicodeExtensionAndCanonicalize} from './InsertUnicodeExtensionAndCanonicalize'
import {LookupMatcher} from './LookupMatcher'
import {UnicodeExtensionComponents} from './UnicodeExtensionComponents'
import {Keyword, LookupMatcherResult} from './types'
import {invariant} from './utils'

export interface ResolveLocaleResult {
  locale: string
  dataLocale: string
  [k: string]: any
}

/**
 * https://tc39.es/ecma402/#sec-resolvelocale
 */
export function ResolveLocale<K extends string, D extends {[k in K]: any}>(
  availableLocales: Set<string> | readonly string[],
  requestedLocales: readonly string[],
  options: {
    localeMatcher: string
    [k: string]: string
  },
  relevantExtensionKeys: K[],
  localeData: Record<string, D | undefined>,
  getDefaultLocale: () => string
): ResolveLocaleResult {
  const matcher = options.localeMatcher
  let r: LookupMatcherResult
  if (matcher === 'lookup') {
    r = LookupMatcher(
      Array.from(availableLocales),
      requestedLocales,
      getDefaultLocale
    )
  } else {
    r = BestFitMatcher(
      Array.from(availableLocales),
      requestedLocales,
      getDefaultLocale
    )
  }
  if (r == null) {
    r = {
      locale: getDefaultLocale(),
      extension: '',
    }
  }
  let foundLocale = r.locale
  let foundLocaleData = localeData[foundLocale]
  // TODO: We can't really guarantee that the locale data is available
  // invariant(
  //   foundLocaleData !== undefined,
  //   `Missing locale data for ${foundLocale}`
  // )
  const result: ResolveLocaleResult = {locale: 'en', dataLocale: foundLocale}
  let components
  let keywords: Keyword[]
  if (r.extension) {
    components = UnicodeExtensionComponents(r.extension)
    keywords = components.keywords
  } else {
    keywords = []
  }
  let supportedKeywords: Keyword[] = []
  for (const key of relevantExtensionKeys) {
    // TODO: Shouldn't default to empty array, see TODO above
    let keyLocaleData: string[] = foundLocaleData?.[key] ?? []
    invariant(
      Array.isArray(keyLocaleData),
      `keyLocaleData for ${key} must be an array`
    )
    let value = keyLocaleData[0]
    invariant(
      value === undefined || typeof value === 'string',
      `value must be a string or undefined`
    )
    let supportedKeyword: Keyword | undefined
    let entry = keywords.find(k => k.key === key)
    if (entry) {
      let requestedValue = entry.value
      if (requestedValue !== '') {
        if (keyLocaleData.indexOf(requestedValue) > -1) {
          value = requestedValue
          supportedKeyword = {
            key,
            value,
          }
        }
      } else if (keyLocaleData.indexOf('true') > -1) {
        value = 'true'
        supportedKeyword = {
          key,
          value,
        }
      }
    }

    let optionsValue = options[key]
    invariant(
      optionsValue == null || typeof optionsValue === 'string',
      `optionsValue must be a string or undefined`
    )
    if (typeof optionsValue === 'string') {
      let ukey = key.toLowerCase()
      optionsValue = CanonicalizeUValue(ukey, optionsValue)
      if (optionsValue === '') {
        optionsValue = 'true'
      }
    }
    if (optionsValue !== value && keyLocaleData.indexOf(optionsValue) > -1) {
      value = optionsValue
      supportedKeyword = undefined
    }
    if (supportedKeyword) {
      supportedKeywords.push(supportedKeyword)
    }
    result[key] = value
  }
  let supportedAttributes: string[] = []
  if (supportedKeywords.length > 0) {
    supportedAttributes = []
    foundLocale = InsertUnicodeExtensionAndCanonicalize(
      foundLocale,
      supportedAttributes,
      supportedKeywords
    )
  }

  result.locale = foundLocale
  return result
}
