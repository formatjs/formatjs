import {
  getInternalSlot,
  setInternalSlot,
  GetOption,
  invariant,
  SupportedLocales,
  IsWellFormedCurrencyCode,
  getMultiInternalSlots,
  DisplayNamesLocaleData,
  DisplayNamesData,
  ToString,
  CanonicalizeLocaleList,
  GetOptionsObject,
} from '@formatjs/ecma402-abstract'
import {CanonicalCodeForDisplayNames} from './abstract/CanonicalCodeForDisplayNames'
import {IsValidDateTimeFieldCode} from './abstract/IsValidDateTimeFieldCode'

import {ResolveLocale} from '@formatjs/intl-localematcher'

export interface DisplayNamesOptions {
  localeMatcher?: 'lookup' | 'best fit'
  style?: 'narrow' | 'short' | 'long'
  type:
    | 'language'
    | 'region'
    | 'script'
    | 'currency'
    | 'calendar'
    | 'dateTimeField'
  fallback?: 'code' | 'none'
  languageDisplay?: 'dialect' | 'standard'
}

export interface DisplayNamesResolvedOptions {
  locale: string
  style: NonNullable<DisplayNamesOptions['style']>
  type: NonNullable<DisplayNamesOptions['type']>
  fallback: NonNullable<DisplayNamesOptions['fallback']>
  languageDisplay: NonNullable<DisplayNamesOptions['languageDisplay']>
}

export class DisplayNames {
  constructor(
    locales: string | string[] | undefined,
    options: DisplayNamesOptions
  ) {
    if (new.target === undefined) {
      throw TypeError(`Constructor Intl.DisplayNames requires 'new'`)
    }
    const requestedLocales = CanonicalizeLocaleList(locales)
    options = GetOptionsObject(options)

    const opt = Object.create(null)
    const {localeData} = DisplayNames
    const matcher = GetOption(
      options,
      'localeMatcher',
      'string',
      ['lookup', 'best fit'],
      'best fit'
    )
    opt.localeMatcher = matcher

    const r = ResolveLocale(
      DisplayNames.availableLocales,
      requestedLocales,
      opt,
      [], // there is no relevantExtensionKeys
      DisplayNames.localeData,
      DisplayNames.getDefaultLocale
    )

    const style = GetOption(
      options,
      'style',
      'string',
      ['narrow', 'short', 'long'],
      'long'
    )
    setSlot(this, 'style', style)

    const type = GetOption(
      options,
      'type',
      'string',
      ['language', 'region', 'script', 'currency', 'calendar', 'dateTimeField'],
      undefined
    )
    if (type === undefined) {
      throw TypeError(`Intl.DisplayNames constructor requires "type" option`)
    }

    setSlot(this, 'type', type)

    const fallback = GetOption(
      options,
      'fallback',
      'string',
      ['code', 'none'],
      'code'
    )
    setSlot(this, 'fallback', fallback)
    setSlot(this, 'locale', r.locale)

    const {dataLocale} = r
    const dataLocaleData = localeData[dataLocale]
    invariant(!!dataLocaleData, `Missing locale data for ${dataLocale}`)
    setSlot(this, 'localeData', dataLocaleData)
    invariant(
      dataLocaleData !== undefined,
      `locale data for ${r.locale} does not exist.`
    )
    const {types} = dataLocaleData
    invariant(typeof types === 'object' && types != null, 'invalid types data')
    const typeFields = types[type]
    invariant(
      typeof typeFields === 'object' && typeFields != null,
      'invalid typeFields data'
    )
    const languageDisplay = GetOption(
      options,
      'languageDisplay',
      'string',
      ['dialect', 'standard'],
      'dialect'
    )
    if (type === 'language') {
      setSlot(this, 'languageDisplay', languageDisplay)
      // Using types[type] instead of typeFields because TypeScript cannot infer the correct type
      const typeFields = types[type][languageDisplay]
      invariant(
        typeof typeFields === 'object' && typeFields != null,
        'invalid language typeFields data'
      )
    }

    // Using types[type] instead of typeFields because TypeScript cannot infer the correct type
    const styleFields =
      type === 'language'
        ? types[type][languageDisplay][style]
        : types[type][style]
    invariant(
      typeof styleFields === 'object' && styleFields != null,
      'invalid styleFields data'
    )
    setSlot(this, 'fields', styleFields)
  }

