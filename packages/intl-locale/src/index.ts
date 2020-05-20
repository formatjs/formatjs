import {
  getInternalSlot,
  toObject,
  getOption,
  setInternalSlot,
  setMultiInternalSlots,
  objectIs,
  invariant,
} from '@formatjs/intl-utils';
import {
  parse as parseUnicodeLocaleId,
  canonicalizeUnicodeLanguageId,
  canonicalize,
} from './parser';
import {
  UnicodeLocaleId,
  UnicodeLanguageId,
  UnicodeExtension,
} from './unicode-locale-id-types';
import {emit, emitLanguageId} from './emitter';

export interface IntlLocaleOptions {
  language?: string;
  script?: string;
  region?: string;
  calendar?: string;
  collation?: string;
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h34';
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
  ast: UnicodeLocaleId;
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<Locale, IntlLocaleInternal>();

const NUMBERING_SYSTEM_REGEX = /[a-z0-9]{3,8}(-[a-z0-9]{3,8})*/gi;

function applyOptionsToTag(
  tag: string,
  options: IntlLocaleOptions
): UnicodeLocaleId {
  const ast = parseUnicodeLocaleId(tag);
  const language = getOption(
    options,
    'language',
    'string',
    undefined,
    undefined
  );
  const script = getOption(options, 'script', 'string', undefined, undefined);
  const region = getOption(options, 'region', 'string', undefined, undefined);
  if (language !== undefined) {
    ast.lang.lang = language;
  }
  if (region !== undefined) {
    ast.lang.region = region;
  }
  if (script !== undefined) {
    ast.lang.script = script;
  }
  canonicalizeUnicodeLanguageId(ast.lang);
  return ast;
}

function applyUnicodeExtensionToTag(
  ast: UnicodeLocaleId,
  options: ExtensionOpts,
  relevantExtensionKeys: typeof RELEVANT_EXTENSION_KEYS
) {
  let unicodeExtension: UnicodeExtension | undefined;
  let keywords: UnicodeExtension['keywords'] = [];

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
  canonicalize(ast);
  return result;
}

function addLikelySubtags(unicodeLangId: UnicodeLanguageId): UnicodeLanguageId {
  const {lang, script, region} = unicodeLangId;
  const likelySubtags = Locale.LIKELY_SUBTAGS;
  const match =
    likelySubtags[
      emitLanguageId({lang, script, region, variants: []}) as 'aa'
    ] ||
    likelySubtags[emitLanguageId({lang, region, variants: []}) as 'aa'] ||
    likelySubtags[emitLanguageId({lang, script, variants: []}) as 'aa'] ||
    likelySubtags[lang as 'aa'] ||
    likelySubtags[emitLanguageId({lang: 'und', script, variants: []}) as 'aa'];
  if (!match) {
    throw new Error(`No match for addLikelySubtags`);
  }
  const parts = match.split('-');
  return {
    ...unicodeLangId,
    lang: lang === 'und' || !lang ? parts[0] : lang,
    script: script || parts[1],
    region: region || parts[2],
  };
}

function removeLikelySubtags(
  unicodeLangId: UnicodeLanguageId
): UnicodeLanguageId {
  const max = addLikelySubtags(unicodeLangId);
  const {variants} = max;
  const trials: UnicodeLanguageId[] = [
    {lang: max.lang, variants: []},
    {lang: max.lang, region: max.region, variants: []},
    {lang: max.lang, script: max.script, variants: []},
  ];
  for (const trial of trials) {
    if (isLanguageEqualWithoutVariants(max, addLikelySubtags(trial))) {
      return {
        ...trial,
        variants,
      };
    }
  }
  return max;
}

function isLanguageEqualWithoutVariants(
  l1: Omit<UnicodeLanguageId, 'variants'>,
  l2: Omit<UnicodeLanguageId, 'variants'>
): boolean {
  return (
    l1.lang === l2.lang && l1.region === l2.region && l1.script === l2.script
  );
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
      options = toObject(opts);
    }

