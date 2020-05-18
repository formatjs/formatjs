import {
  getInternalSlot,
  toObject,
  getOption,
  setInternalSlot,
  setMultiInternalSlots,
  objectIs,
  invariant,
} from '@formatjs/intl-utils';
import {pegParse as parseUnicodeLocaleId} from './unicode-locale-id';
import {UnicodeLocaleId, UnicodeLanguageId} from './unicode-locale-id-types';
import * as data from 'cldr-core/supplemental/likelySubtags.json';
const {
  supplemental: {likelySubtags},
} = data;

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

function printLanguageId(lang?: UnicodeLanguageId): string {
  if (!lang) {
    return '';
  }
  return [lang.lang, lang.script, lang.region, ...(lang.variants || [])]
    .filter(Boolean)
    .join('-');
}

function printAST({
  lang,
  unicodeExtension,
  transformedExtension,
  puExtension,
  otherExtensions,
}: UnicodeLocaleId): string {
  return [
    printLanguageId(lang),
    unicodeExtension?.type,
    ...(unicodeExtension?.attributes || []),
    ...(unicodeExtension?.keywords || []),
    transformedExtension?.type,
    printLanguageId(transformedExtension?.lang),
    ...(transformedExtension?.fields || []),
    ...(otherExtensions
      ? Object.keys(otherExtensions).reduce(
          (all: string[], k) => all.concat([k, otherExtensions[k]]),
          []
        )
      : []),
    puExtension?.type,
    puExtension?.value,
  ]
    .filter(Boolean)
    .join('-');
}

const RELEVANT_EXTENSION_KEYS = ['ca', 'co', 'hc', 'kf', 'kn', 'nu'] as const;
type RELEVANT_EXTENSION_KEY = typeof RELEVANT_EXTENSION_KEYS[number];
type ExtensionOpts = Record<RELEVANT_EXTENSION_KEY, string>;

interface IntlLocaleInternal extends IntlLocaleOptions {
  locale: string;
  initializedLocale: boolean;
  ast: UnicodeLocaleId;
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<IntlLocale, IntlLocaleInternal>();

const NUMBERING_SYSTEM_REGEX = /[a-z0-9]{3,8}(-[a-z0-9]{3,8})*/gi;

function applyOptionsToTag(
  tag: string,
  options: IntlLocaleOptions
): UnicodeLocaleId {
  // Already canonicalized
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
    ast.lang.lang = language.toLowerCase();
  }
  if (region !== undefined) {
    ast.lang.region = region.toUpperCase();
  }
  if (script !== undefined) {
    ast.lang.script = script[0].toUpperCase() + script.slice(1).toLowerCase();
  }
  return ast;
}

function applyUnicodeExtensionToTag(
  ast: UnicodeLocaleId,
  options: ExtensionOpts,
  relevantExtensionKeys: typeof RELEVANT_EXTENSION_KEYS
) {
  const keywords = ast.unicodeExtension?.keywords || [];
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
  if (!ast.unicodeExtension) {
    ast.unicodeExtension = {
      type: 'u',
      keywords,
    };
  } else {
    ast.unicodeExtension.keywords = keywords;
  }
  return result;
}

const UND_LOCALE_ID = parseUnicodeLocaleId(likelySubtags.und);

function addLikelySubtags(ast: UnicodeLocaleId): UnicodeLocaleId {
  const {
    lang: {lang, script, region},
  } = ast;
  const match =
    likelySubtags[[lang, script, region].join('-') as 'aa'] ||
    likelySubtags[[lang, region].join('-') as 'aa'] ||
    likelySubtags[[lang, script].join('-') as 'aa'] ||
    likelySubtags[[lang].join('-') as 'aa'] ||
    likelySubtags[['und', script].join('-') as 'aa'];
  if (!match) {
    return UND_LOCALE_ID;
  }
  const parts = match.split('-');
  return {
    ...ast,
    lang: {
      ...ast.lang,
      lang: lang || parts[0],
      script: script || parts[1],
      region: region || parts[2],
    },
  };
}

function isLanguageEqual(
  l1: UnicodeLanguageId,
  l2: UnicodeLanguageId
): boolean {
  if (
    l1.lang === l2.lang &&
    l1.region === l2.region &&
    l1.script === l2.script
  ) {
    return false;
  }
  const {variants: variants1 = []} = l1;
  const {variants: variants2 = []} = l2;
  for (let i = 0; i < variants1.length; i++) {
    if (variants1[i] !== variants2[i]) {
      return false;
    }
  }
  return true;
}

export class IntlLocale {
  constructor(tag: string | IntlLocale, options: IntlLocaleOptions) {
    // test262/test/intl402/RelativeTimeFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof IntlLocale ? this.constructor : void 0;
    if (!newTarget) {
      throw new TypeError("Intl.Locale must be called with 'new'");
    }

    const {relevantExtensionKeys} = IntlLocale;

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

    if (options === undefined) {
      options = Object.create(null);
    } else {
      options = toObject(options);
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
    if (kf !== undefined) {
      opt.kn = String(kf);
    }
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
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public maximize() {
    const ast = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast');
    return printAST(addLikelySubtags(ast));
  }

  /**
   * https://www.unicode.org/reports/tr35/#Likely_Subtags
   */
  public minimize() {
    const ast = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast');
    const max = addLikelySubtags(ast);
    const maxWithoutVariants = ast.lang;
    maxWithoutVariants.variants = [];
    let trials: UnicodeLanguageId[] = [
      max.lang,
      {lang: max.lang.lang, region: max.lang.region},
      {lang: max.lang.lang, region: max.lang.script},
    ];
    for (let i = 0; i < trials.length; i++) {
      const trial = trials[i];
      if (
        isLanguageEqual(
          maxWithoutVariants,
          addLikelySubtags({lang: trial}).lang
        )
      ) {
        return printLanguageId({
          ...trial,
          variants: max.lang.variants,
        });
      }
    }
    return printAST(max);
  }

  public toString() {
    return printAST(getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ast'));
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
}

try {
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(IntlLocale.prototype, Symbol.toStringTag, {
      value: 'Intl.Locale',
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  Object.defineProperty(IntlLocale.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  });
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}
