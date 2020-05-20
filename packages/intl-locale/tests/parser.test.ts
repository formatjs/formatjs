import {parse} from '../src/parser';

describe('parser', () => {
  const invalidLanguageTags = [
    // Unicode extension sequence is incomplete.
    'da-u',
    'da-u-',
    'da-u--',
    'da-u-t-latn',
    'da-u-x-priv',

    // Duplicate 'u' singleton.
    'da-u-ca-gregory-u-ca-buddhist',

    // https://github.com/tc39/test262/blob/5124761d2febfe5cc1427920d782219052f29a2c/harness/testIntl.js#L185
    '', // empty tag
    'i', // singleton alone
    'x', // private use without subtag
    'u', // extension singleton in first place
    '419', // region code in first place
    'u-nu-latn-cu-bob', // extension sequence without language
    'hans-cmn-cn', // "hans" could theoretically be a 4-letter language code,
    // but those can't be followed by extlang codes.
    'cmn-hans-cn-u-u', // duplicate singleton
    'cmn-hans-cn-t-u-ca-u', // duplicate singleton
    'de-gregory-gregory', // duplicate variant
    '*', // language range
    'de-*', // language range
    '中文', // non-ASCII letters
    'en-ß', // non-ASCII letters
    'ıd', // non-ASCII letters
    'es-Latn-latn', // two scripts
    'pl-PL-pl', // two regions
    'u-ca-gregory', // extension in first place
    'de-1996-1996', // duplicate numeric variant
    'pt-u-ca-gregory-u-nu-latn', // duplicate singleton subtag

    // Invalid tags starting with: https://github.com/tc39/ecma402/pull/289
    'no-nyn', // regular grandfathered in BCP47, but invalid in UTS35
    'i-klingon', // irregular grandfathered in BCP47, but invalid in UTS35
    'zh-hak-CN', // language with extlang in BCP47, but invalid in UTS35
    'sgn-ils', // language with extlang in BCP47, but invalid in UTS35
    'x-foo', // privateuse-only in BCP47, but invalid in UTS35
    'x-en-US-12345', // more privateuse-only variants.
    'x-12345-12345-en-US',
    'x-en-US-12345-12345',
    'x-en-u-foo',
    'x-en-u-foo-u-bar',
    'x-u-foo',

    // underscores in different parts of the language tag
    'de_DE',
    'DE_de',
    'cmn_Hans',
    'cmn-hans_cn',
    'es_419',
    'es-419-u-nu-latn-cu_bob',
    'i_klingon',
    'cmn-hans-cn-t-ca-u-ca-x_t-u',
    'enochian_enochian',
    'de-gregory_u-ca-gregory',

    'en\u0000', // null-terminator sequence
    ' en', // leading whitespace
    'en ', // trailing whitespace
    'it-IT-Latn', // country before script tag
    'de-u', // incomplete Unicode extension sequences
    'de-u-',
    'de-u-ca-',
    'de-u-ca-gregory-',
    'si-x', // incomplete private-use tags
    'x-',
    'x-y-',
  ];

  for (const langtag of invalidLanguageTags) {
    it(`new Intl.Locale("${langtag}") throws RangeError`, function() {
      expect(() => parse(langtag)).toThrowError(RangeError);
    });
  }

  const validTags = [
    'en-u-foo-bar-nu-thai-ca-buddhist-kk-true',
    'da-u-ca-gregory-ca-buddhist',
    'en-Latn-fonipa',
    'de-Latn-DE-u-ca-gregory-co-phonebk-hc-h23-kf-kn-false-nu-latn',
    'ja-Jpan-JP-u-ca-japanese-co-search-hc-h24-kf-false-kn-nu-jpanfin',
    'fr-Latn-CA-u-ca-gregory-co-standard-hc-h11-kf-kn-false-nu-latn',
    'en-a-bar-x-u-foo',
  ];
  for (const tag of validTags) {
    it(`${tag} should be valid`, function() {
      expect(parse(tag)).toMatchSnapshot();
    });
  }
});
