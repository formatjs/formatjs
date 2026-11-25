import {
  TypeErrorConstructor,
  createFromConstructor,
  nullClassBase,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  canonicalizeLocaleDataTag,
  registerLocaleData,
} from '#packages/ecma402-abstract/registerLocaleData.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {GetOptionsObject} from '#packages/ecma402-abstract/GetOptionsObject.js'
import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import {SupportedLocales} from '#packages/ecma402-abstract/SupportedLocales.js'
import {
  type ListPatternData,
  type ListPatternFieldsData,
  type ListPatternLocaleData,
} from '#packages/ecma402-abstract/types/list.js'
import {
  type LiteralPart,
  invariant,
  isLiteralPart,
} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {HEBREW_SCRIPT_RANGES} from '@formatjs_generated/unicode/regex.js'

// ECMA-402 §9.2.7 step 3 resolves the internal default locale.
// https://tc39.es/ecma402/#sec-resolvelocale
let defaultLocale = ''
function getDefaultLocale(): string {
  return defaultLocale
}

export interface IntlListFormatOptions {
  /**
   * The locale matching algorithm to use.
   * Possible values are "lookup" and "best fit"; the default is "best fit".
   * For information about this option, see
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_negotiation.
   */
  localeMatcher?: 'best fit' | 'lookup'
  /**
   * The format of output message.
   * Possible values are :
   * - "conjunction" that stands for "and"-based lists (default, e.g., "A, B, and C")
   * - "disjunction" that stands for "or"-based lists (e.g., "A, B, or C").
   * - "unit" stands for lists of values with units (e.g., "5 pounds, 12 ounces").
   */
  type?: 'conjunction' | 'disjunction' | 'unit'
  /**
   * The length of the formatted message.
   * Possible values are:
   * - "long" (default, e.g., "A, B, and C");
   * - "short" (e.g., "A, B, C"), or
   * - "narrow" (e.g., "A B C").
   */
  style?: 'long' | 'short' | 'narrow'
}

export interface ResolvedIntlListFormatOptions {
  /**
   * A string with a BCP 47 language tag, or an array of such strings.
   * For the general form and interpretation of the locales argument,
   * see the [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation) page.
   */
  locale: string
  /**
   * The format of output message.
   * Possible values are :
   * - "conjunction" that stands for "and"-based lists (default, e.g., "A, B, and C")
   * - "disjunction" that stands for "or"-based lists (e.g., "A, B, or C").
   * - "unit" stands for lists of values with units (e.g., "5 pounds, 12 ounces").
   */
  type: 'conjunction' | 'disjunction' | 'unit'
  /**
   * The length of the formatted message.
   * Possible values are:
   * - "long" (default, e.g., "A, B, and C");
   * - "short" (e.g., "A, B, C"), or
   * - "narrow" (e.g., "A B C").
   */
  style: 'long' | 'short' | 'narrow'
}

export type Part<T = string> = LiteralPart | ElementPart | ElementPart<T>

export interface ElementPart<T = string> {
  type: 'element'
  value: T
}

type Placeable = Part | Placeable[]
const isArray = Array.isArray

// ECMA-402 §14.4: instance slots, with [[Templates]] stored as four fields.
// https://tc39.es/ecma402/#sec-properties-of-intl-listformat-instances
interface ListFormatInternal {
  style: ResolvedIntlListFormatOptions['style']
  type: ResolvedIntlListFormatOptions['type']
  locale: string
  contextLanguage: string
  templatePair: string
  templateStart: string
  templateEnd: string
  templateMiddle: string
}

// ECMA-402 §14.3.2–14.3.4 step 2 requires [[InitializedListFormat]].
// https://tc39.es/ecma262/#sec-requireinternalslot
const listFormatSlots = new WeakMap<ListFormat, ListFormatInternal>()
const getListFormatSlots = WeakMap.prototype.get.bind(listFormatSlots)
const setListFormatSlots = WeakMap.prototype.set.bind(listFormatSlots)
function requireListFormatSlots(instance: ListFormat): ListFormatInternal {
  const slots = getListFormatSlots(instance)
  if (!slots) {
    throw new TypeErrorConstructor('Incompatible Intl.ListFormat receiver')
  }
  return slots
}

// ECMA-402 §14.5.5 steps 1–4 consume once and close on non-string values.
// https://tc39.es/ecma402/#sec-createstringlistfromiterable
// ECMA-262 §7.4.11 preserves the original throw during IteratorClose.
// https://tc39.es/ecma262/#sec-iteratorclose
function stringListFromIterable(iterable?: Iterable<unknown>): string[] {
  if (iterable === undefined) return []
  const elements: string[] = []
  for (const value of iterable) {
    if (typeof value !== 'string') {
      throw new TypeErrorConstructor('Iterable yielded a non-string value')
    }
    setDataProperty(elements, elements.length, value)
  }
  return elements
}

