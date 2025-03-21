import {
  CoerceOptionsToObject,
  GetOption,
  HasOwnProperty,
  SameValue,
  createDataProperty,
  invariant,
} from '@formatjs/ecma402-abstract'
import {supportedValuesOf} from '@formatjs/intl-enumerator'
import {
  UnicodeExtension,
  UnicodeLanguageId,
  emitUnicodeLanguageId,
  emitUnicodeLocaleId,
  getCanonicalLocales,
  isStructurallyValidLanguageTag,
  isUnicodeLanguageSubtag,
  isUnicodeRegionSubtag,
  isUnicodeScriptSubtag,
  likelySubtags,
  parseUnicodeLanguageId,
  parseUnicodeLocaleId,
} from '@formatjs/intl-getcanonicallocales'
import {characterOrders} from './character-orders.generated'
import getInternalSlots from './get_internal_slots'
import {numberingSystems} from './numbering-systems.generated'
import {
  getCalendarPreferenceDataForRegion,
  getHourCyclesPreferenceDataForLocaleOrRegion,
  getTimeZonePreferenceForRegion,
  getWeekDataForRegion,
} from './preference-data'

import type {CharacterOrder} from './character-orders.generated'
import type {WeekInfoInternal} from './preference-data'

export interface IntlLocaleOptions {
  language?: string
  script?: string
  region?: string
  calendar?: string
  collation?: string
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24'
  caseFirst?: 'upper' | 'lower' | 'false'
  numberingSystem?: string
  numeric?: boolean
  firstDayOfWeek?: string
}

const ALPHANUM_3_8 = /^[a-z0-9]{3,8}$/i

const RELEVANT_EXTENSION_KEYS = [
  'ca',
  'co',
  'hc',
  'kf',
  'kn',
  'nu',
  'fw',
] as const
type RELEVANT_EXTENSION_KEY = (typeof RELEVANT_EXTENSION_KEYS)[number]
type ExtensionOpts = Record<RELEVANT_EXTENSION_KEY, string>

export interface IntlLocaleInternal extends IntlLocaleOptions {
  locale: string
  initializedLocale: boolean
}

const UNICODE_TYPE_REGEX = /^[a-z0-9]{3,8}(-[a-z0-9]{3,8})*$/i

function applyOptionsToTag(tag: string, options: IntlLocaleOptions): string {
  invariant(typeof tag === 'string', 'language tag must be a string')
  invariant(
    isStructurallyValidLanguageTag(tag),
    'malformed language tag',
    RangeError
  )
  const language = GetOption(
    options,
    'language',
    'string',
    undefined,
    undefined
  )
  if (language !== undefined) {
    invariant(
      isUnicodeLanguageSubtag(language),
      'Malformed unicode_language_subtag',
      RangeError
    )
  }
  const script = GetOption(options, 'script', 'string', undefined, undefined)
  if (script !== undefined) {
    invariant(
      isUnicodeScriptSubtag(script),
      'Malformed unicode_script_subtag',
      RangeError
    )
  }
  const region = GetOption(options, 'region', 'string', undefined, undefined)
  if (region !== undefined) {
    invariant(
      isUnicodeRegionSubtag(region),
      'Malformed unicode_region_subtag',
      RangeError
    )
  }
  const languageId = parseUnicodeLanguageId(tag)
  if (language !== undefined) {
    languageId.lang = language
  }
  if (script !== undefined) {
    languageId.script = script
  }
  if (region !== undefined) {
    languageId.region = region
  }
  return ((Intl as any).getCanonicalLocales as typeof getCanonicalLocales)(
    emitUnicodeLocaleId({
      ...parseUnicodeLocaleId(tag),
      lang: languageId,
    })
  )[0]
}

