import {
  toObject,
  getOption,
  ListPatternLocaleData,
  unpackData,
  setInternalSlot,
  getCanonicalLocales,
  supportedLocales,
  createResolveLocale,
  getInternalSlot,
  ListPatternFieldsData,
  ListPatternData,
} from '@formatjs/intl-utils';

export interface IntlListFormatOptions {
  /**
   * The locale matching algorithm to use.
   * Possible values are "lookup" and "best fit"; the default is "best fit".
   * For information about this option, see
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_negotiation.
   */
  localeMatcher?: 'best fit' | 'lookup';
  /**
   * The format of output message. Possible values are:
   * - "always" (default, e.g., 1 day ago),
   * - or "auto" (e.g., yesterday).
   * The "auto" value allows to not always have to
   * use numeric values in the output.
   */
  type?: 'conjunction' | 'disjunction' | 'unit';
  /**
   * The length of the internationalized message. Possible values are:
   * - "long" (default, e.g., in 1 month)
   * - "short" (e.g., in 1 mo.),
   * - or "narrow" (e.g., in 1 mo.).
   * The narrow style could be similar to the short style for some locales.
   */
  style?: 'long' | 'short' | 'narrow';
}

export interface ResolvedIntlListFormatOptions {
  /**
   * The BCP 47 language tag for the locale actually used.
   * If any Unicode extension values were requested in the
   * input BCP 47 language tag that led to this locale,
   * the key-value pairs that were requested and are
   * supported for this locale are included in locale.
   */
  locale: string;
  /**
   * The format of output message. Possible values are:
   * - "always" (default, e.g., 1 day ago),
   * - or "auto" (e.g., yesterday).
   * The "auto" value allows to not always have to
   * use numeric values in the output.
   */
  type: 'conjunction' | 'disjunction' | 'unit';
  /**
   * The length of the internationalized message. Possible values are:
   * - "long" (default, e.g., in 1 month)
   * - "short" (e.g., in 1 mo.),
   * - or "narrow" (e.g., in 1 mo.).
   * The narrow style could be similar to the short style for some locales.
   */
  style: 'long' | 'short' | 'narrow';
}

export type Part = LiteralPart | ElementPart;

export interface LiteralPart {
  type: 'literal';
  value: string;
}

export interface ElementPart {
  type: 'element';
  value: string;
}

interface Placeable {
  type: string;
  value: string;
}

interface ListFormatInternal {
  style: IntlListFormatOptions['style'];
  type: IntlListFormatOptions['type'];
  locale: string;
  templatePair: string;
  templateStart: string;
  templateEnd: string;
  templateMiddle: string;
  initializedListFormat: boolean;
}

function validateInstance(instance: any, method: string) {
  if (!(instance instanceof ListFormat)) {
    throw new TypeError(
      `Method Intl.ListFormat.prototype.${method} called on incompatible receiver ${String(
        instance
      )}`
    );
  }
}

/**
 * https://tc39.es/proposal-intl-list-format/#sec-createstringlistfromiterable
 * @param list list
 */
function stringListFromIterable(list: any[]): string[] {
  if (list === undefined) {
    return [];
  }
  const result = [];
  for (const el of list) {
    if (typeof el !== 'string') {
      throw new TypeError(`array list[${list.indexOf(el)}] is not type String`);
    }
    result.push(el);
  }
  return result;
}

function createPartsFromList(
  internalSlotMap: WeakMap<ListFormat, ListFormatInternal>,
  lf: ListFormat,
  list: string[]
) {
  const size = list.length;
  if (size === 0) {
    return [];
  }
  if (size === 2) {
    const pattern = getInternalSlot(internalSlotMap, lf, 'templatePair');
    const first = {type: 'element', value: list[0]};
    const second = {type: 'element', value: list[1]};
    return deconstructPattern(pattern, {'0': first, '1': second});
  }
  const last = {
    type: 'element',
    value: list[size - 1],
  };
  let parts: Placeable[] = [last];
  let i = size - 2;
  while (i >= 0) {
    let pattern;
    if (i === 0) {
      pattern = getInternalSlot(internalSlotMap, lf, 'templateStart');
    } else if (i < size - 2) {
      pattern = getInternalSlot(internalSlotMap, lf, 'templateMiddle');
    } else {
      pattern = getInternalSlot(internalSlotMap, lf, 'templateEnd');
    }
    const head = {type: 'element', value: list[i]};
    const tail = parts;
    parts = deconstructPattern(pattern, {'0': head, '1': tail});
    i--;
  }
  return parts;
}

function deconstructPattern(
  pattern: string,
  placeables: Record<string, Placeable | Placeable[]>
) {
  const result: Placeable[] = [];
  let beginIndex = pattern.indexOf('{', 0);
  let nextIndex = 0;
  while (beginIndex > -1 && beginIndex < pattern.length) {
    const endIndex = pattern.indexOf('}', beginIndex);
    if (endIndex <= beginIndex) {
      throw new Error(
        `endIndex ${endIndex} should be bigger than beginIndex ${beginIndex}`
      );
    }
    if (beginIndex > nextIndex) {
      result.push({
        type: 'literal',
        value: pattern.slice(nextIndex, beginIndex),
      });
    }
    const part = pattern.slice(beginIndex + 1, endIndex);
    if (!(part in placeables)) {
      throw new Error(`Missing key ${part} from placeables`);
    }
    const subst = placeables[part];
    if (Array.isArray(subst)) {
      for (const s of subst) {
        result.push(s);
      }
    } else {
      result.push(subst);
    }
    nextIndex = endIndex + 1;
    beginIndex = pattern.indexOf('{', nextIndex);
  }
  if (nextIndex < pattern.length) {
    const literal = pattern.slice(nextIndex, pattern.length);
    result.push({type: 'literal', value: literal});
  }
  return result;
}

