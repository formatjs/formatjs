import {parseUnicodeLocaleId} from '../src/parser';

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
    it(`new Intl.Locale("${langtag}") throws RangeError`, function () {
      expect(() => parseUnicodeLocaleId(langtag)).toThrowError(RangeError);
    });
  }

  it('en-u-foo-bar-nu-thai-ca-buddhist-kk-true', function () {
    expect(
      parseUnicodeLocaleId('en-u-foo-bar-nu-thai-ca-buddhist-kk-true')
    ).toEqual({
      extensions: [
        {
          attributes: ['foo', 'bar'],
          keywords: [
            ['nu', 'thai'],
            ['ca', 'buddhist'],
            ['kk', 'true'],
          ],
          type: 'u',
        },
      ],
      lang: {lang: 'en', region: undefined, script: undefined, variants: []},
    });
  });
  it('da-u-ca-gregory-ca-buddhist', function () {
    expect(parseUnicodeLocaleId('da-u-ca-gregory-ca-buddhist')).toEqual({
      extensions: [
        {
          attributes: [],
          keywords: [
            ['ca', 'gregory'],
            ['ca', 'buddhist'],
          ],
          type: 'u',
        },
      ],
      lang: {lang: 'da', region: undefined, script: undefined, variants: []},
    });
  });
  it('en-Latn-fonipa', function () {
    expect(parseUnicodeLocaleId('en-Latn-fonipa')).toEqual({
      extensions: [],
      lang: {
        lang: 'en',
        region: undefined,
        script: 'Latn',
        variants: ['fonipa'],
      },
    });
  });
  it('de-Latn-DE-u-ca-gregory-co-phonebk-hc-h23-kf-kn-false-nu-latn', function () {
    expect(
      parseUnicodeLocaleId(
        'de-Latn-DE-u-ca-gregory-co-phonebk-hc-h23-kf-kn-false-nu-latn'
      )
    ).toEqual({
      extensions: [
        {
          attributes: [],
          keywords: [
            ['ca', 'gregory'],
            ['co', 'phonebk'],
            ['hc', 'h23'],
            ['kf', ''],
            ['kn', 'false'],
            ['nu', 'latn'],
          ],
          type: 'u',
        },
      ],
      lang: {lang: 'de', region: 'DE', script: 'Latn', variants: []},
    });
  });
  it('ja-Jpan-JP-u-ca-japanese-co-search-hc-h24-kf-false-kn-nu-jpanfin', function () {
    expect(
      parseUnicodeLocaleId(
        'ja-Jpan-JP-u-ca-japanese-co-search-hc-h24-kf-false-kn-nu-jpanfin'
      )
    ).toEqual({
      extensions: [
        {
          attributes: [],
          keywords: [
            ['ca', 'japanese'],
            ['co', 'search'],
            ['hc', 'h24'],
            ['kf', 'false'],
            ['kn', ''],
            ['nu', 'jpanfin'],
          ],
          type: 'u',
        },
      ],
      lang: {lang: 'ja', region: 'JP', script: 'Jpan', variants: []},
    });
  });
  it('fr-Latn-CA-u-ca-gregory-co-standard-hc-h11-kf-kn-false-nu-latn', function () {
    expect(
      parseUnicodeLocaleId(
        'fr-Latn-CA-u-ca-gregory-co-standard-hc-h11-kf-kn-false-nu-latn'
      )
    ).toEqual({
      extensions: [
        {
          attributes: [],
          keywords: [
            ['ca', 'gregory'],
            ['co', 'standard'],
            ['hc', 'h11'],
            ['kf', ''],
            ['kn', 'false'],
            ['nu', 'latn'],
          ],
          type: 'u',
        },
      ],
      lang: {lang: 'fr', region: 'CA', script: 'Latn', variants: []},
    });
  });
  it('en-a-bar-x-u-foo', function () {
    expect(parseUnicodeLocaleId('en-a-bar-x-u-foo')).toEqual({
      extensions: [
        {type: 'a', value: 'bar'},
        {type: 'x', value: 'u-foo'},
      ],
      lang: {lang: 'en', region: undefined, script: undefined, variants: []},
    });
  });
});
