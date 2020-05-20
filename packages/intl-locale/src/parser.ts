import {
  UnicodeLocaleId,
  UnicodeLanguageId,
  UnicodeExtension,
  TransformedExtension,
  PuExtension,
  OtherExtension,
  KV,
  Extension,
} from './unicode-locale-id-types';

const ALPHA_2_3 = /^[a-z]{2,3}$/i;
const ALPHANUM_1_8 = /^[a-z0-9]{1,8}$/i;
const ALPHANUM_2_8 = /^[a-z0-9]{2,8}$/i;
const ALPHANUM_3_8 = /^[a-z0-9]{3,8}$/i;
const ALPHA_5_8 = /^[a-z]{5,8}$/i;
const KEY_REGEX = /^[a-z0-9][a-z]$/i;

const TYPE_REGEX = /^[a-z0-9]{3,8}$/i;
const ALPHA_4 = /^[a-z]{4}$/i;
// alphanum-[tTuUxX]
const OTHER_EXTENSION_TYPE = /^[0-9a-svwyz]$/i;
const UNICODE_REGION_SUBTAG_REGEX = /^([a-z]{2}|[0-9]{3})$/i;
const UNICODE_VARIANT_SUBTAG_REGEX = /^([a-z0-9]{5,8}|[0-9][a-z0-9]{3})$/i;

const TKEY_REGEX = /^[a-z][0-9]$/i;

const SEPARATOR = '-';

function compareKV(t1: Array<any>, t2: Array<any>): number {
  return t1[0] < t2[0] ? -1 : t1[0] > t2[0] ? 1 : 0;
}

function compareExtension(e1: Extension, e2: Extension): number {
  return e1.type < e2.type ? -1 : e1.type > e2.type ? 1 : 0;
}

export function verifyUnicodeLanguageSubtag(lang: string): asserts lang {
  if (!ALPHA_2_3.test(lang) && !ALPHA_5_8.test(lang)) {
    throw new RangeError('Malformed unicode_language_subtag');
  }
}

export function isUnicodeRegionSubtag(region: string): boolean {
  return UNICODE_REGION_SUBTAG_REGEX.test(region);
}

export function isUnicodeScriptSubtag(script: string): boolean {
  return ALPHA_4.test(script);
}

function parseLanguageId(chunks: string[]): UnicodeLanguageId {
  const lang = chunks.shift();
  if (!lang) {
    throw new RangeError('Missing unicode_language_subtag');
  }
  if (lang === 'root') {
    return {lang: 'root', variants: []};
  }
  // unicode_language_subtag
  verifyUnicodeLanguageSubtag(lang);
  let script;
  // unicode_script_subtag
  if (isUnicodeScriptSubtag(chunks[0])) {
    script = chunks.shift();
  }
  let region;
  // unicode_region_subtag
  if (isUnicodeRegionSubtag(chunks[0])) {
    region = chunks.shift();
  }
  const variants: Record<string, any> = {};
  while (chunks.length && UNICODE_VARIANT_SUBTAG_REGEX.test(chunks[0])) {
    const variant = chunks.shift()!;
    if (variant in variants) {
      throw new RangeError(`Duplicate variant "${variant}"`);
    }
    variants[variant] = 1;
  }
  return {
    lang,
    script,
    region,
    variants: Object.keys(variants),
  };
}

function parseUnicodeExtension(chunks: string[]): UnicodeExtension {
  const keywords = [];
  let keyword;
  while (chunks.length && (keyword = parseKeyword(chunks))) {
    keywords.push(keyword);
  }
  if (keywords.length) {
    return {
      type: 'u',
      keywords,
      attributes: [],
    };
  }
  // Mix of attributes & keywords
  // Check for attributes first
  const attributes = [];
  while (chunks.length && ALPHANUM_3_8.test(chunks[0])) {
    attributes.push(chunks.shift()!);
  }
  while (chunks.length && (keyword = parseKeyword(chunks))) {
    keywords.push(keyword);
  }
  if (keywords.length || attributes.length) {
    return {
      type: 'u',
      attributes,
      keywords,
    };
  }
  throw new RangeError('Malformed unicode_extension');
}

function parseKeyword(chunks: string[]): KV | undefined {
  let key;
  if (!KEY_REGEX.test(chunks[0])) {
    return;
  }
  key = chunks.shift()!;

  const type = [];
  while (chunks.length && TYPE_REGEX.test(chunks[0])) {
    type.push(chunks.shift());
  }
  let value: string = '';
  if (type.length) {
    value = type.join(SEPARATOR);
  }
  return [key, value];
}

