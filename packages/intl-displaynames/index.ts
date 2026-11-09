import {registerLocaleData} from '#packages/ecma402-abstract/registerLocaleData.js'
import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {GetOptionsObject} from '#packages/ecma402-abstract/GetOptionsObject.js'
import {IsWellFormedCurrencyCode} from '#packages/ecma402-abstract/IsWellFormedCurrencyCode.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {
  type DisplayNamesData,
  type DisplayNamesLocaleData,
} from '#packages/ecma402-abstract/types/displaynames.js'
import {
  getInternalSlot,
  getMultiInternalSlots,
  invariant,
  setInternalSlot,
} from '#packages/ecma402-abstract/utils.js'
import {CanonicalCodeForDisplayNames} from '#packages/ecma402-abstract/DisplayNames/CanonicalCodeForDisplayNames.js'
import {IsValidDateTimeFieldCode} from '#packages/ecma402-abstract/DisplayNames/IsValidDateTimeFieldCode.js'

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
      Array.from(DisplayNames.availableLocales),
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
      registerLocaleData(
        locale,
        d,
        DisplayNames.localeData,
        DisplayNames.availableLocales
      )
      if (!DisplayNames.__defaultLocale) {
        DisplayNames.__defaultLocale = locale
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
      // Return the canonical code after lookup fails.
      // ECMA-402 §12.3.3 Intl.DisplayNames.prototype.of, steps 4–7.
      // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.of
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L185-L188
      return canonicalCode
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
      // ECMA-402 §12.5.1 CanonicalCodeForDisplayNames, step 1.a:
      // unicode_language_subtag allows 2–3 or 5–8 ASCII letters.
      // https://tc39.es/ecma402/#sec-canonicalcodefordisplaynames
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L235-L238
      return /^(?:[a-z]{2,3}|[a-z]{5,8})(-[a-z]{4})?(-([a-z]{2}|\d{3}))?(-([a-z\d]{5,8}|\d[a-z\d]{3}))*(?![\s\S])/i.test(
        code
      )
    case 'region':
      // unicode_region_subtag
      return /^([a-z]{2}|\d{3})(?![\s\S])/i.test(code)
    case 'script':
      // unicode_script_subtag
      return /^[a-z]{4}(?![\s\S])/i.test(code)
    case 'currency':
      return IsWellFormedCurrencyCode(code)
    case 'calendar':
      // unicode locale identifier type
      return IsUnicodeLocaleIdentifierType(code)
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
} catch {
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
  const typesData = localeData.types.language[languageDisplay]
  const languageName = (code: string) =>
    typesData[style][code] || typesData.long[code]
  const exact = languageName(canonicalCode)
  if (exact !== undefined) return exact

  const parts = canonicalCode.split('-')
  const scriptIndex = /^[A-Z][a-z]{3}$/.test(parts[1] || '') ? 1 : -1
  const regionIndex = parts.findIndex(
    (part, index) => index > 0 && /^(?:[A-Z]{2}|[0-9]{3})$/.test(part)
  )
  let script: string | undefined = parts[scriptIndex]
  let region: string | undefined = parts[regionIndex]
  let name: string | undefined
  if (languageDisplay === 'dialect') {
    if (script && region) {
      name = languageName(
        parts.filter((_, index) => index !== regionIndex).join('-')
      )
      if (name !== undefined) script = undefined
      else {
        name = languageName(
          parts.filter((_, index) => index !== scriptIndex).join('-')
        )
        if (name !== undefined) region = undefined
      }
    }
  }
  name ??= languageName(
    parts
      .filter((_, index) => index !== scriptIndex && index !== regionIndex)
      .join('-')
  )
  if (name === undefined || (!script && !region)) return undefined

  const qualifiers: string[] = []
  for (const [code, names] of [
    [script, localeData.types.script],
    [region, localeData.types.region],
  ] as const) {
    if (!code) continue
    const display = names[style][code] || names.long[code]
    if (!display && fallback === 'none') return undefined
    qualifiers.push(display || code)
  }
  const pattern = localeData.patterns.locale
  const nested = (value: string) =>
    value.replace(/[()（）]/g, bracket => {
      if (pattern.includes('(') && (bracket === '(' || bracket === ')'))
        return bracket === '(' ? '[' : ']'
      if (pattern.includes('（') && (bracket === '（' || bracket === '）'))
        return bracket === '（' ? '［' : '］'
      return bracket
    })
  const substitute = (format: string, first: string, second: string) =>
    format.replace(/\{([01])\}/g, (_, index) =>
      index === '0' ? first : second
    )
  const qualifier = qualifiers
    .map(nested)
    .reduce((first, second) =>
      substitute(localeData.patterns.separator ?? '{0}, {1}', first, second)
    )
  return substitute(pattern, nested(name), qualifier)
}