const charCodeAt = Function.prototype.call.bind(
  String.prototype.charCodeAt
) as (value: string, index: number) => number
const codePointAt = Function.prototype.call.bind(
  String.prototype.codePointAt
) as (value: string, index: number) => number | undefined
const stringIndexOf = Function.prototype.call.bind(
  String.prototype.indexOf
) as (value: string, search: string) => number
const stringSlice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number,
  end: number
) => string

function startsWithHebrew(text: string): boolean {
  const first = codePointAt(text, 0)!
  // Unicode 17 Script data, matching the Rust ICU4X predicate.
  // https://www.unicode.org/Public/17.0.0/ucd/Scripts.txt
  for (let i = 0; i < HEBREW_SCRIPT_RANGES.length; i++) {
    const range = HEBREW_SCRIPT_RANGES[i]
    if (first >= range[0] && first <= range[1]) return true
  }
  return false
}

// ECMA-402 §14.5.2 steps 3.a and 7.b allow context-sensitive templates.
// https://tc39.es/ecma402/#sec-createpartsfromlist
// https://github.com/unicode-org/icu/blob/release-78.1/icu4c/source/i18n/listformatter.cpp#L124-L211
function contextualPattern(
  pattern: string,
  next: string,
  language: string
): string {
  if (!next.length) return pattern
  if (language === 'es') {
    const first = charCodeAt(next, 0) | 32
    const second = charCodeAt(next, 1) | 32
    if (pattern === '{0} y {1}') {
      // "i" or "hi", excluding "hia" and "hie".
      const third = charCodeAt(next, 2) | 32
      if (
        first === 105 ||
        (first === 104 && second === 105 && third !== 97 && third !== 101)
      )
        return '{0} e {1}'
    }
    if (pattern === '{0} o {1}') {
      // "o", "ho", "8", or the complete number "11".
      if (
        first === 111 ||
        first === 56 ||
        (first === 104 && second === 111) ||
        (first === 49 &&
          second === 49 &&
          (next.length === 2 || next[2] === ' '))
      )
        return '{0} u {1}'
    }
  } else if (
    (language === 'he' || language === 'iw') &&
    pattern === '{0} ו{1}' &&
    !startsWithHebrew(next)
  ) {
    return '{0} ו-{1}'
  }
  return pattern
}

// ECMA-402 §14.5.2: pair for two items, otherwise fold end, middle, and start.
// https://tc39.es/ecma402/#sec-createpartsfromlist
function createPartsFromList(slots: ListFormatInternal, list: string[]) {
  const size = list.length
  if (size === 0) {
    return []
  }
  if (size === 2) {
    const pattern = contextualPattern(
      slots.templatePair,
      list[1],
      slots.contextLanguage
    )
    const first: Part = {type: 'element', value: list[0]}
    const second: Part = {type: 'element', value: list[1]}
    return deconstructPattern(pattern, {'0': first, '1': second})
  }
  const last: Part = {
    type: 'element',
    value: list[size - 1],
  }
  let parts: Placeable = last
  let i = size - 2
  while (i >= 0) {
    let pattern
    if (i === 0) {
      pattern = slots.templateStart
    } else if (i < size - 2) {
      pattern = slots.templateMiddle
    } else {
      pattern = contextualPattern(
        slots.templateEnd,
        list[size - 1],
        slots.contextLanguage
      )
    }
    const head: Part = {type: 'element', value: list[i]}
    parts = deconstructPattern(pattern, {'0': head, '1': parts})
    i--
  }
  return parts
}

// ECMA-402 §14.5.1: substitute records and lists in pattern order.
// Keep substitutions nested until traversal to avoid copying each suffix.
// https://tc39.es/ecma402/#sec-deconstructpattern
function deconstructPattern(
  pattern: string,
  placeables: Record<string, Placeable>
) {
  const patternParts = PartitionPattern(pattern)
  const result: Placeable[] = []
  for (let index = 0; index < patternParts.length; index++) {
    const patternPart = patternParts[index]
    const {type: part} = patternPart
    if (isLiteralPart(patternPart)) {
      setDataProperty(result, result.length, {
        type: 'literal',
        value: patternPart.value,
      })
    } else {
      invariant(
        part === '0' || part === '1',
        `Invalid list placeholder ${part}`
      )
      setDataProperty(result, result.length, placeables[part])
    }
  }
  return result
}

function visitParts(parts: Placeable, visit: (part: Part) => void): void {
  const pending = [parts]
  while (pending.length) {
    const part = pending[pending.length - 1]
    pending.length--
    if (isArray(part)) {
      for (let index = part.length - 1; index >= 0; index--) {
        setDataProperty(pending, pending.length, part[index])
      }
    } else {
      visit(part)
    }
  }
}

