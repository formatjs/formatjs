import {
  match,
  LookupSupportedLocales,
} from '#packages/intl-localematcher/index.js'
import {expect, test} from 'vitest'
test('zh-HK', function () {
  // zh-HK matches zh-HANT (returns original supported locale string as-is)
  expect(match(['zh-HK'], ['zh', 'zh-HANT', 'en'], 'en')).toEqual('zh-HANT')
})

test('Intl.LocaleMatcher', function () {
  expect(match(['fr-XX', 'en'], ['fr', 'en'], 'en')).toEqual('fr')
  expect(match(['zh-TW', 'en'], ['zh-Hant-TW', 'en'], 'en')).toEqual(
    'zh-Hant-TW'
  )
  expect(
    match(
      ['sr-Latn-BA'],
      [
        'af',
        'ak',
        'am',
        'an',
        'ar',
        'ars',
        'as',
        'asa',
        'ast',
        'az',
        'be',
        'bem',
        'bez',
        'bg',
        'bho',
        'bm',
        'bn',
        'bo',
        'br',
        'brx',
        'bs',
        'ca',
        'ce',
        'ceb',
        'cgg',
        'chr',
        'ckb',
        'cs',
        'cy',
        'da',
        'de',
        'doi',
        'dsb',
        'dv',
        'dz',
        'ee',
        'el',
        'en',
        'eo',
        'es',
        'et',
        'eu',
        'fa',
        'ff',
        'fi',
        'fil',
        'fo',
        'fr',
        'fur',
        'fy',
        'ga',
        'gd',
        'gl',
        'gsw',
        'gu',
        'guw',
        'gv',
        'ha',
        'haw',
        'he',
        'hi',
        'hr',
        'hsb',
        'hu',
        'hy',
        'ia',
        'id',
        'ig',
        'ii',
        'in',
        'io',
        'is',
        'it',
        'iu',
        'iw',
        'ja',
        'jbo',
        'jgo',
        'ji',
        'jmc',
        'jv',
        'jw',
        'ka',
        'kab',
        'kaj',
        'kcg',
        'kde',
        'kea',
        'kk',
        'kkj',
        'kl',
        'km',
        'kn',
        'ko',
        'ks',
        'ksb',
        'ksh',
        'ku',
        'kw',
        'ky',
        'lag',
        'lb',
        'lg',
        'lij',
        'lkt',
        'ln',
        'lo',
        'lt',
        'lv',
        'mas',
        'mg',
        'mgo',
        'mk',
        'ml',
        'mn',
        'mo',
        'mr',
        'ms',
        'mt',
        'my',
        'nah',
        'naq',
        'nb',
        'nd',
        'ne',
        'nl',
        'nn',
        'nnh',
        'no',
        'nqo',
        'nr',
        'nso',
        'ny',
        'nyn',
        'om',
        'or',
        'os',
        'osa',
        'pa',
        'pap',
        'pcm',
        'pl',
        'prg',
        'ps',
        'pt-PT',
        'pt',
        'rm',
        'ro',
        'rof',
        'ru',
        'rwk',
        'sah',
        'saq',
        'sat',
        'sc',
        'scn',
        'sd',
        'sdh',
        'se',
        'seh',
        'ses',
        'sg',
        'sh',
        'shi',
        'si',
        'sk',
        'sl',
        'sma',
        'smi',
        'smj',
        'smn',
        'sms',
        'sn',
        'so',
        'sq',
        'sr',
        'ss',
        'ssy',
        'st',
        'su',
        'sv',
        'sw',
        'syr',
        'ta',
        'te',
        'teo',
        'th',
        'ti',
        'tig',
        'tk',
        'tl',
        'tn',
        'to',
        'tr',
        'ts',
        'tzm',
        'ug',
        'uk',
        'ur',
        'uz',
        've',
        'vi',
        'vo',
        'vun',
        'wa',
        'wae',
        'wo',
        'xh',
        'xog',
        'yi',
        'yo',
        'yue',
        'zh',
        'zu',
      ],
      'en'
    )
  ).toEqual('sh')
})

test('empty requested', function () {
  expect(match([], ['zh-Hant-TW', 'en'], 'en')).toEqual('en')
})

test('extension', function () {
  expect(match(['fr-CA-x-foo'], ['zh-Hant-TW', 'fr', 'en'], 'en')).toEqual('fr')
})

test('GH #4267', function () {
  expect(match(['fr'], ['br', 'fr'], 'en')).toEqual('fr')
})

test('supported locale filtering preserves requested tags and order', () => {
  expect(
    LookupSupportedLocales(
      ['sr', 'de', 'zh'],
      ['sr-Thai-RS', 'en', 'de-u-co-phonebk', 'zh-CN']
    )
  ).toEqual(['sr-Thai-RS', 'de-u-co-phonebk', 'zh-CN'])
})

test('preserves legacy RegExp statics across matching paths', () => {
  for (const [requested, supported] of [
    [['en'], ['en', 'fr']],
    [['zh-TW'], ['zh', 'zh-Hant']],
    [['en-XZ'], ['en', 'en-GB']],
    [['br'], ['de', 'fr']],
    [['de-x-psaccent'], ['de-1901', 'de']],
  ]) {
    ;/sent(inel)/.exec('sentinel')
    const before = [RegExp.lastMatch, RegExp.$1]
    match(requested, supported, 'en')
    const after = [RegExp.lastMatch, RegExp.$1]
    expect(after).toEqual(before)
  }
})

test.each(['0', '1'])('internal arrays ignore inherited setter %s', key => {
  let actual: string | undefined
  let error: unknown
  Object.defineProperty(Object.prototype, key, {
    configurable: true,
    set() {
      throw new Error('Inherited numeric setter')
    },
  })
  try {
    actual = match(['de-1901', 'fr'], ['en', 'fr', 'de'], 'en')
  } catch (caught) {
    error = caught
  } finally {
    delete (Object.prototype as Record<string, unknown>)[key]
  }
  expect(error).toBeUndefined()
  expect(actual).toBe('de')
})