export default class ListFormat {
  constructor(locales?: string | string[], options?: IntlListFormatOptions) {
    // test262/test/intl402/ListFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof ListFormat ? this.constructor : void 0;
    if (!newTarget) {
      throw new TypeError("Intl.ListFormat must be called with 'new'");
    }
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'initializedListFormat',
      true
    );
    const requestedLocales = getCanonicalLocales(locales);
    const opt: any = Object.create(null);
    const opts =
      options === undefined ? Object.create(null) : toObject(options);
    const matcher = getOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    );
    opt.localeMatcher = matcher;
    const {localeData} = ListFormat;
    const r = createResolveLocale(ListFormat.getDefaultLocale)(
      ListFormat.availableLocales,
      requestedLocales,
      opt,
      ListFormat.relevantExtensionKeys,
      localeData
    );
    setInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'locale', r.locale);
    const type: keyof ListPatternFieldsData = getOption(
      opts,
      'type',
      'string',
      ['conjunction', 'disjunction', 'unit'],
      'conjunction'
    );
    setInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'type', type);
    const style: keyof ListPatternData = getOption(
      opts,
      'style',
      'string',
      ['long', 'short', 'narrow'],
      'long'
    );
    setInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'style', style);
    const {dataLocale} = r;
    const dataLocaleData = localeData[dataLocale];
    const dataLocaleTypes = dataLocaleData![type];
    const templates = dataLocaleTypes![style]!;
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'templatePair',
      templates.pair
    );
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'templateStart',
      templates.start
    );
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'templateMiddle',
      templates.middle
    );
    setInternalSlot(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      'templateEnd',
      templates.end
    );
  }
  format(elements: string[]): string {
    validateInstance(this, 'format');
    const parts = stringListFromIterable(elements);
    return createPartsFromList(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      parts
    ).reduce((all, el) => all + el.value, '');
  }
  formatToParts(elements: string[]): Part[] {
    validateInstance(this, 'format');
    const parts = createPartsFromList(
      ListFormat.__INTERNAL_SLOT_MAP__,
      this,
      stringListFromIterable(elements)
    );
    const result: Part[] = [];
    let n = 0;
    for (const part of parts) {
      result[n] = {...part} as Part;
      n++;
    }
    return result;
  }

  resolvedOptions(): ResolvedIntlListFormatOptions {
    validateInstance(this, 'resolvedOptions');
    return {
      locale: getInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'locale'),
      type: getInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'type')!,
      style: getInternalSlot(ListFormat.__INTERNAL_SLOT_MAP__, this, 'style')!,
    };
  }

  public static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<IntlListFormatOptions, 'localeMatcher'>
  ) {
    // test262/test/intl402/ListFormat/constructor/supportedLocalesOf/result-type.js
    return supportedLocales(
      ListFormat.availableLocales,
      getCanonicalLocales(locales),
      options
    );
  }

  public static __addLocaleData(...data: ListPatternLocaleData[]) {
    for (const datum of data) {
      const availableLocales: string[] = Object.keys(
        [
          ...datum.availableLocales,
          ...Object.keys(datum.aliases),
          ...Object.keys(datum.parentLocales),
        ].reduce((all: Record<string, true>, k) => {
          all[k] = true;
          return all;
        }, {})
      );
      availableLocales.forEach(locale => {
        try {
          ListFormat.localeData[locale] = unpackData(locale, datum);
        } catch (e) {
          // If we can't unpack this data, ignore the locale
        }
      });
    }
    ListFormat.availableLocales = Object.keys(ListFormat.localeData);
    if (!ListFormat.__defaultLocale) {
      ListFormat.__defaultLocale = ListFormat.availableLocales[0];
    }
  }
  static localeData: Record<string, ListPatternFieldsData> = {};
  private static availableLocales: string[] = [];
  private static __defaultLocale = 'en';
  private static getDefaultLocale() {
    return ListFormat.__defaultLocale;
  }
  private static relevantExtensionKeys = [];
  public static polyfilled = true;
  private static readonly __INTERNAL_SLOT_MAP__ = new WeakMap<
    ListFormat,
    ListFormatInternal
  >();
}

try {
  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(ListFormat.prototype, Symbol.toStringTag, {
      value: 'Intl.ListFormat',
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  // https://github.com/tc39/test262/blob/master/test/intl402/ListFormat/constructor/length.js
  Object.defineProperty(ListFormat.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  // https://github.com/tc39/test262/blob/master/test/intl402/ListFormat/constructor/supportedLocalesOf/length.js
  Object.defineProperty(ListFormat.supportedLocalesOf, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  });
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}
