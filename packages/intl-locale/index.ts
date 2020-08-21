import {
  getInternalSlot,
  GetOption,
  setInternalSlot,
  setMultiInternalSlots,
  invariant,
} from '@formatjs/ecma402-abstract';
import {
  isStructurallyValidLanguageTag,
  isUnicodeLanguageSubtag,
  isUnicodeRegionSubtag,
  parseUnicodeLanguageId,
  UnicodeExtension,
  isUnicodeScriptSubtag,
  emitUnicodeLocaleId,
  parseUnicodeLocaleId,
  emitUnicodeLanguageId,
  getCanonicalLocales,
  UnicodeLanguageId,
} from '@formatjs/intl-getcanonicallocales';
import {supplemental} from 'cldr-core/supplemental/likelySubtags.json';
import SameValue from 'es-abstract/2019/SameValue';
import ToObject from 'es-abstract/2019/ToObject';
const {likelySubtags} = supplemental;

export interface IntlLocaleOptions {
  language?: string;
  script?: string;
  region?: string;
  calendar?: string;
  collation?: string;
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24';
  caseFirst?: 'upper' | 'lower' | 'false';
  numberingSystem?: string;
  numeric?: boolean;
}

const RELEVANT_EXTENSION_KEYS = ['ca', 'co', 'hc', 'kf', 'kn', 'nu'] as const;
type RELEVANT_EXTENSION_KEY = typeof RELEVANT_EXTENSION_KEYS[number];
type ExtensionOpts = Record<RELEVANT_EXTENSION_KEY, string>;

interface IntlLocaleInternal extends IntlLocaleOptions {
  locale: string;
  initializedLocale: boolean;
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<Locale, IntlLocaleInternal>();

const UNICODE_TYPE_REGEX = /^[a-z0-9]{3,8}(-[a-z0-9]{3,8})*$/i;

function applyOptionsToTag(tag: string, options: IntlLocaleOptions): string {
  invariant(typeof tag === 'string', 'language tag must be a string');
  invariant(
    isStructurallyValidLanguageTag(tag),
    'malformed language tag',
    RangeError
  );
  const language = GetOption(
    options,
    'language',
    'string',
    undefined,
    undefined
  );
  if (language !== undefined) {
    invariant(
      isUnicodeLanguageSubtag(language),
      'Malformed unicode_language_subtag',
      RangeError
    );
  }
  const script = GetOption(options, 'script', 'string', undefined, undefined);
  if (script !== undefined) {
    invariant(
      isUnicodeScriptSubtag(script),
      'Malformed unicode_script_subtag',
      RangeError
    );
  }
  const region = GetOption(options, 'region', 'string', undefined, undefined);
  if (region !== undefined) {
    invariant(
      isUnicodeRegionSubtag(region),
      'Malformed unicode_region_subtag',
      RangeError
    );
  }
  const languageId = parseUnicodeLanguageId(tag);
  if (language !== undefined) {
    languageId.lang = language;
  }
  if (script !== undefined) {
    languageId.script = script;
  }
  if (region !== undefined) {
    languageId.region = region;
  }
  return ((Intl as any).getCanonicalLocales as typeof getCanonicalLocales)(
    emitUnicodeLocaleId({
      ...parseUnicodeLocaleId(tag),
      lang: languageId,
    })
  )[0];
}

function applyUnicodeExtensionToTag(
  tag: string,
  options: ExtensionOpts,
  relevantExtensionKeys: typeof RELEVANT_EXTENSION_KEYS
): ExtensionOpts & {locale: string} {
  let unicodeExtension: UnicodeExtension | undefined;
  let keywords: UnicodeExtension['keywords'] = [];
  const ast = parseUnicodeLocaleId(tag);
  for (const ext of ast.extensions) {
    if (ext.type === 'u') {
      unicodeExtension = ext;
      if (Array.isArray(ext.keywords)) keywords = ext.keywords;
    }
  }

  const result = Object.create(null);

  for (const key of relevantExtensionKeys) {
    let value, entry;
    for (const keyword of keywords) {
      if (keyword[0] === key) {
        entry = keyword;
        value = entry[1];
      }
    }
    invariant(key in options, `${key} must be in options`);
    const optionsValue = options[key];
    if (optionsValue !== undefined) {
      invariant(
        typeof optionsValue === 'string',
        `Value for ${key} must be a string`
      );
      value = optionsValue;
      if (entry) {
        entry[1] = value;
      } else {
        keywords.push([key, value]);
      }
    }
    result[key] = value;
  }
  if (!unicodeExtension) {
    if (keywords.length) {
      ast.extensions.push({
        type: 'u',
        keywords,
        attributes: [],
      });
    }
  } else {
    unicodeExtension.keywords = keywords;
  }
  result.locale = ((Intl as any)
    .getCanonicalLocales as typeof getCanonicalLocales)(
    emitUnicodeLocaleId(ast)
  )[0];
  return result;
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
    };
  }
  return {
    lang: !lang || lang === 'und' ? replacement.lang : lang,
    script: script || replacement.script,
    region: region || replacement.region,
    variants: [...variants, ...replacement.variants],
  };
}

