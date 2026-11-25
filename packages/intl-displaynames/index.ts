import {
  canonicalizeLocaleDataTag,
  registerLocaleData,
} from '#packages/ecma402-abstract/registerLocaleData.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {
  createFromConstructor,
  nullClassBase,
  setDataProperty,
  TypeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {GetOptionsObject} from '#packages/ecma402-abstract/GetOptionsObject.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {
  type DisplayNamesData,
  type DisplayNamesLocaleData,
} from '#packages/ecma402-abstract/types/displaynames.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {CanonicalCodeForDisplayNames} from '#packages/ecma402-abstract/DisplayNames/CanonicalCodeForDisplayNames.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'

// ECMA-402 §9.2.7 step 3 resolves the internal default locale.
// https://tc39.es/ecma402/#sec-resolvelocale
let defaultLocale = ''
function getDefaultLocale(): string {
  return defaultLocale
}

const apply = Reflect.apply
const stringSlice = String.prototype.slice
const stringIndexOf = String.prototype.indexOf
const stringSplit = String.prototype.split
const ownKeys = Object.keys
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty)

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
  languageDisplay?: NonNullable<DisplayNamesOptions['languageDisplay']>
}

// ECMA-402 §12.2 Constructor inherits Function.prototype.
// https://tc39.es/ecma402/#sec-properties-of-intl-displaynames-constructor
//
// Class syntax supplies the prototype and constructor descriptors.
// ECMA-402 §12.2.1 https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype
// ECMA-402 §12.3.1 https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.constructor
export class DisplayNames extends nullClassBase {
  // ECMA-402 §12.1.1 steps 1–5: allocate, canonicalize, and resolve locale options.
  // https://tc39.es/ecma402/#sec-Intl.DisplayNames
  // @ts-expect-error TS2377: extends null and returns its own receiver.
  // oxlint-disable-next-line constructor-super -- The constructor returns its allocated receiver.
  constructor(
    locales: string | string[] | undefined,
    options: DisplayNamesOptions
  ) {
    const receiver = createFromConstructor(new.target, DisplayNames.prototype)
    const {localeData} = DisplayNames
    const requestedLocales = CanonicalizeLocaleList(locales)
    if (options === undefined) {
      throw new TypeErrorConstructor('Intl.DisplayNames requires options')
    }
    options = GetOptionsObject(options)

    const matcher = GetOption(
      options,
      'localeMatcher',
      'string',
      ['lookup', 'best fit'],
      'best fit'
    )
    const opt = {__proto__: null, localeMatcher: matcher}

    const r = ResolveLocale(
      DisplayNames.availableLocales,
      requestedLocales,
      opt,
      [], // there is no relevantExtensionKeys
      localeData,
      getDefaultLocale,
      'hostDefaultWithLocaleData'
    )
    // ECMA-402 §9.2.7 step 6.c captures the locale record before style getters.
    // https://tc39.es/ecma402/#sec-resolvelocale
    const dataLocaleData = r.localeData

    // ECMA-402 §12.1.1 steps 6–12 read style, required type, and fallback.
    const style = GetOption(
      options,
      'style',
      'string',
      ['narrow', 'short', 'long'],
      'long'
    )

    const type = GetOption(
      options,
      'type',
      'string',
      ['language', 'region', 'script', 'currency', 'calendar', 'dateTimeField'],
      undefined
    )
    if (type === undefined) {
      throw new TypeErrorConstructor(
        'Intl.DisplayNames constructor requires "type" option'
      )
    }

    const fallback = GetOption(
      options,
      'fallback',
      'string',
      ['code', 'none'],
      'code'
    )
    invariant(
      dataLocaleData !== undefined,
      `locale data for ${r.locale} does not exist.`
    )
    const {types} = dataLocaleData
    invariant(typeof types === 'object' && types != null, 'invalid types data')
    // Steps 13–22 read languageDisplay for every type, then select fields.
    const languageDisplay = GetOption(
      options,
      'languageDisplay',
      'string',
      ['dialect', 'standard'],
      'dialect'
    )
    const typeFields = types[type]
    invariant(
      typeof typeFields === 'object' && typeFields != null,
      'invalid typeFields data'
    )
    if (type === 'language') {
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
    setSlots(receiver, {
      locale: r.locale,
      style,
      type,
      fallback,
      languageDisplay: type === 'language' ? languageDisplay : undefined,
      localeData: dataLocaleData,
    })
    return receiver
  }

  // ECMA-402 §12.2.2 canonicalizes locales before reading filter options.
  // https://tc39.es/ecma402/#sec-Intl.DisplayNames.supportedLocalesOf
  // ECMA-262 §18: only required parameters count toward length.
  // https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
  static supportedLocalesOf(
    locales?: string | string[],
    options: Pick<DisplayNamesOptions, 'localeMatcher'> | undefined = undefined
  ): string[] {
    return SupportedLocales(
      DisplayNames.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  }

  static __addLocaleData(...data: DisplayNamesLocaleData[]): void {
    for (const {data: d, locale: tag} of data) {
      const locale = canonicalizeLocaleDataTag(tag)
      registerLocaleData(
        locale,
        d,
        DisplayNames.localeData,
        DisplayNames.availableLocales
      )
      if (!defaultLocale) {
        defaultLocale = locale
      }
    }
  }

  of(code: string | number | Record<string, unknown>): string | undefined {
    const {type, localeData, style, fallback, languageDisplay} = requireSlots(
      this,
      'of'
    )
    // ECMA-402 §12.3.3 steps 3–4 coerce and canonicalize before lookup.
    // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.of
    const canonicalCode = CanonicalCodeForDisplayNames(type, ToString(code))
    let name: string | undefined
    if (type === 'language') {
      name = getNameForTypeLanguage(
        languageDisplay!,
        localeData,
        style,
        canonicalCode,
        fallback
      )
    } else {
      name = lookupName(
        localeData.types[type],
        style,
        canonicalCode,
        type === 'dateTimeField' && canonicalCode === 'dayPeriod'
          ? 'dayperiod'
          : undefined
      )
    }

    if (name !== undefined) {
      return name
    }

    if (fallback === 'code') {
      return canonicalCode
    }
  }

  resolvedOptions(): DisplayNamesResolvedOptions {
    // ECMA-402 §12.3.2 step 4.c omits undefined slots in table order.
    // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.resolvedOptions
    const {locale, style, type, fallback, languageDisplay} = requireSlots(
      this,
      'resolvedOptions'
    )
    return languageDisplay === undefined
      ? {locale, style, type, fallback}
      : {locale, style, type, fallback, languageDisplay}
  }

  // ECMA-402 §12.2.3: locale data supplies name tables by type and style.
  // https://tc39.es/ecma402/#sec-Intl.DisplayNames-internal-slots
  static localeData: Record<string, DisplayNamesData | undefined> = {}
  private static availableLocales = new Set<string>()
  public static readonly polyfilled = true
}

// ECMA-402 §12.3 Ordinary prototype inherits Object.prototype and has no instance slots.
// https://tc39.es/ecma402/#sec-properties-of-intl-displaynames-prototype-object
Object.setPrototypeOf(DisplayNames.prototype, Object.prototype)

try {
  // ECMA-402 §12.3.4.
  // https://tc39.es/ecma402/#sec-intl.displaynames.prototype-%symbol.tostringtag%
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
  languageDisplay: DisplayNamesOptions['languageDisplay']
  // Name lookup uses the selected locale record, including CLDR fallbacks.
  localeData: DisplayNamesData
}

// ECMA-402 §12.4: keep each instance's fields and options private.
// https://tc39.es/ecma402/#sec-properties-of-intl-displaynames-instances
const __INTERNAL_SLOT_MAP__ = new WeakMap<
  DisplayNames,
  DisplayNamesInternalSlots
>()
const getSlots = WeakMap.prototype.get.bind(__INTERNAL_SLOT_MAP__)
const setSlots = WeakMap.prototype.set.bind(__INTERNAL_SLOT_MAP__)

// ECMA-402 §12.3.2 and §12.3.3 step 2 require the [[InitializedDisplayNames]] slot.
// https://tc39.es/ecma262/#sec-requireinternalslot
function requireSlots(
  receiver: DisplayNames,
  methodName: string
): DisplayNamesInternalSlots {
  const slots = getSlots(receiver)
  if (!slots) {
    throw new TypeErrorConstructor(
      `Method Intl.DisplayNames.prototype.${methodName} called on incompatible receiver`
    )
  }
  return slots
}

// ECMA-402 §12.3.3 step 6 checks Record field presence. Empty strings are names.
// https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.of
function lookupName(
  names: DisplayNamesData['types']['region'],
  style: DisplayNamesInternalSlots['style'],
  code: string,
  legacyCode?: string
): string | undefined {
  const fields = names[style]
  if (hasOwn(fields, code)) return fields[code]
  if (legacyCode !== undefined && hasOwn(fields, legacyCode))
    return fields[legacyCode]
  if (style !== 'long') {
    if (hasOwn(names.long, code)) return names.long[code]
    if (legacyCode !== undefined && hasOwn(names.long, legacyCode))
      return names.long[legacyCode]
  }
}

// UTS 35 Part 2, Locale Display Name Algorithm steps 2–4.
// https://unicode.org/reports/tr35/tr35-general.html#Locale_Display_Name_Algorithm
function matchVariantLanguage(
  names: DisplayNamesData['types']['region'],
  style: DisplayNamesInternalSlots['style'],
  subtags: readonly string[]
): {code: string; consumed: number[]} {
  let code = subtags[0]
  let consumed: number[] = []
  const prefix = code + '-'
  const fields = style === 'long' ? [names.long] : [names[style], names.long]
  for (let table = 0; table < fields.length; table++) {
    const keys = ownKeys(fields[table])
    for (let k = 0; k < keys.length; k++) {
      const candidate = keys[k]
      if (apply(stringIndexOf, candidate, [prefix]) !== 0) continue
      const suffix = apply(stringSlice, candidate, [prefix.length])
      const parts = apply(stringSplit, suffix, ['-']) as string[]
      if (parts.length < consumed.length || parts.length >= subtags.length)
        continue
      const positions: number[] = []
      let input = 1
      for (let j = 0; j < parts.length; j++) {
        while (input < subtags.length && subtags[input] !== parts[j]) input++
        if (input === subtags.length) break
        setDataProperty(positions, positions.length, input++)
      }
      if (positions.length !== parts.length) continue
      let better = positions.length > consumed.length
      if (positions.length === consumed.length) {
        for (let j = 0; j < positions.length; j++) {
          if (positions[j] === consumed[j]) continue
          better = positions[j] < consumed[j]
          break
        }
      }
      if (better) {
        code = candidate
        consumed = positions
      }
    }
  }
  return {code, consumed}
}

function getNameForTypeLanguage(
  languageDisplay: NonNullable<DisplayNamesOptions['languageDisplay']>,
  localeData: DisplayNamesData,
  style: DisplayNamesInternalSlots['style'],
  canonicalCode: string,
  fallback: DisplayNamesInternalSlots['fallback']
): string | undefined {
  const typesData = localeData.types.language[languageDisplay]
  const exact = lookupName(typesData, style, canonicalCode)
  if (exact !== undefined) return exact

  const subtags = apply(stringSplit, canonicalCode, ['-']) as string[]
  let cursor = 1
  const first = subtags.length > 1 ? subtags[1] : undefined
  // A canonical four-letter script starts uppercase.
  const script =
    first?.length === 4 && first[0] >= 'A' && first[0] <= 'Z' ? cursor++ : -1
  const second = cursor < subtags.length ? subtags[cursor] : undefined
  const region = second?.length === 2 || second?.length === 3 ? cursor++ : -1
  const language = subtags[0]
  let code = language
  let consumed: number[] = []
  if (languageDisplay === 'dialect') {
    if (cursor < subtags.length) {
      const match = matchVariantLanguage(typesData, style, subtags)
      code = match.code
      consumed = match.consumed
    } else if (script >= 0 && region >= 0) {
      // With only script and region left, the script wins equal-length matches.
      const withScript = language + '-' + subtags[script]
      const withRegion = language + '-' + subtags[region]
      if (lookupName(typesData, style, withScript) !== undefined) {
        code = withScript
        consumed = [script]
      } else if (lookupName(typesData, style, withRegion) !== undefined) {
        code = withRegion
        consumed = [region]
      }
    }
  }
  const name = lookupName(typesData, style, code)
  if (name === undefined) return undefined

  const pattern = localeData.patterns.locale
  const usesAsciiBrackets = apply(stringIndexOf, pattern, ['(']) !== -1
  const usesWideBrackets = apply(stringIndexOf, pattern, ['（']) !== -1
  const nested = (value: string) => {
    let result = ''
    for (let index = 0; index < value.length; index++) {
      const char = value[index]
      if (usesAsciiBrackets && char === '(') result += '['
      else if (usesAsciiBrackets && char === ')') result += ']'
      else if (usesWideBrackets && char === '（') result += '［'
      else if (usesWideBrackets && char === '）') result += '］'
      else result += char
    }
    return result
  }
  let qualifier: string | undefined
  let skip = 0
  const separator = localeData.patterns.separator ?? '{0}, {1}'
  for (let i = 1; i < subtags.length; i++) {
    if (skip < consumed.length && consumed[skip] === i) {
      skip++
      continue
    }
    const map =
      i === script
        ? localeData.types.script
        : i === region
          ? localeData.types.region
          : localeData.types.variant
    // Older packs have no variant data. Let of() apply its whole-code fallback.
    if (map === undefined) return undefined
    const label = lookupName(map, style, subtags[i])
    if (label === undefined && fallback === 'none') return undefined
    const part = nested(label ?? subtags[i])
    qualifier =
      qualifier === undefined
        ? part
        : substitutePattern(separator, qualifier, part)
  }
  return qualifier === undefined
    ? name
    : substitutePattern(pattern, nested(name), qualifier)
}

function substitutePattern(
  pattern: string,
  first: string,
  second: string
): string {
  let result = ''
  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index]
    if (
      char === '{' &&
      index + 2 < pattern.length &&
      pattern[index + 2] === '}'
    ) {
      const field = pattern[index + 1]
      if (field === '0' || field === '1') {
        result += field === '0' ? first : second
        index += 2
        continue
      }
    }
    result += char
  }
  return result
}
