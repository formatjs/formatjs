import {UnicodeLocaleId, KV, Extension, UnicodeLanguageId} from './types';
import {
  languageAlias,
  variantAlias,
  scriptAlias,
  territoryAlias,
} from './aliases';
import {
  parseUnicodeLanguageId,
  isUnicodeVariantSubtag,
  isUnicodeLanguageSubtag,
  SEPARATOR,
} from './parser';
import * as likelySubtags from 'cldr-core/supplemental/likelySubtags.json';
import {emitUnicodeLanguageId} from './emitter';

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

function compareKV(t1: Array<any>, t2: Array<any>): number {
  return t1[0] < t2[0] ? -1 : t1[0] > t2[0] ? 1 : 0;
}

function compareExtension(e1: Extension, e2: Extension): number {
  return e1.type < e2.type ? -1 : e1.type > e2.type ? 1 : 0;
}

/**
 * CAVEAT: We don't do this section in the spec bc they have no JSON data
 * Use the bcp47 data to replace keys, types, tfields, and tvalues by their canonical forms. See Section 3.6.4 U Extension Data Files) and Section 3.7.1 T Extension Data Files. The aliases are in the alias attribute value, while the canonical is in the name attribute value. For example,
Because of the following bcp47 data:
<key name="ms"…>…<type name="uksystem" … alias="imperial" … />…</key>
We get the following transformation:
en-u-ms-imperial ⇒ en-u-ms-uksystem
 * @param lang 
 */
export function canonicalizeUnicodeLanguageId(lang: UnicodeLanguageId): void {
  /**
   * If the language subtag matches the type attribute of a languageAlias element in Supplemental Data,
   * replace the language subtag with the replacement value.
   * - If there are additional subtags in the replacement value, add them to the result, but only if there is no corresponding subtag already in the tag.
   * - Five special deprecated grandfathered codes (such as i-default) are in type attributes, and are also replaced.
   */
  let sourceLang = lang.lang.toLowerCase();
  /**
   * If the language subtag matches the type attribute of a languageAlias element in Supplemental Data, replace the language subtag with the replacement value.
   *  1. If there are additional subtags in the replacement value, add them to the result, but only if there is no corresponding subtag already in the tag.
   *  2. Five special deprecated grandfathered codes (such as i-default) are in type attributes, and are also replaced.
   */
  // TODO: This replacement is a little iffy bc languageAlias includes sometimes region as well
  const langAlias =
    languageAlias[emitUnicodeLanguageId(lang)] || languageAlias[sourceLang];
  if (langAlias) {
    const langAliasAst = parseUnicodeLanguageId(langAlias.split('-'));
    lang.lang = langAliasAst.lang;
    lang.script = lang.script || langAliasAst.script;
    lang.region = lang.region || langAliasAst.region;
  }
  if (lang.region) {
    const region = lang.region.toUpperCase();
    const regionAlias = territoryAlias[region];
    let replacedRegion: string | undefined;
    if (regionAlias) {
      const regions = regionAlias.split(' ');
      replacedRegion = regions[0];
      const likelySubtag =
        likelySubtags.supplemental.likelySubtags[lang.lang as 'aa'];
      if (likelySubtag) {
        const {region: likelyRegion} = parseUnicodeLanguageId(
          likelySubtag.split(SEPARATOR)
        );
        if (likelyRegion && regions.indexOf(likelyRegion) > -1) {
          replacedRegion = likelyRegion;
        }
      }
    }
    if (replacedRegion) {
      lang.region = replacedRegion;
    }
    lang.region = lang.region.toUpperCase();
  }
  if (lang.script) {
    lang.script =
      lang.script[0].toUpperCase() + lang.script.slice(1).toLowerCase();
    if (scriptAlias[lang.script]) {
      lang.script = scriptAlias[lang.script];
    }
  }

  if (lang.variants.length) {
    for (let i = 0; i < lang.variants.length; i++) {
      let variant = lang.variants[i].toLowerCase();
      if (variantAlias[variant]) {
        const alias = variantAlias[variant];
        if (isUnicodeVariantSubtag(alias)) {
          lang.variants[i] = alias;
        } else if (isUnicodeLanguageSubtag(alias)) {
          // Yes this can happen per the spec
          lang.lang = alias;
        }
      }
    }
    lang.variants.sort();
  }
}

/**
 * Canonicalize based on
 * https://www.unicode.org/reports/tr35/tr35.html#Canonical_Unicode_Locale_Identifiers
 * https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
 * IMPORTANT: This modifies the object inline
 * @param locale
 */
export function canonicalizeUnicodeLocaleId(
  locale: UnicodeLocaleId
): UnicodeLocaleId {
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
