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
import {ResolveLocale} from '@formatjs/intl-localematcher'

export interface DisplayNamesOptions {
  localeMatcher?: 'lookup' | 'best fit'
  style?: 'narrow' | 'short' | 'long'
  type: 'language' | 'region' | 'script' | 'currency'
  fallback?: 'code' | 'none'
}

export interface DisplayNamesResolvedOptions {
  locale: string
  style: NonNullable<DisplayNamesOptions['style']>
  type: NonNullable<DisplayNamesOptions['type']>
  fallback: NonNullable<DisplayNamesOptions['fallback']>
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
      ['language', 'currency', 'region', 'script'],
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
    const styleFields = typeFields[style]
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

    // This is only used to store extracted language region.
    let regionSubTag: string | undefined
    if (type === 'language') {
      const regionMatch = /-([a-z]{2}|\d{3})\b/i.exec(canonicalCode)
      if (regionMatch) {
        // Remove region subtag
        canonicalCode =
          canonicalCode.substring(0, regionMatch.index) +
          canonicalCode.substring(regionMatch.index + regionMatch[0].length)
        regionSubTag = regionMatch[1]
      }
    }
    const typesData = localeData.types[type]
    // If the style of choice does not exist, fallback to "long".
    const name =
      typesData[style][canonicalCode] || typesData.long[canonicalCode]

    if (name !== undefined) {
      // If there is a region subtag in the language id, use locale pattern to interpolate the region
      if (regionSubTag) {
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
        'fallback'
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