    const ast = applyOptionsToTag(tag, options);
    const opt = Object.create(null);
    const calendar = getOption(
      options,
      'calendar',
      'string',
      undefined,
      undefined
    );
    if (calendar !== undefined) {
      if (!NUMBERING_SYSTEM_REGEX.test(calendar)) {
        throw new RangeError('invalid calendar');
      }
    }
    opt.ca = calendar;

    const collation = getOption(
      options,
      'collation',
      'string',
      undefined,
      undefined
    );
    if (collation !== undefined) {
      if (!NUMBERING_SYSTEM_REGEX.test(collation)) {
        throw new RangeError('invalid collation');
      }
    }
    opt.co = collation;
    const hc = getOption(
      options,
      'hourCycle',
      'string',
      ['h11', 'h12', 'h23', 'h34'],
      undefined
    );
    opt.hc = hc;
    const kf = getOption(
      options,
      'caseFirst',
      'string',
      ['upper', 'lower', 'false'],
      undefined
    );
    opt.kf = kf;
    let kn = getOption(options, 'numeric', 'boolean', undefined, undefined);
    if (kn !== undefined) {
      kn = !!String(kn);
    }
    opt.kn = kn;
    const numberingSystem = getOption(
      options,
      'numberingSystem',
      'string',
      undefined,
      undefined
    );
    if (numberingSystem !== undefined) {
      if (!NUMBERING_SYSTEM_REGEX.test(numberingSystem)) {
        throw new RangeError('Invalid numberingSystem');
      }
    }
    opt.nu = numberingSystem;
    const r = applyUnicodeExtensionToTag(ast, opt, relevantExtensionKeys);
    setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
      locale: r.locale,
      calendar: r.ca,
      collation: r.co,
      hourCycle: r.hc,
    });
    if (relevantExtensionKeys.indexOf('kf') > -1) {
      setInternalSlot(__INTERNAL_SLOT_MAP__, this, 'caseFirst', r.kf);
    }
    if (relevantExtensionKeys.indexOf('kn') > -1) {
      setInternalSlot(
        __INTERNAL_SLOT_MAP__,
        this,
        'numeric',
        objectIs(r.kn, 'true')
      );
    }
    setInternalSlot(__INTERNAL_SLOT_MAP__, this, 'numberingSystem', r.nu);
    setInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast', ast);
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public maximize(): Locale {
    const ast = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast');
    try {
      const maximizedLang = addLikelySubtags(ast.lang);
      return new Locale(
        emit({
          ...ast,
          lang: maximizedLang,
        })
      );
    } catch (e) {
      return new Locale(emit(ast));
    }
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public minimize(): Locale {
    const ast = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast');
    try {
      const minimalLang = removeLikelySubtags(ast.lang);
      return new Locale(
        emit({
          ...ast,
          lang: minimalLang,
        })
      );
    } catch (e) {
      return new Locale(emit(ast));
    }
  }

  public toString() {
    return emit(getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast'));
  }

  public get baseName() {
    const {lang} = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast');
    return [lang.lang, lang.script, lang.region, ...(lang.variants || [])]
      .filter(Boolean)
      .join('-');
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
    // Spec implies re-parsing but let's not do that
    const {lang} = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast');
    return lang.lang;
  }
  /**
   * https://tc39.es/proposal-intl-locale/#sec-Intl.Locale.prototype.script
   */
  public get script() {
    const {lang} = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast');
    return lang.script;
  }
  /**
   * https://tc39.es/proposal-intl-locale/#sec-Intl.Locale.prototype.region
   */
  public get region() {
    const {lang} = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast');
    return lang.region;
  }

  static relevantExtensionKeys = RELEVANT_EXTENSION_KEYS;

  static LIKELY_SUBTAGS: Record<string, string> = {};

  public static _addLikelySubtagData(data: Record<string, string>): void {
    Locale.LIKELY_SUBTAGS = data;
  }
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
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  });
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}