  static supportedLocalesOf(
    locales?: string | string[],
    options?: Pick<DisplayNamesOptions, 'localeMatcher'>
  ): string[] {
    return SupportedLocales(
      DisplayNames.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  }

  static __addLocaleData(...data: DisplayNamesLocaleData[]): void {
    for (const {data: d, locale} of data) {
      const minimizedLocale = new (Intl as any).Locale(locale)
        .minimize()
        .toString()
      DisplayNames.localeData[locale] = DisplayNames.localeData[
        minimizedLocale
      ] = d
      DisplayNames.availableLocales.add(minimizedLocale)
      DisplayNames.availableLocales.add(locale)
      if (!DisplayNames.__defaultLocale) {
        DisplayNames.__defaultLocale = minimizedLocale
      }
    }
  }

  of(code: string | number | Record<string, unknown>): string | undefined {
    checkReceiver(this, 'of')
    const type = getSlot(this, 'type')
    const codeAsString = ToString(code)
    if (!isValidCodeForDisplayNames(type, codeAsString)) {
      throw RangeError('invalid code for Intl.DisplayNames.prototype.of')
    }
    const {localeData, style, fallback} = getMultiInternalSlots(
      __INTERNAL_SLOT_MAP__,
      this,
      'localeData',
      'style',
      'fallback'
    )

    // Canonicalize the case.
    let canonicalCode = CanonicalCodeForDisplayNames(type, codeAsString)

    let name: string | undefined
    if (type === 'language') {
      const languageDisplay = getSlot(this, 'languageDisplay')
      name = getNameForTypeLanguage(
        languageDisplay,
        localeData,
        style,
        canonicalCode,
        fallback
      )
    } else {
      // All the other types
      const typesData = localeData.types[type]
      name = typesData[style][canonicalCode] || typesData.long[canonicalCode]
    }

    if (name !== undefined) {
      return name
    }

    if (fallback === 'code') {
      return codeAsString
    }
  }

  resolvedOptions(): DisplayNamesResolvedOptions {
    checkReceiver(this, 'resolvedOptions')
    return {
      ...getMultiInternalSlots(
        __INTERNAL_SLOT_MAP__,
        this,
        'locale',
        'style',
        'type',
        'fallback',
        'languageDisplay'
      ),
    }
  }

  static localeData: Record<string, DisplayNamesData | undefined> = {}
  private static availableLocales = new Set<string>()
  private static __defaultLocale = ''
  private static getDefaultLocale() {
    return DisplayNames.__defaultLocale
  }
  public static readonly polyfilled = true
}

// https://tc39.es/proposal-intl-displaynames/#sec-isvalidcodefordisplaynames
function isValidCodeForDisplayNames(
  type: NonNullable<DisplayNamesOptions['type']>,
  code: string
): boolean {
  switch (type) {
    case 'language':
      // subset of unicode_language_id
      // languageCode ["-" scriptCode] ["-" regionCode] *("-" variant)
      // where:
      // - languageCode is either a two letters ISO 639-1 language code or a three letters ISO 639-2 language code.
      // - scriptCode is should be an ISO-15924 four letters script code
      // - regionCode is either an ISO-3166 two letters region code, or a three digits UN M49 Geographic Regions.
      return /^[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?(-([a-z\d]{5,8}|\d[a-z\d]{3}))*$/i.test(
        code
      )
    case 'region':
      // unicode_region_subtag
      return /^([a-z]{2}|\d{3})$/i.test(code)
    case 'script':
      // unicode_script_subtag
      return /^[a-z]{4}$/i.test(code)
    case 'currency':
      return IsWellFormedCurrencyCode(code)
    case 'calendar':
      // unicode locale identifier type
      return /^[a-z0-9]{3,8}([-_][a-z0-9]{3,8})*$/i.test(code)
    case 'dateTimeField':
      return IsValidDateTimeFieldCode(code)
  }
}

try {
  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(DisplayNames.prototype, Symbol.toStringTag, {
      value: 'Intl.DisplayNames',
      configurable: true,
      enumerable: false,
      writable: false,
    })
  }
  Object.defineProperty(DisplayNames, 'length', {
    value: 2,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch (e) {
  // Make test 262 compliant
}

interface DisplayNamesInternalSlots {
  locale: string
  style: NonNullable<DisplayNamesOptions['style']>
  type: NonNullable<DisplayNamesOptions['type']>
  fallback: NonNullable<DisplayNamesOptions['fallback']>
  languageDisplay: NonNullable<DisplayNamesOptions['languageDisplay']>
  // Note that this differs from `fields` slot in the spec.
  localeData: DisplayNamesData
  fields: Record<string, string>
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<
  DisplayNames,
  DisplayNamesInternalSlots
>()

function getSlot<K extends keyof DisplayNamesInternalSlots>(
  instance: DisplayNames,
  key: K
): DisplayNamesInternalSlots[K] {
  return getInternalSlot(__INTERNAL_SLOT_MAP__, instance, key)
}

function setSlot<K extends keyof DisplayNamesInternalSlots>(
  instance: DisplayNames,
  key: K,
  value: DisplayNamesInternalSlots[K]
): void {
  setInternalSlot(__INTERNAL_SLOT_MAP__, instance, key, value)
}

function checkReceiver(receiver: unknown, methodName: string) {
  if (!(receiver instanceof DisplayNames)) {
    throw TypeError(
      `Method Intl.DisplayNames.prototype.${methodName} called on incompatible receiver`
    )
  }
}

function getNameForTypeLanguage(
  languageDisplay: DisplayNamesInternalSlots['languageDisplay'],
  localeData: DisplayNamesData,
  style: DisplayNamesInternalSlots['style'],
  canonicalCode: string,
  fallback: DisplayNamesInternalSlots['fallback']
): string | undefined {
  // First, try to get the name using the canonicalCode
  const typesData = localeData.types.language[languageDisplay]
  const name = typesData[style][canonicalCode] || typesData.long[canonicalCode]

  if (name === undefined) {
    // If no name has been found using the canonicalCode,
    // check if the latter contains a region sub tag
    const regionMatch = /-([a-z]{2}|\d{3})\b/i.exec(canonicalCode)
    if (regionMatch) {
      // Extract the language and region sub tags
      const languageSubTag =
        canonicalCode.substring(0, regionMatch.index) +
        canonicalCode.substring(regionMatch.index + regionMatch[0].length)
      const regionSubTag = regionMatch[1]

      // Let's try again using languageSubTag this time
      const name =
        typesData[style][languageSubTag] || typesData.long[languageSubTag]

      // If a name has been found and a region sub tag exists,
      // compose them together or use the code fallback
      if (name !== undefined && regionSubTag) {
        // Retrieve region display names
        const regionsData = localeData.types.region
        const regionDisplayName: string | undefined =
          regionsData[style][regionSubTag] || regionsData.long[regionSubTag]

        if (regionDisplayName || fallback === 'code') {
          // Interpolate into locale-specific pattern.
          const pattern = localeData.patterns.locale
          return pattern
            .replace('{0}', name)
            .replace('{1}', regionDisplayName || regionSubTag)
        }
      } else {
        return name
      }
    }
  } else {
    return name
  }
}