// Class syntax supplies the prototype and constructor descriptors.
// ECMA-402 §14.2.1 https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype
// ECMA-402 §14.3.1 https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype.constructor
export default class ListFormat extends nullClassBase {
  // @ts-expect-error TS2377: extends null and returns its own receiver.
  // oxlint-disable-next-line constructor-super -- The constructor returns its allocated receiver.
  constructor(locales?: string | string[], options?: IntlListFormatOptions) {
    // ECMA-402 §14.1.1 uses NewTarget to allocate the branded receiver.
    // https://tc39.es/ecma402/#sec-Intl.ListFormat
    const receiver = createFromConstructor(new.target, ListFormat.prototype)
    const {localeData} = ListFormat
    const requestedLocales = CanonicalizeLocaleList(locales)
    // ECMA-402 §14.1.1 steps 3–6: resolve locale and read options in order.
    // https://tc39.es/ecma402/#sec-Intl.ListFormat
    const opts = GetOptionsObject(options)
    const matcher = GetOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    )
    const opt = {__proto__: null, localeMatcher: matcher}
    const r = ResolveLocale(
      ListFormat.availableLocales,
      requestedLocales,
      opt,
      [],
      localeData,
      getDefaultLocale,
      'hostDefaultWithLocaleData'
    )
    // ECMA-402 §9.2.7 step 6.c captures the locale record before type and style.
    // https://tc39.es/ecma402/#sec-resolvelocale
    const dataLocaleData = r.localeData
    // ECMA-402 §14.1.1 steps 7–10: read type before style, with defaults.
    const type: keyof ListPatternFieldsData = GetOption(
      opts,
      'type',
      'string',
      ['conjunction', 'disjunction', 'unit'],
      'conjunction'
    )
    const style: keyof ListPatternData = GetOption(
      opts,
      'style',
      'string',
      ['long', 'short', 'narrow'],
      'long'
    )
    const {dataLocale} = r
    const separator = stringIndexOf(dataLocale, '-')
    invariant(!!dataLocaleData, `Missing locale data for ${dataLocale}`)
    const dataLocaleTypes = dataLocaleData[type]
    const templates = dataLocaleTypes![style]!
    setListFormatSlots(receiver, {
      locale: r.locale,
      type,
      style,
      contextLanguage:
        separator < 0 ? dataLocale : stringSlice(dataLocale, 0, separator),
      templatePair: templates.pair,
      templateStart: templates.start,
      templateMiddle: templates.middle,
      templateEnd: templates.end,
    })
    return receiver
  }
  // ECMA-402 §14.3.3 steps 2–4.
  // https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype.format
  format(elements?: Iterable<string>): string {
    const slots = requireListFormatSlots(this)
    let result = ''
    const parts = createPartsFromList(slots, stringListFromIterable(elements))
    // ECMA-402 §14.5.3 step 3: concatenate each part value.
    // https://tc39.es/ecma402/#sec-formatlist
    visitParts(parts, part => {
      result += part.value
    })
    return result
  }
  // ECMA-402 §14.3.4 steps 2–4.
  // https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype.formatToParts
  formatToParts(elements?: Iterable<string>): Part[] {
    const slots = requireListFormatSlots(this)
    const parts = createPartsFromList(slots, stringListFromIterable(elements))
    const result: Part[] = []
    // ECMA-402 §14.5.4: return fresh part objects and own array entries.
    // https://tc39.es/ecma402/#sec-formatlisttoparts
    visitParts(parts, ({type, value}) => {
      setDataProperty(result, result.length, {type, value})
    })
    return result
  }

  // ECMA-402 §14.3.2 steps 2–5: check the slot, then define properties in table order.
  // https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype.resolvedoptions
  resolvedOptions(): ResolvedIntlListFormatOptions {
    const {locale, type, style} = requireListFormatSlots(this)
    return {locale, type, style}
  }

  public static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<IntlListFormatOptions, 'localeMatcher'>
  ): string[] {
    // ECMA-402 §14.2.2 steps 1–3: canonicalize locales before reading options.
    // https://tc39.es/ecma402/#sec-Intl.ListFormat.supportedLocalesOf
    return SupportedLocales(
      ListFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  }

  public static __addLocaleData(...data: ListPatternLocaleData[]): void {
    for (const {data: d, locale: tag} of data) {
      const locale = canonicalizeLocaleDataTag(tag)
      registerLocaleData(
        locale,
        d,
        ListFormat.localeData,
        ListFormat.availableLocales
      )
      if (!defaultLocale) {
        defaultLocale = locale
      }
    }
  }
  // ECMA-402 §14.2.3: locale data supplies templates without extension keys.
  // https://tc39.es/ecma402/#sec-Intl.ListFormat-internal-slots
  static localeData: Record<string, ListPatternFieldsData | undefined> = {}
  private static availableLocales = new Set<string>()
  public static polyfilled = true
}

Object.setPrototypeOf(ListFormat.prototype, Object.prototype)

try {
  // ECMA-402 §14.3.5.
  // https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype-toStringTag
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(ListFormat.prototype, Symbol.toStringTag, {
      value: 'Intl.ListFormat',
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  // https://github.com/tc39/test262/blob/master/test/intl402/ListFormat/constructor/length.js
  Object.defineProperty(ListFormat.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  })
  // https://github.com/tc39/test262/blob/master/test/intl402/ListFormat/constructor/supportedLocalesOf/length.js
  Object.defineProperty(ListFormat.supportedLocalesOf, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  })
} catch {
  // Meta fix so we're test262-compliant, not important
}
