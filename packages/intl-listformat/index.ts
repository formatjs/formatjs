import {
  GetOption,
  ListPatternLocaleData,
  setInternalSlot,
  SupportedLocales,
  getInternalSlot,
  ListPatternFieldsData,
  ListPatternData,
  PartitionPattern,
  invariant,
  isLiteralPart,
  LiteralPart,
  GetOptionsObject,
  CanonicalizeLocaleList,
} from '@formatjs/ecma402-abstract'
import {ResolveLocale} from '@formatjs/intl-localematcher'

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
   * When style is "short" or "narrow", "unit" is the only allowed value for the type option.
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
   * When style is "short" or "narrow", "unit" is the only allowed value for the type option.
   */
  style: 'long' | 'short' | 'narrow'
}

export type Part<T = string> = LiteralPart | ElementPart | ElementPart<T>

export interface ElementPart<T = string> {
  type: 'element'
  value: T
}

interface Placeable {
  type: string
  value: string
}

interface ListFormatInternal {
  style: IntlListFormatOptions['style']
  type: IntlListFormatOptions['type']
  locale: string
  templatePair: string
  templateStart: string
  templateEnd: string
  templateMiddle: string
  initializedListFormat: boolean
}

function validateInstance(instance: any, method: string) {
  if (!(instance instanceof ListFormat)) {
    throw new TypeError(
      `Method Intl.ListFormat.prototype.${method} called on incompatible receiver ${String(
        instance
      )}`
    )
  }
}

/**
 * https://tc39.es/proposal-intl-list-format/#sec-createstringlistfromiterable
 * @param list list
 */
function stringListFromIterable(list: any[]): string[] {
  if (list === undefined) {
    return []
  }
  const result = []
  for (const el of list) {
    if (typeof el !== 'string') {
      throw new TypeError(`array list[${list.indexOf(el)}] is not type String`)
    }
    result.push(el)
  }
  return result
}

function createPartsFromList(
  internalSlotMap: WeakMap<ListFormat, ListFormatInternal>,
  lf: ListFormat,
  list: string[]
) {
  const size = list.length
  if (size === 0) {
    return []
  }
  if (size === 2) {
    const pattern = getInternalSlot(internalSlotMap, lf, 'templatePair')
    const first = {type: 'element', value: list[0]}
    const second = {type: 'element', value: list[1]}
    return deconstructPattern(pattern, {'0': first, '1': second})
  }
  const last = {
    type: 'element',
    value: list[size - 1],
  }
  let parts: Placeable[] | Placeable = last
  let i = size - 2
  while (i >= 0) {
    let pattern
    if (i === 0) {
      pattern = getInternalSlot(internalSlotMap, lf, 'templateStart')
    } else if (i < size - 2) {
      pattern = getInternalSlot(internalSlotMap, lf, 'templateMiddle')
    } else {
      pattern = getInternalSlot(internalSlotMap, lf, 'templateEnd')
    }
    const head = {type: 'element', value: list[i]}
    parts = deconstructPattern(pattern, {'0': head, '1': parts})
    i--
  }
  return parts
}

function deconstructPattern(
  pattern: string,
  placeables: Record<string, Placeable | Placeable[]>
) {
  const patternParts = PartitionPattern(pattern)
  const result: Placeable[] = []
  for (const patternPart of patternParts) {
    const {type: part} = patternPart
    if (isLiteralPart(patternPart)) {
      result.push({
        type: 'literal',
        value: patternPart.value,
      })
    } else {
      invariant(part in placeables, `${part} is missing from placables`)
      const subst = placeables[part]
      if (Array.isArray(subst)) {
        result.push(...subst)
      } else {
        result.push(subst)
      }
    }
  }
  return result
}

export default class ListFormat {
  constructor(locales?: string | string[], options?: IntlListFormatOptions) {
    // test262/test/intl402/ListFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof ListFormat ? this.constructor : void 0
    if (!newTarget) {
      throw new TypeError("Intl.ListFormat must be called with 'new'")
    }
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'initializedListFormat',
      true
    )
    const requestedLocales = CanonicalizeLocaleList(locales)
    const opt: any = Object.create(null)
    const opts = GetOptionsObject(options)
    const matcher = GetOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    )
    opt.localeMatcher = matcher
    const {localeData} = ListFormat
    const r = ResolveLocale(
      ListFormat.availableLocales,
      requestedLocales,
      opt,
      ListFormat.relevantExtensionKeys,
      localeData,
      ListFormat.getDefaultLocale
    )
    setInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'locale', r.locale)
    const type: keyof ListPatternFieldsData = GetOption(
      opts,
      'type',
      'string',
      ['conjunction', 'disjunction', 'unit'],
      'conjunction'
    )
    setInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'type', type)
    const style: keyof ListPatternData = GetOption(
      opts,
      'style',
      'string',
      ['long', 'short', 'narrow'],
      'long'
    )
    setInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'style', style)
    const {dataLocale} = r
    const dataLocaleData = localeData[dataLocale]
    invariant(!!dataLocaleData, `Missing locale data for ${dataLocale}`)
    const dataLocaleTypes = dataLocaleData[type]
    const templates = dataLocaleTypes![style]!
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'templatePair',
      templates.pair
    )
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'templateStart',
      templates.start
    )
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'templateMiddle',
      templates.middle
    )
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'templateEnd',
      templates.end
    )
  }
  format(elements: string[]): string {
    validateInstance(this, 'format')
    let result = ''
    const parts = createPartsFromList(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      stringListFromIterable(elements)
    )
    if (!Array.isArray(parts)) {
      return parts.value
    }
    for (const p of parts) {
      result += p.value
    }
    return result
  }
  formatToParts(elements: string[]): Part[] {
    validateInstance(this, 'format')
    const parts = createPartsFromList(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      stringListFromIterable(elements)
    )
    if (!Array.isArray(parts)) {
      return [parts as Part]
    }
    const result: Part[] = []
    for (const part of parts) {
      result.push({...part} as Part)
    }
    return result
  }

  resolvedOptions(): ResolvedIntlListFormatOptions {
    validateInstance(this, 'resolvedOptions')
    return {
      locale: getInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'locale'),
      type: getInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'type')!,
      style: getInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'style')!,
    }
  }

  public static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<IntlListFormatOptions, 'localeMatcher'>
  ) {
    // test262/test/intl402/ListFormat/constructor/supportedLocalesOf/result-type.js
    return SupportedLocales(
      ListFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    )
  }

  public static __addLocaleData(...data: ListPatternLocaleData[]) {
    for (const {data: d, locale} of data) {
      const minimizedLocale = new (Intl as any).Locale(locale)
        .minimize()
        .toString()
      ListFormat.localeData[locale] = ListFormat.localeData[minimizedLocale] = d
      ListFormat.availableLocales.add(minimizedLocale)
      ListFormat.availableLocales.add(locale)
      if (!ListFormat.__defaultLocale) {
        ListFormat.__defaultLocale = minimizedLocale
      }
    }
  }
  static localeData: Record<string, ListPatternFieldsData | undefined> = {}
  private static availableLocales = new Set<string>()
  private static __defaultLocale = ''
  private static getDefaultLocale() {
    return ListFormat.__defaultLocale
  }
  private static relevantExtensionKeys = []
  public static polyfilled = true
  private static readonly __INTERNAL_SLOT_MAP__ = new WeakMap<
    ListFormat,
    ListFormatInternal
  >()
}

try {
  // IE11 does not have Symbol
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
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}