function parseTransformedExtension(chunks: string[]): TransformedExtension {
  let lang: UnicodeLanguageId | undefined;
  try {
    lang = parseLanguageId(chunks);
  } catch (e) {
    // Try just parsing tfield
  }
  const fields: KV[] = [];
  while (chunks.length && TKEY_REGEX.test(chunks[0])) {
    const key = chunks.shift()!;
    const value = [];
    while (chunks.length && ALPHANUM_3_8.test(chunks[0])) {
      value.push(chunks.shift());
    }
    if (!value.length) {
      throw new RangeError(`Missing tvalue for tkey "${key}"`);
    }
    fields.push([key, value.join(SEPARATOR)]);
  }
  if (fields.length) {
    return {
      type: 't',
      fields,
      lang,
    };
  }
  throw new RangeError('Malformed transformed_extension');
}
function parsePuExtension(chunks: string[]): PuExtension {
  const exts = [];
  while (chunks.length && ALPHANUM_1_8.test(chunks[0])) {
    exts.push(chunks.shift());
  }
  if (exts.length) {
    return {
      type: 'x',
      value: exts.join(SEPARATOR),
    };
  }
  throw new RangeError('Malformed private_use_extension');
}
function parseOtherExtensionValue(chunks: string[]): string {
  const exts = [];
  while (chunks.length && ALPHANUM_2_8.test(chunks[0])) {
    exts.push(chunks.shift());
  }
  if (exts.length) {
    return exts.join(SEPARATOR);
  }
  return '';
}
function parseExtensions(chunks: string[]): Omit<UnicodeLocaleId, 'lang'> {
  if (!chunks.length) {
    return {extensions: []};
  }
  const extensions: UnicodeLocaleId['extensions'] = [];
  let unicodeExtension;
  let transformedExtension;
  let puExtension;
  const otherExtensionMap: Record<string, OtherExtension> = {};
  do {
    const type = chunks.shift()!;
    switch (type) {
      case 'u':
      case 'U':
        if (unicodeExtension) {
          throw new RangeError('There can only be 1 -u- extension');
        }
        unicodeExtension = parseUnicodeExtension(chunks);
        extensions.push(unicodeExtension);
        break;
      case 't':
      case 'T':
        if (transformedExtension) {
          throw new RangeError('There can only be 1 -t- extension');
        }
        transformedExtension = parseTransformedExtension(chunks);
        extensions.push(transformedExtension);
        break;
      case 'x':
      case 'X':
        if (puExtension) {
          throw new RangeError('There can only be 1 -x- extension');
        }
        puExtension = parsePuExtension(chunks);
        extensions.push(puExtension);
        break;
      default:
        if (!OTHER_EXTENSION_TYPE.test(type)) {
          throw new RangeError('Malformed extension type');
        }
        if (type in otherExtensionMap) {
          throw new RangeError(`There can only be 1 -${type}- extension`);
        }
        const extension: OtherExtension = {
          type: type as 'a',
          value: parseOtherExtensionValue(chunks),
        };
        otherExtensionMap[extension.type] = extension;
        extensions.push(extension);
        break;
    }
  } while (chunks.length);
  return {extensions};
}

function canonicalizeAttrs(strs: string[]): string[] {
  return Object.keys(
    strs.reduce((all: Record<string, number>, str) => {
      all[str.toLowerCase()] = 1;
      return all;
    }, {})
  ).sort();
}

function canonicalizeKVs(arr: KV[]): KV[] {
  const all: Record<string, any> = {};
  const result: KV[] = [];
  for (const kv of arr) {
    if (kv[0] in all) {
      continue;
    }
    all[kv[0]] = 1;
    if (!kv[1] || kv[1] === 'true') {
      result.push([kv[0].toLowerCase()]);
    } else {
      result.push([kv[0].toLowerCase(), kv[1].toLowerCase()]);
    }
  }
  return result.sort(compareKV);
}

export function parse(locale: string): UnicodeLocaleId {
  const chunks = locale.split(SEPARATOR);
  const lang = parseLanguageId(chunks);
  return canonicalize({
    lang,
    ...parseExtensions(chunks),
  });
}

export function canonicalizeUnicodeLanguageId(lang: UnicodeLanguageId): void {
  lang.lang = lang.lang.toLowerCase();
  if (lang.script) {
    lang.script =
      lang.script[0].toUpperCase() + lang.script.slice(1).toLowerCase();
  }
  if (lang.region) {
    lang.region = lang.region.toUpperCase();
  }
  if (lang.variants) {
    lang.variants = lang.variants.map(v => v.toLowerCase()).sort();
  }
}

/**
 * Canonicalize based on
 * https://www.unicode.org/reports/tr35/tr35.html#Canonical_Unicode_Locale_Identifiers
 * https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
 * IMPORTANT: This modifies the object inline
 * @param locale
 */
export function canonicalize(locale: UnicodeLocaleId): UnicodeLocaleId {
  canonicalizeUnicodeLanguageId(locale.lang);
  if (locale.extensions) {
    for (const extension of locale.extensions) {
      switch (extension.type) {
        case 'u':
          extension.keywords = canonicalizeKVs(extension.keywords);
          if (extension.attributes) {
            extension.attributes = canonicalizeAttrs(extension.attributes);
          }
          break;
        case 't':
          if (extension.lang) {
            canonicalizeUnicodeLanguageId(extension.lang);
          }
          extension.fields = canonicalizeKVs(extension.fields);
          break;
        default:
          extension.value = extension.value.toLowerCase();
          break;
      }
    }
    locale.extensions.sort(compareExtension);
  }

  return locale;
}
