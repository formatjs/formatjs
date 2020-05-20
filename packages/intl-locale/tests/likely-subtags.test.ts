import {Locale} from '../src';
import * as data from 'cldr-core/supplemental/likelySubtags.json';
Locale._addLikelySubtagData(data.supplemental.likelySubtags);

const testDataMaximal = {
  // Language subtag is present.
  en: 'en-Latn-US',

  // Language and script subtags are present.
  'en-Latn': 'en-Latn-US',
  'en-Shaw': 'en-Shaw-GB',
  'en-Arab': 'en-Arab-US',

  // Language and region subtags are present.
  'en-US': 'en-Latn-US',
  'en-GB': 'en-Latn-GB',
  'en-FR': 'en-Latn-FR',

  // Language, script, and region subtags are present.
  'it-Kana-CA': 'it-Kana-CA',

  // Undefined primary language.
  und: 'en-Latn-US',
  'und-Thai': 'th-Thai-TH',
  'und-419': 'es-Latn-419',
  // 'und-150': 'ru-Cyrl-RU', TODO: Fix this or verify https://github.com/tc39/test262/issues/2628
  'und-AT': 'de-Latn-AT',
  'und-Cyrl-RO': 'bg-Cyrl-RO',

  // Undefined primary language not required to change in all cases.
  'und-AQ': 'und-Latn-AQ',
};

const testDataMinimal = {
  // Language subtag is present.
  en: 'en',

  // Language and script subtags are present.
  'en-Latn': 'en',
  'ar-Arab': 'ar',

  // Language and region subtags are present.
  'en-US': 'en',
  'en-GB': 'en-GB',

  // Reverse cases from |testDataMaximal|.
  'en-Latn-US': 'en',
  'en-Shaw-GB': 'en-Shaw',
  'en-Arab-US': 'en-Arab',
  'en-Latn-GB': 'en-GB',
  'en-Latn-FR': 'en-FR',
  'it-Kana-CA': 'it-Kana-CA',
  'th-Thai-TH': 'th',
  'es-Latn-419': 'es-419',
  'ru-Cyrl-RU': 'ru',
  'de-Latn-AT': 'de-AT',
  'bg-Cyrl-RO': 'bg-RO',
  'und-Latn-AQ': 'und-AQ',
};

// Add variants, extensions, and privateuse subtags and ensure they don't
// modify the result of the likely subtags algorithms.
const extras = [
  '',
  '-fonipa',
  '-a-not-assigned',
  '-u-attr',
  '-u-co',
  '-u-co-phonebk',
  '-x-private',
];

describe('likely-subtags', function() {
  for (const [tag, maximal] of Object.entries(testDataMaximal)) {
    it(`"${maximal}" should be maximal`, function() {
      expect(new Locale(maximal).maximize().toString()).toBe(maximal);
    });

    for (const extra of extras) {
      const input = tag + extra;
      const output = maximal + extra;
      it(`"${input}".maximize() should be "${output}"`, function() {
        expect(new Locale(input).maximize().toString()).toBe(output);
      });
    }
  }

  for (const [tag, minimal] of Object.entries(testDataMinimal)) {
    it(`"${minimal}" should be minimal`, function() {
      expect(new Locale(minimal).minimize().toString()).toBe(minimal);
    });

    for (const extra of extras) {
      const input = tag + extra;
      const output = minimal + extra;
      it(`"${input}".minimize() should be "${output}"`, function() {
        expect(new Locale(input).minimize().toString()).toBe(output);
      });
    }
  }

  // privateuse only.
  // "x" in "x-private" does not match unicode_language_subtag
  // unicode_language_subtag = alpha{2,3} | alpha{5,8};
  it('x-private', function() {
    expect(() => new Locale('x-private')).toThrowError(RangeError);
  });
});