function applyUnicodeExtensionToTag(
  tag: string,
  options: ExtensionOpts,
  relevantExtensionKeys: typeof RELEVANT_EXTENSION_KEYS
): ExtensionOpts & {locale: string} {
  let unicodeExtension: UnicodeExtension | undefined
  let keywords: UnicodeExtension['keywords'] = []
  const ast = parseUnicodeLocaleId(tag)
  for (const ext of ast.extensions) {
    if (ext.type === 'u') {
      unicodeExtension = ext
      if (Array.isArray(ext.keywords)) keywords = ext.keywords
    }
  }

  const result = Object.create(null)

  for (const key of relevantExtensionKeys) {
    let value, entry
    for (const keyword of keywords) {
      if (keyword[0] === key) {
        entry = keyword
        value = entry[1]
      }
    }
    invariant(key in options, `${key} must be in options`)
    const optionsValue = options[key]
    if (optionsValue !== undefined) {
      invariant(
        typeof optionsValue === 'string',
        `Value for ${key} must be a string`
      )
      value = optionsValue
      if (entry) {
        entry[1] = value
      } else {
        keywords.push([key, value])
      }
    }
    result[key] = value
  }
  if (!unicodeExtension) {
    if (keywords.length) {
      ast.extensions.push({
        type: 'u',
        keywords,
        attributes: [],
      })
    }
  } else {
    unicodeExtension.keywords = keywords
  }
  result.locale = (
    (Intl as any).getCanonicalLocales as typeof getCanonicalLocales
  )(emitUnicodeLocaleId(ast))[0]
  return result
}

function mergeUnicodeLanguageId(
  lang?: string,
  script?: string,
  region?: string,
  variants: string[] = [],
  replacement?: UnicodeLanguageId
): UnicodeLanguageId {
  if (!replacement) {
    return {
      lang: lang || 'und',
      script,
      region,
      variants,
    }
  }
  return {
    lang: !lang || lang === 'und' ? replacement.lang : lang,
    script: script || replacement.script,
    region: region || replacement.region,
    variants: [...variants, ...replacement.variants],
  }
}

function addLikelySubtags(tag: string): string {
  const ast = parseUnicodeLocaleId(tag)
  const unicodeLangId = ast.lang
  const {lang, script, region, variants} = unicodeLangId
  if (script && region) {
    const match =
      likelySubtags[
        emitUnicodeLanguageId({lang, script, region, variants: []}) as 'aa'
      ]
    if (match) {
      const parts = parseUnicodeLanguageId(match)
      ast.lang = mergeUnicodeLanguageId(
        undefined,
        undefined,
        undefined,
        variants,
        parts
      )
      return emitUnicodeLocaleId(ast)
    }
  }
  if (script) {
    const match =
      likelySubtags[emitUnicodeLanguageId({lang, script, variants: []}) as 'aa']
    if (match) {
      const parts = parseUnicodeLanguageId(match)
      ast.lang = mergeUnicodeLanguageId(
        undefined,
        undefined,
        region,
        variants,
        parts
      )
      return emitUnicodeLocaleId(ast)
    }
  }
  if (region) {
    const match =
      likelySubtags[emitUnicodeLanguageId({lang, region, variants: []}) as 'aa']
    if (match) {
      const parts = parseUnicodeLanguageId(match)
      ast.lang = mergeUnicodeLanguageId(
        undefined,
        script,
        undefined,
        variants,
        parts
      )
      return emitUnicodeLocaleId(ast)
    }
  }
  const match =
    likelySubtags[lang as 'aa'] ||
    likelySubtags[
      emitUnicodeLanguageId({lang: 'und', script, variants: []}) as 'aa'
    ]
  if (!match) {
    throw new Error(`No match for addLikelySubtags`)
  }
  const parts = parseUnicodeLanguageId(match)
  ast.lang = mergeUnicodeLanguageId(undefined, script, region, variants, parts)
  return emitUnicodeLocaleId(ast)
}

/**
 * From: https://github.com/unicode-org/icu/blob/4231ca5be053a22a1be24eb891817458c97db709/icu4j/main/classes/core/src/com/ibm/icu/util/ULocale.java#L2395
 * @param tag
 */
function removeLikelySubtags(tag: string): string {
  let maxLocale = addLikelySubtags(tag)
  if (!maxLocale) {
    return tag
  }
  maxLocale = emitUnicodeLanguageId({
    ...parseUnicodeLanguageId(maxLocale),
    variants: [],
  })
  const ast = parseUnicodeLocaleId(tag)
  const {
    lang: {lang, script, region, variants},
  } = ast
  const trial = addLikelySubtags(emitUnicodeLanguageId({lang, variants: []}))
  if (trial === maxLocale) {
    return emitUnicodeLocaleId({
      ...ast,
      lang: mergeUnicodeLanguageId(lang, undefined, undefined, variants),
    })
  }
  if (region) {
    const trial = addLikelySubtags(
      emitUnicodeLanguageId({lang, region, variants: []})
    )
    if (trial === maxLocale) {
      return emitUnicodeLocaleId({
        ...ast,
        lang: mergeUnicodeLanguageId(lang, undefined, region, variants),
      })
    }
  }
  if (script) {
    const trial = addLikelySubtags(
      emitUnicodeLanguageId({lang, script, variants: []})
    )
    if (trial === maxLocale) {
      return emitUnicodeLocaleId({
        ...ast,
        lang: mergeUnicodeLanguageId(lang, script, undefined, variants),
      })
    }
  }
  return tag
}

