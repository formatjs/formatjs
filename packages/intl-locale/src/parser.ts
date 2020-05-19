import {
  UnicodeLocaleId,
  UnicodeLanguageId,
  UnicodeExtension,
  TransformedExtension,
  PuExtension,
  OtherExtensions,
  KV,
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
const UNICODE_REGION_SUBTAG_REGEX = /^[a-z]{2}|[0-9]{3}$/i;
const UNICODE_VARIANT_SUBTAG_REGEX = /^([a-z0-9]{5,8}|[0-9][a-z0-9]{3})$/i;

const TKEY_REGEX = /^[a-z][0-9]$/i;

const SEPARATOR = '-';

function titleCase(str: string): string {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

function lowerCase<T extends Array<string>>(strs: T): T {
  return strs.map(s => s.toLowerCase()) as T;
}

function compareTuple(t1: KV, t2: KV): number {
  return t1[0] < t2[0] ? -1 : t1[0] > t2[0] ? 1 : 0;
}

function parseLanguageId(chunks: string[]): UnicodeLanguageId {
  const lang = chunks.shift();
  if (!lang) {
    throw new Error('Missing unicode_language_subtag');
  }
  if (lang === 'root') {
    return {lang: 'root'};
  }
  // unicode_language_subtag
  if (!ALPHA_2_3.test(lang) && !ALPHA_5_8.test(lang)) {
    throw new Error('Malformed unicode_language_subtag');
  }
  let script;
  // unicode_script_subtag
  if (ALPHA_4.test(chunks[0])) {
    script = chunks.shift();
  }
  let region;
  // unicode_region_subtag
  if (UNICODE_REGION_SUBTAG_REGEX.test(chunks[0])) {
    region = chunks.shift();
  }
  const variants = [];
  while (chunks.length && UNICODE_VARIANT_SUBTAG_REGEX.test(chunks[0])) {
    variants.push(chunks.shift()!);
  }
  return {
    lang,
    script,
    region,
    variants,
  };
}

function parseUnicodeExtension(chunks: string[]): UnicodeExtension | undefined {
  const keywords = [];
  let keyword;
  while (chunks.length && (keyword = parseKeyword(chunks))) {
    keywords.push(keyword);
  }
  if (keywords.length) {
    return {
      type: 'u',
      keywords,
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
    // Ignore true
    if (value === 'true') {
      value = '';
    }
  }
  return [key, value];
}

function parseTransformedExtension(
  chunks: string[]
): TransformedExtension | undefined {
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
      throw new Error(`Missing tvalue for tkey "${key}"`);
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
}
function parsePuExtension(chunks: string[]): PuExtension | undefined {
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
  const type = chunks.shift();
  if (!type) {
    return {};
  }
  let unicodeExtension;
  let transformedExtension;
  let puExtension;
  const otherExtensions: OtherExtensions = {};
  while (chunks.length) {
    switch (type) {
      case 'u':
      case 'U':
        if (unicodeExtension) {
          throw new Error('There can only be 1 -u- extension');
        }
        unicodeExtension = parseUnicodeExtension(chunks);
        break;
      case 't':
      case 'T':
        if (transformedExtension) {
          throw new Error('There can only be 1 -t- extension');
        }
        transformedExtension = parseTransformedExtension(chunks);
        break;
      case 'x':
      case 'X':
        if (puExtension) {
          throw new Error('There can only be 1 -x- extension');
        }
        puExtension = parsePuExtension(chunks);
        break;
      default:
        if (!OTHER_EXTENSION_TYPE.test(type)) {
          throw new Error('Malformed extension type');
        }
        if (type in otherExtensions) {
          throw new Error(`There can only be 1 -${type}- extension`);
        }
        otherExtensions[type] = parseOtherExtensionValue(chunks);
    }
  }
  return {
    unicodeExtension,
    transformedExtension,
    puExtension,
    otherExtensions,
  };
}

export function parse(locale: string): UnicodeLocaleId {
  const chunks = locale.split(SEPARATOR);
  const lang = parseLanguageId(chunks);
  return canonicalize({
    lang,
    ...parseExtensions(chunks),
  });
}

function canonicalizeUnicodeLanguageId(lang: UnicodeLanguageId): void {
  lang.lang = lang.lang.toLowerCase();
  if (lang.script) {
    lang.script = titleCase(lang.script);
  }
  if (lang.region) {
    lang.region = lang.region.toUpperCase();
  }
  if (lang.variants) {
    lang.variants = lang.variants.map(v => v.toLowerCase());
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
  if (locale.unicodeExtension) {
    locale.unicodeExtension.type = 'u';
    locale.unicodeExtension.keywords = locale.unicodeExtension.keywords
      .map(lowerCase)
      .sort(compareTuple);
    if (locale.unicodeExtension.attributes) {
      locale.unicodeExtension.attributes = lowerCase(
        locale.unicodeExtension.attributes
      ).sort();
    }
  }
  if (locale.transformedExtension) {
    locale.transformedExtension.type = 't';
    if (locale.transformedExtension.lang) {
      canonicalizeUnicodeLanguageId(locale.transformedExtension.lang);
    }
    locale.transformedExtension.fields = locale.transformedExtension.fields
      .map(lowerCase)
      .sort(compareTuple);
  }
  if (locale.otherExtensions) {
    const canonicalizedOtherExtensions: OtherExtensions = {};
    for (const t in locale.otherExtensions) {
      canonicalizedOtherExtensions[t.toLowerCase()] = locale.otherExtensions[
        t
      ].toLowerCase();
    }
    locale.otherExtensions = canonicalizedOtherExtensions;
  }
  if (locale.puExtension) {
    locale.puExtension.type = 'x';
    locale.puExtension.value = locale.puExtension.value.toLowerCase();
  }
  return locale;
}