function addLikelySubtags(tag: string): string {
  const ast = parseUnicodeLocaleId(tag);
  const unicodeLangId = ast.lang;
  const {lang, script, region, variants} = unicodeLangId;
  if (script && region) {
    const match =
      likelySubtags[
        emitUnicodeLanguageId({lang, script, region, variants: []}) as 'aa'
      ];
    if (match) {
      const parts = parseUnicodeLanguageId(match);
      ast.lang = mergeUnicodeLanguageId(
        undefined,
        undefined,
        undefined,
        variants,
        parts
      );
      return emitUnicodeLocaleId(ast);
    }
  }
  if (script) {
    const match =
      likelySubtags[
        emitUnicodeLanguageId({lang, script, variants: []}) as 'aa'
      ];
    if (match) {
      const parts = parseUnicodeLanguageId(match);
      ast.lang = mergeUnicodeLanguageId(
        undefined,
        undefined,
        region,
        variants,
        parts
      );
      return emitUnicodeLocaleId(ast);
    }
  }
  if (region) {
    const match =
      likelySubtags[
        emitUnicodeLanguageId({lang, region, variants: []}) as 'aa'
      ];
    if (match) {
      const parts = parseUnicodeLanguageId(match);
      ast.lang = mergeUnicodeLanguageId(
        undefined,
        script,
        undefined,
        variants,
        parts
      );
      return emitUnicodeLocaleId(ast);
    }
  }
  const match =
    likelySubtags[lang as 'aa'] ||
    likelySubtags[
      emitUnicodeLanguageId({lang: 'und', script, variants: []}) as 'aa'
    ];
  if (!match) {
    throw new Error(`No match for addLikelySubtags`);
  }
  const parts = parseUnicodeLanguageId(match);
  ast.lang = mergeUnicodeLanguageId(undefined, script, region, variants, parts);
  return emitUnicodeLocaleId(ast);
}

/**
 * From: https://github.com/unicode-org/icu/blob/4231ca5be053a22a1be24eb891817458c97db709/icu4j/main/classes/core/src/com/ibm/icu/util/ULocale.java#L2395
 * @param tag
 */
function removeLikelySubtags(tag: string): string {
  let maxLocale = addLikelySubtags(tag);
  if (!maxLocale) {
    return tag;
  }
  maxLocale = emitUnicodeLanguageId({
    ...parseUnicodeLanguageId(maxLocale),
    variants: [],
  });
  const ast = parseUnicodeLocaleId(tag);
  const {
    lang: {lang, script, region, variants},
  } = ast;
  const trial = addLikelySubtags(emitUnicodeLanguageId({lang, variants: []}));
  if (trial === maxLocale) {
    return emitUnicodeLocaleId({
      ...ast,
      lang: mergeUnicodeLanguageId(lang, undefined, undefined, variants),
    });
  }
  if (region) {
    const trial = addLikelySubtags(
      emitUnicodeLanguageId({lang, region, variants: []})
    );
    if (trial === maxLocale) {
      return emitUnicodeLocaleId({
        ...ast,
        lang: mergeUnicodeLanguageId(lang, undefined, region, variants),
      });
    }
  }
  if (script) {
    const trial = addLikelySubtags(
      emitUnicodeLanguageId({lang, script, variants: []})
    );
    if (trial === maxLocale) {
      return emitUnicodeLocaleId({
        ...ast,
        lang: mergeUnicodeLanguageId(lang, script, undefined, variants),
      });
    }
  }
  return tag;
}