function createArrayFromListOrRestricted(
  list: any[],
  restricted: any
): Array<any> {
  let result = list
  if (restricted !== undefined) {
    result = [restricted]
  }

  return Array.from(result)
}

function calendarsOfLocale(loc: Locale): Array<string> {
  const locInternalSlots = getInternalSlots(loc)

  const restricted = locInternalSlots.calendar
  const locale = locInternalSlots.locale

  let region: string | undefined
  if (locale !== 'root') {
    region = loc.maximize().region
  }

  const preferredCalendars = getCalendarPreferenceDataForRegion(region)
  return createArrayFromListOrRestricted(preferredCalendars, restricted)
}

function collationsOfLocale(loc: Locale): Array<string> {
  const locInternalSlots = getInternalSlots(loc)

  const restricted = locInternalSlots.collation
  const locale = locInternalSlots.locale

  const supportedCollations = supportedValuesOf('collation', locale).filter(
    (co: string) => co !== 'standard' && co !== 'search'
  )
  supportedCollations.sort()

  return createArrayFromListOrRestricted(supportedCollations, restricted)
}

function hourCyclesOfLocale(loc: Locale): Array<string> {
  const locInternalSlots = getInternalSlots(loc)

  const restricted = locInternalSlots.hourCycle
  const locale = locInternalSlots.locale

  let region: string | undefined
  if (locale !== 'root') {
    region = loc.maximize().region
  }

  const preferredHourCycles = getHourCyclesPreferenceDataForLocaleOrRegion(
    locale,
    region
  )
  return createArrayFromListOrRestricted(preferredHourCycles, restricted)
}

function numberingSystemsOfLocale(loc: Locale): Array<string> {
  const locInternalSlots = getInternalSlots(loc)

  const restricted = locInternalSlots.numberingSystem
  const locale = locInternalSlots.locale
  const language = loc.language

  const localeNumberingSystems =
    numberingSystems[locale as keyof typeof numberingSystems] ??
    numberingSystems[language as keyof typeof numberingSystems]

  if (localeNumberingSystems) {
    return createArrayFromListOrRestricted(
      [...localeNumberingSystems],
      restricted
    )
  }

  return createArrayFromListOrRestricted([], restricted)
}

function timeZonesOfLocale(loc: Locale): Array<string> | undefined {
  const locInternalSlots = getInternalSlots(loc)

  const locale = locInternalSlots.locale
  const region = parseUnicodeLanguageId(locale).region

  if (!region) {
    return undefined
  }

  const preferredTimeZones = getTimeZonePreferenceForRegion(region)
  preferredTimeZones.sort()

  return Array.from(preferredTimeZones)
}

function translateCharacterOrder(order: CharacterOrder | undefined): string {
  if (order === 'right-to-left') {
    return 'rtl'
  }

  return 'ltr'
}

function characterDirectionOfLocale(loc: Locale): string {
  const locale = loc.minimize().toString() as keyof typeof characterOrders
  return translateCharacterOrder(characterOrders[locale])
}

function weekInfoOfLocale(loc: Locale): WeekInfoInternal {
  const locInternalSlots = getInternalSlots(loc)

  const locale = locInternalSlots.locale

  let region: string | undefined
  if (locale !== 'root') {
    region = loc.maximize().region
  }

  return getWeekDataForRegion(region)
}

const TABLE_1 = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function weekdayToString(fw: string) {
  return TABLE_1[+fw]
}

