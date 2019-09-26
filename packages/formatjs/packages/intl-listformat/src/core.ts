import {
  findSupportedLocale,
  toObject,
  getOption,
  getParentLocaleHierarchy,
  supportedLocalesOf,
  ListPatternLocaleData,
  ListPattern,
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

/**
 * Find the correct field data in our CLDR data
 * Also merge with parent data since our CLDR is very packed
 * @param locale locale
 */
function findFields(locale: string) {
  const localeData = ListFormat.__localeData__;
  const parentHierarchy = getParentLocaleHierarchy(locale);

  const dataToMerge = [locale, ...parentHierarchy]
    .map(l => localeData[l.toLowerCase()])
    .filter(Boolean);
  if (!dataToMerge.length) {
    throw new Error(
      `Locale data added to ListFormat is missing 'fields' for "${locale}"`
    );
  }
  dataToMerge.reverse();
  return dataToMerge.reduce(
    (all: ListPatternLocaleData['fields'], d) => ({
      ...all,
      ...d.fields,
    }),
    {} as ListPatternLocaleData['fields']
  );
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

const DEFAULT_LOCALE = new Intl.NumberFormat().resolvedOptions().locale;

function findListData(
  locale: string,
  type: ResolvedIntlListFormatOptions['type'] = 'conjunction',
  style: ResolvedIntlListFormatOptions['style'] = 'long'
) {
  const data = findFields(locale);
  const dataType =
    type == 'conjunction' ? 'standard' : type == 'disjunction' ? 'or' : 'unit';
  const patternData = data[dataType];
  if (!patternData) {
    return;
  }
  if (style == 'narrow' && !patternData.narrow) {
    return patternData.short;
  }
  return patternData[style];
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

function createPartsFromList(listFormat: ListFormat, list: string[]) {
  const size = list.length;
  if (size === 0) {
    return [];
  }
  if (size === 2) {
    const pattern = listFormat['[[TemplatePair]]'];
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
      pattern = listFormat['[[TemplateStart]]'];
    } else if (i < size - 2) {
      pattern = listFormat['[[TemplateMiddle]]'];
    } else {
      pattern = listFormat['[[TemplateEnd]]'];
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
  private readonly '[[Style]]': IntlListFormatOptions['style'];
  private readonly '[[Type]]': IntlListFormatOptions['type'];
  private readonly _localeMatcher: IntlListFormatOptions['localeMatcher'];
  private readonly '[[Locale]]': string;
  public readonly '[[TemplatePair]]': string;
  public readonly '[[TemplateStart]]': string;
  public readonly '[[TemplateEnd]]': string;
  public readonly '[[TemplateMiddle]]': string;
  private readonly _nf: Intl.NumberFormat;
  constructor(locales?: string | string[], options?: IntlListFormatOptions) {
    // test262/test/intl402/ListFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof ListFormat ? this.constructor : void 0;
    if (!newTarget) {
      throw new TypeError("Intl.ListFormat must be called with 'new'");
    }
    const opts: IntlListFormatOptions =
      options === undefined ? Object.create(null) : toObject(options);
    const localesToLookup =
      locales === undefined
        ? [DEFAULT_LOCALE]
        : [...Intl.NumberFormat.supportedLocalesOf(locales), DEFAULT_LOCALE];
    const resolvedLocale = findSupportedLocale(
      localesToLookup,
      ListFormat.__localeData__
    );
    if (!resolvedLocale) {
      throw new Error(
        `No locale data has been added to IntlListFormat for: ${localesToLookup.join(
          ', '
        )}`
      );
    }
    this['[[Locale]]'] = resolvedLocale;

    this._localeMatcher = getOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    );
    this['[[Type]]'] = getOption(
      opts,
      'type',
      'string',
      ['conjunction', 'disjunction', 'unit'],
      'conjunction'
    );
    this['[[Style]]'] = getOption(
      opts,
      'style',
      'string',
      ['long', 'narrow', 'short'],
      'long'
    );
    const data = findListData(
      this['[[Locale]]'],
      this['[[Type]]'],
      this['[[Style]]']
    );
    if (!data) {
      throw new Error(`Missing locale data for ${this['[[Locale]]']}`);
    }
    this['[[TemplateStart]]'] = data.start;
    this['[[TemplateEnd]]'] = data.end;
    this['[[TemplateMiddle]]'] = data.middle;
    this['[[TemplatePair]]'] = data[2];
    this._nf = new Intl.NumberFormat(locales);
  }
  format(elements: string[]): string {
    validateInstance(this, 'format');
    const parts = stringListFromIterable(elements);
    return createPartsFromList(this, parts).reduce(
      (all, el) => all + el.value,
      ''
    );
  }
  formatToParts(elements: string[]): Part[] {
    validateInstance(this, 'format');
    const parts = createPartsFromList(this, stringListFromIterable(elements));
    const result = [];
    let n = 0;
    for (const part of parts) {
      const o = Object.create(Object.prototype);
      Object.defineProperties(o, {
        type: {
          value: part.type,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        value: {
          value: part.value,
          writable: true,
          enumerable: true,
          configurable: true,
        },
      });
      result[n] = o;
      n++;
    }
    return result;
  }

  resolvedOptions(): ResolvedIntlListFormatOptions {
    validateInstance(this, 'resolvedOptions');

    // test262/test/intl402/ListFormat/prototype/resolvedOptions/type.js
    const opts = Object.create(Object.prototype);
    Object.defineProperties(opts, {
      locale: {
        value: this._nf.resolvedOptions().locale,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      type: {
        value: (this['[[Type]]'] as String).valueOf(),
        writable: true,
        enumerable: true,
        configurable: true,
      },
      style: {
        value: (this['[[Style]]'] as String).valueOf(),
        writable: true,
        enumerable: true,
        configurable: true,
      },
    });
    return opts;
  }

  public static supportedLocalesOf(
    locales: string | string[],
    opts?: Pick<IntlListFormatOptions, 'localeMatcher'>
  ) {
    // test262/test/intl402/ListFormat/constructor/supportedLocalesOf/options-toobject.js
    let localeMatcher: IntlListFormatOptions['localeMatcher'] = 'best fit';
    // test262/test/intl402/ListFormat/constructor/supportedLocalesOf/options-null.js
    if (opts === null) {
      throw new TypeError('opts cannot be null');
    }
    if (opts) {
      localeMatcher = getOption(
        opts,
        'localeMatcher',
        'string',
        ['best fit', 'lookup'],
        'best fit'
      );
    }
    // test262/test/intl402/ListFormat/constructor/supportedLocalesOf/result-type.js
    return supportedLocalesOf(
      Intl.NumberFormat.supportedLocalesOf(locales, {localeMatcher}),
      ListFormat.__localeData__
    );
  }

  static __localeData__: Record<string, ListPatternLocaleData> = {};
  public static __addLocaleData(...data: ListPatternLocaleData[]) {
    for (const datum of data) {
      if (!(datum && datum.locale)) {
        throw new Error(
          'Locale data provided to ListFormat is missing a ' +
            '`locale` property value'
        );
      }

      ListFormat.__localeData__[datum.locale.toLowerCase()] = datum;
    }
  }
  public static polyfilled = true;
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