export class Locale {
  constructor(tag: string | Locale, opts?: IntlLocaleOptions) {
    // test262/test/intl402/RelativeTimeFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof Locale ? this.constructor : void 0;
    if (!newTarget) {
      throw new TypeError("Intl.Locale must be called with 'new'");
    }

    const {relevantExtensionKeys} = Locale;

    const internalSlotsList: Array<keyof IntlLocaleInternal> = [
      'initializedLocale',
      'locale',
      'calendar',
      'collation',
      'hourCycle',
      'numberingSystem',
    ];

    if (relevantExtensionKeys.indexOf('kf') > -1) {
      internalSlotsList.push('caseFirst');
    }

    if (relevantExtensionKeys.indexOf('kn') > -1) {
      internalSlotsList.push('numeric');
    }

    if (tag === undefined) {
      throw new TypeError(
        "First argument to Intl.Locale constructor can't be empty or missing"
      );
    }

    if (typeof tag !== 'string' && typeof tag !== 'object') {
      throw new TypeError('tag must be a string or object');
    }

    if (
      typeof tag === 'object' &&
      getInternalSlot(__INTERNAL_SLOT_MAP__, tag, 'initializedLocale')
    ) {
      tag = getInternalSlot(__INTERNAL_SLOT_MAP__, tag, 'locale');
    } else {
      tag = tag.toString() as string;
    }

    let options: IntlLocaleOptions;
    if (opts === undefined) {
      options = Object.create(null);
    } else {
      options = ToObject(opts);
    }

    tag = applyOptionsToTag(tag, options);
    const opt = Object.create(null);
    const calendar = GetOption(
      options,
      'calendar',
      'string',
      undefined,
      undefined
    );
    if (calendar !== undefined) {
      if (!UNICODE_TYPE_REGEX.test(calendar)) {
        throw new RangeError('invalid calendar');
      }
    }
    opt.ca = calendar;

    const collation = GetOption(
      options,
      'collation',
      'string',
      undefined,
      undefined
    );
    if (collation !== undefined) {
      if (!UNICODE_TYPE_REGEX.test(collation)) {
        throw new RangeError('invalid collation');
      }
    }
    opt.co = collation;
    const hc = GetOption(
      options,
      'hourCycle',
      'string',
      ['h11', 'h12', 'h23', 'h24'],
      undefined
    );
    opt.hc = hc;
    const kf = GetOption(
      options,
      'caseFirst',
      'string',
      ['upper', 'lower', 'false'],
      undefined
    );
    opt.kf = kf;
    const _kn = GetOption(options, 'numeric', 'boolean', undefined, undefined);
    let kn;
    if (_kn !== undefined) {
      kn = String(_kn);
    }
    opt.kn = kn;
    const numberingSystem = GetOption(
      options,
      'numberingSystem',
      'string',
      undefined,
      undefined
    );
    if (numberingSystem !== undefined) {
      if (!UNICODE_TYPE_REGEX.test(numberingSystem)) {
        throw new RangeError('Invalid numberingSystem');
      }
    }
    opt.nu = numberingSystem;
    const r = applyUnicodeExtensionToTag(tag, opt, relevantExtensionKeys);
    setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
      locale: r.locale,
      calendar: r.ca,
      collation: r.co,
      hourCycle: r.hc as 'h11',
    });
    if (relevantExtensionKeys.indexOf('kf') > -1) {
      setInternalSlot(
        __INTERNAL_SLOT_MAP__,
        this,
        'caseFirst',
        r.kf as 'upper'
      );
    }
    if (relevantExtensionKeys.indexOf('kn') > -1) {
      setInternalSlot(
        __INTERNAL_SLOT_MAP__,
        this,
        'numeric',
        SameValue(r.kn, 'true')
      );
    }
    setInternalSlot(__INTERNAL_SLOT_MAP__, this, 'numberingSystem', r.nu);
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public maximize(): Locale {
    const locale = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'locale');
    try {
      const maximizedLocale = addLikelySubtags(locale);
      return new Locale(maximizedLocale);
    } catch (e) {
      return new Locale(locale);
    }
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public minimize(): Locale {
    const locale = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'locale');
    try {
      const minimizedLocale = removeLikelySubtags(locale);
      return new Locale(minimizedLocale);
    } catch (e) {
      return new Locale(locale);
    }
  }

  public toString() {
    return getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'locale');
  }

  public get baseName() {
    const locale = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'locale');
    return emitUnicodeLanguageId(parseUnicodeLanguageId(locale));
  }

  public get calendar() {
    return getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'calendar');
  }

  public get collation() {
    return getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'collation');
  }

  public get hourCycle() {
    return getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'hourCycle');
  }

  public get caseFirst() {
    return getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'caseFirst');
  }

  public get numeric() {
    return getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'numeric');
  }
  public get numberingSystem() {
    return getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'numberingSystem');
  }
  /**
   * https://tc39.es/proposal-intl-locale/#sec-Intl.Locale.prototype.language
   */
  public get language() {
    const locale = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'locale');
    return parseUnicodeLanguageId(locale).lang;
  }
  /**
   * https://tc39.es/proposal-intl-locale/#sec-Intl.Locale.prototype.script
   */
  public get script() {
    const locale = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'locale');
    return parseUnicodeLanguageId(locale).script;
  }
  /**
   * https://tc39.es/proposal-intl-locale/#sec-Intl.Locale.prototype.region
   */
  public get region() {
    const locale = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'locale');
    return parseUnicodeLanguageId(locale).region;
  }

  static relevantExtensionKeys = RELEVANT_EXTENSION_KEYS;
}

try {
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(Locale.prototype, Symbol.toStringTag, {
      value: 'Intl.Locale',
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  Object.defineProperty(Locale.prototype.constructor, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  });
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}

export default Locale;