export class Locale {
  constructor(tag: string | Locale, opts?: IntlLocaleOptions) {
    // test262/test/intl402/RelativeTimeFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget = this && this instanceof Locale ? this.constructor : void 0
    if (!newTarget) {
      throw new TypeError("Intl.Locale must be called with 'new'")
    }

    const {relevantExtensionKeys} = Locale

    const internalSlotsList: Array<keyof IntlLocaleInternal> = [
      'initializedLocale',
      'locale',
      'calendar',
      'collation',
      'hourCycle',
      'numberingSystem',
    ]

    if (relevantExtensionKeys.indexOf('kf') > -1) {
      internalSlotsList.push('caseFirst')
    }

    if (relevantExtensionKeys.indexOf('kn') > -1) {
      internalSlotsList.push('numeric')
    }

    if (tag === undefined) {
      throw new TypeError(
        "First argument to Intl.Locale constructor can't be empty or missing"
      )
    }

    if (typeof tag !== 'string' && typeof tag !== 'object') {
      throw new TypeError('tag must be a string or object')
    }

    let tagInternalSlots
    if (
      typeof tag === 'object' &&
      (tagInternalSlots = getInternalSlots(tag)) &&
      HasOwnProperty(tagInternalSlots, 'initializedLocale')
    ) {
      tag = tagInternalSlots.locale
    } else {
      tag = tag.toString() as string
    }

    let internalSlots = getInternalSlots(this, internalSlotsList)

    let options = CoerceOptionsToObject<IntlLocaleOptions>(opts)

    tag = applyOptionsToTag(tag, options)
    const opt = Object.create(null)
    const calendar = GetOption(
      options,
      'calendar',
      'string',
      undefined,
      undefined
    )
    if (calendar !== undefined) {
      if (!UNICODE_TYPE_REGEX.test(calendar)) {
        throw new RangeError('invalid calendar')
      }
    }
    opt.ca = calendar

    const collation = GetOption(
      options,
      'collation',
      'string',
      undefined,
      undefined
    )
    if (collation !== undefined) {
      if (!UNICODE_TYPE_REGEX.test(collation)) {
        throw new RangeError('invalid collation')
      }
    }
    opt.co = collation
    let fw = GetOption(
      options,
      'firstDayOfWeek',
      'string',
      undefined,
      undefined
    )
    if (fw !== undefined) {
      fw = weekdayToString(fw)
      if (!ALPHANUM_3_8.test(fw)) {
        throw new RangeError('Invalid firstDayOfWeek')
      }
    }
    opt.fw = fw
    const hc = GetOption(
      options,
      'hourCycle',
      'string',
      ['h11', 'h12', 'h23', 'h24'],
      undefined
    )
    opt.hc = hc
    const kf = GetOption(
      options,
      'caseFirst',
      'string',
      ['upper', 'lower', 'false'],
      undefined
    )
    opt.kf = kf
    const _kn = GetOption(options, 'numeric', 'boolean', undefined, undefined)
    let kn
    if (_kn !== undefined) {
      kn = String(_kn)
    }
    opt.kn = kn
    const numberingSystem = GetOption(
      options,
      'numberingSystem',
      'string',
      undefined,
      undefined
    )
    if (numberingSystem !== undefined) {
      if (!UNICODE_TYPE_REGEX.test(numberingSystem)) {
        throw new RangeError('Invalid numberingSystem')
      }
    }
    opt.nu = numberingSystem
    const r = applyUnicodeExtensionToTag(tag, opt, relevantExtensionKeys)
    internalSlots.locale = r.locale
    internalSlots.calendar = r.ca
    internalSlots.collation = r.co
    internalSlots.firstDayOfWeek = r.fw
    internalSlots.hourCycle = r.hc as 'h11'

    if (relevantExtensionKeys.indexOf('kf') > -1) {
      internalSlots.caseFirst = r.kf as 'upper'
    }
    if (relevantExtensionKeys.indexOf('kn') > -1) {
      internalSlots.numeric = SameValue(r.kn, 'true')
    }
    internalSlots.numberingSystem = r.nu
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public maximize(): Locale {
    const locale = getInternalSlots(this).locale
    try {
      const maximizedLocale = addLikelySubtags(locale)
      return new Locale(maximizedLocale)
    } catch (e) {
      return new Locale(locale)
    }
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public minimize(): Locale {
    const locale = getInternalSlots(this).locale
    try {
      const minimizedLocale = removeLikelySubtags(locale)
      return new Locale(minimizedLocale)
    } catch (e) {
      return new Locale(locale)
    }
  }

  public toString(): string {
    return getInternalSlots(this).locale
  }

  public get baseName(): string {
    const locale = getInternalSlots(this).locale
    return emitUnicodeLanguageId(parseUnicodeLanguageId(locale))
  }

  public get calendar(): string | undefined {
    return getInternalSlots(this).calendar
  }

  public get collation(): string | undefined {
    return getInternalSlots(this).collation
  }

  public get caseFirst(): 'upper' | 'lower' | 'false' | undefined {
    return getInternalSlots(this).caseFirst
  }

  public get numeric(): boolean | undefined {
    return getInternalSlots(this).numeric
  }
  public get numberingSystem(): string | undefined {
    return getInternalSlots(this).numberingSystem
  }
  /**
   * https://tc39.es/proposal-intl-locale/#sec-Intl.Locale.prototype.language
   */
  public get language(): string {
    const locale = getInternalSlots(this).locale
    return parseUnicodeLanguageId(locale).lang
  }
  /**
   * https://tc39.es/proposal-intl-locale/#sec-Intl.Locale.prototype.script
   */
  public get script(): string | undefined {
    const locale = getInternalSlots(this).locale
    return parseUnicodeLanguageId(locale).script
  }
  /**
   * https://tc39.es/proposal-intl-locale/#sec-Intl.Locale.prototype.region
   */
  public get region(): string | undefined {
    const locale = getInternalSlots(this).locale
    return parseUnicodeLanguageId(locale).region
  }

  public get firstDayOfWeek(): string | undefined {
    const internalSlots = getInternalSlots(this)
    if (!HasOwnProperty(internalSlots, 'initializedLocale')) {
      throw new TypeError('Error uninitialized locale')
    }
    return internalSlots.firstDayOfWeek
  }

  public get hourCycle(): 'h11' | 'h12' | 'h23' | 'h24' | undefined {
    const internalSlots = getInternalSlots(this)
    if (!HasOwnProperty(internalSlots, 'initializedLocale')) {
      throw new TypeError('Error uninitialized locale')
    }
    return internalSlots.hourCycle
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getCalendars
   * https://tc39.es/proposal-intl-locale-info/#sec-Intl.Locale.prototype.getCalendars
   */
  public getCalendars(): string[] {
    return calendarsOfLocale(this)
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getCollations
   * https://tc39.es/proposal-intl-locale-info/#sec-Intl.Locale.prototype.getCollations
   */
  public getCollations(): string[] {
    return collationsOfLocale(this)
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getHourCycles
   * https://tc39.es/proposal-intl-locale-info/#sec-Intl.Locale.prototype.getHourCycles
   */
  public getHourCycles(): string[] {
    const internalSlots = getInternalSlots(this)
    if (!HasOwnProperty(internalSlots, 'initializedLocale')) {
      throw new TypeError('Error uninitialized locale')
    }

    return hourCyclesOfLocale(this)
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getNumberingSystems
   * https://tc39.es/proposal-intl-locale-info/#sec-Intl.Locale.prototype.getNumberingSystems
   */
  public getNumberingSystems(): string[] {
    return numberingSystemsOfLocale(this)
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getTimeZones
   * https://tc39.es/proposal-intl-locale-info/#sec-Intl.Locale.prototype.getTimeZones
   */
  public getTimeZones(): string[] | undefined {
    return timeZonesOfLocale(this)
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getTextInfo
   * https://tc39.es/proposal-intl-locale-info/#sec-Intl.Locale.prototype.getTextInfo
   */
  public getTextInfo(): {
    direction: string
  } {
    const info = Object.create(Object.prototype)
    const dir = characterDirectionOfLocale(this)

    createDataProperty(info, 'direction', dir)

    return info
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo
   * https://tc39.es/proposal-intl-locale-info/#sec-Intl.Locale.prototype.getWeekInfo
   */
  public getWeekInfo(): {
    firstDay: string
    weekend: {start: string; end: string}
    minimalDays: number
  } {
    const info = Object.create(Object.prototype)
    const internalSlots = getInternalSlots(this)
    if (!HasOwnProperty(internalSlots, 'initializedLocale')) {
      throw new TypeError('Error uninitialized locale')
    }

    const wi = weekInfoOfLocale(this)
    const we = wi.weekend

    createDataProperty(info, 'firstDay', wi.firstDay)

    createDataProperty(info, 'weekend', we)

    createDataProperty(info, 'minimalDays', wi.minimalDays)

    const fw = internalSlots.firstDayOfWeek
    if (fw !== undefined) {
      info.firstDay = fw
    }

    return info
  }

  static relevantExtensionKeys: readonly [
    'ca',
    'co',
    'hc',
    'kf',
    'kn',
    'nu',
    'fw',
  ] = RELEVANT_EXTENSION_KEYS
  public static readonly polyfilled = true
}

try {
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(Locale.prototype, Symbol.toStringTag, {
      value: 'Intl.Locale',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  Object.defineProperty(Locale.prototype.constructor, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}

export default Locale
