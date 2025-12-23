import {findBestMatch, findMatchingDistance} from '../abstract/utils.js'
import {expect, test} from 'vitest'
test('findMatchingDistance', () => {
  expect(findMatchingDistance('es-CO', 'es')).toBe(49)
  expect(findMatchingDistance('es-CO', 'es-419')).toBe(39)
  expect(findMatchingDistance('en-US', 'en-US')).toBe(0)
  expect(findMatchingDistance('zh-TW', 'zh-Hant')).toBe(0)
  expect(findMatchingDistance('zh-HK', 'zh-NO')).toBe(540)
  /**
   * zh-Hant-HK -> zh-Hant-TW, the value of $cnsar is 'HK+MO'
   * HK belongs to $cnsar, TW doesn't
   * the distance rule should be zh_Hant_* <-> zh_Hant_* (distance: 5*10)
   * instead of zh_Hant_$!cnsar <-> zh_Hant_$!cnsar(distance 4*10)
   */
  expect(findMatchingDistance('zh-HK', 'zh-Hant')).toBe(50)
  expect(findMatchingDistance('vi', 'fr')).toBe(840)
  expect(findMatchingDistance('es', 'fr')).toBe(838)
  expect(findMatchingDistance('es', 'en')).toBe(840)
  expect(findMatchingDistance('fr', 'fr')).toBe(0)
  expect(findMatchingDistance('fr', 'br')).toBe(200)
  expect(findMatchingDistance('sr-Latn-BA', 'sr-Latn-RS')).toBe(40)
  expect(findMatchingDistance('sr-Latn-BA', 'bs-Latn-BA')).toBe(800)
})
test('findBestMatch', () => {
  expect(findBestMatch(['en-US'], ['en-US'])).toEqual({
    distances: {
      'en-US': {
        'en-US': 0,
      },
    },
    matchedDesiredLocale: 'en-US',
    matchedSupportedLocale: 'en-US',
  })

  expect(findBestMatch(['sr-Latn-BA'], ['bs', 'sh'])).toEqual({
    distances: {
      'sr-Latn-BA': {
        bs: 800,
        sh: 40,
      },
    },
    matchedDesiredLocale: 'sr-Latn-BA',
    matchedSupportedLocale: 'sh',
  })

  // With fallback matching, fr-XX → fr uses fallback penalty (Tier 3 also runs)
  const frResult = findBestMatch(['fr-XX'], ['fr', 'en'])
  expect(frResult.matchedDesiredLocale).toEqual('fr-XX')
  expect(frResult.matchedSupportedLocale).toEqual('fr')
  expect(frResult.distances['fr-XX'].fr).toBeLessThan(100) // Tier 3 calculates accurate distance

  // With fallback + maximization: zh-TW → zh-Hant-TW → zh-Hant (distance 0)
  // This correctly finds the linguistically optimal match
  expect(findBestMatch(['zh-TW'], ['zh', 'zh-Hant'])).toEqual({
    distances: {
      'zh-TW': {
        'zh-Hant': 0, // Maximized match: zh-TW → zh-Hant-TW → zh-Hant
      },
    },
    matchedDesiredLocale: 'zh-TW',
    matchedSupportedLocale: 'zh-Hant',
  })

  expect(findBestMatch(['th-u-ca-gregory'], ['th'])).toEqual({
    distances: {
      'th-u-ca-gregory': {
        th: 0,
      },
    },
    matchedDesiredLocale: 'th-u-ca-gregory',
    matchedSupportedLocale: 'th',
  })

  // With fallback matching, es-co → es uses fallback penalty instead of full distance calc
  expect(findBestMatch(['es-co'], ['en', 'es-419'])).toEqual({
    distances: {
      'es-co': {
        en: 839,
        'es-419': 39,
      },
    },
    matchedDesiredLocale: 'es-co',
    matchedSupportedLocale: 'es-419',
  })

  // es-co → es uses Tier 3 calculation, which is better than es-419
  const esResult = findBestMatch(['es-co'], ['en', 'es', 'es-419'])
  expect(esResult.matchedDesiredLocale).toEqual('es-co')
  expect(esResult.matchedSupportedLocale).toEqual('es')
  expect(esResult.distances['es-co'].es).toBeLessThan(100) // Tier 3 calculates accurate distance

  expect(findBestMatch(['pt-mz'], ['pt-PT', 'pt-BR'])).toEqual({
    distances: {
      'pt-mz': {
        'pt-BR': 49,
        'pt-PT': 39,
      },
    },
    matchedDesiredLocale: 'pt-mz',
    matchedSupportedLocale: 'pt-PT',
  })

  // de-DE → de (fallback) is not in supported list, falls through to full distance calculation
  // fr-FR is exact match
  const multiResult = findBestMatch(
    ['de-DE', 'fr-FR'],
    ['en', 'en-US', 'fr-FR']
  )
  expect(multiResult.matchedDesiredLocale).toEqual('fr-FR')
  expect(multiResult.matchedSupportedLocale).toEqual('fr-FR')
  expect(multiResult.distances['fr-FR']['fr-FR']).toEqual(40) // Second requested locale, position penalty 1 × 40
})

test('Fallback matching - single level subtag removal', () => {
  // Test that 'en-US' falls back to 'en' (Tier 3 also runs for accuracy)
  const result1 = findBestMatch(['en-US'], ['en', 'fr', 'de'])
  expect(result1.matchedDesiredLocale).toEqual('en-US')
  expect(result1.matchedSupportedLocale).toEqual('en')
  // Tier 3 calculates accurate distance
  expect(result1.distances['en-US'].en).toBeLessThan(100)

  // Test with position penalty - en-US → en (position 1) wins over fr-CA (no fallback match)
  const result2 = findBestMatch(['fr-CA', 'en-US'], ['en', 'de'])
  expect(result2.matchedDesiredLocale).toEqual('en-US')
  expect(result2.matchedSupportedLocale).toEqual('en')
  // Tier 3 calculates accurate distance
  expect(result2.distances['en-US'].en).toBeLessThan(100)
})

test('Fallback matching - two level subtag removal', () => {
  // Test that 'zh-Hans-CN' falls back to 'zh-Hans' (Tier 3 also runs)
  const result1 = findBestMatch(['zh-Hans-CN'], ['zh-Hans', 'en'])
  expect(result1.matchedDesiredLocale).toEqual('zh-Hans-CN')
  expect(result1.matchedSupportedLocale).toEqual('zh-Hans')
  // Tier 3 calculates distance 0 after canonicalization
  expect(result1.distances['zh-Hans-CN']['zh-Hans']).toEqual(0)

  // Test that 'zh-Hans-CN' matches 'zh' (Tier 3 calculates accurate distance)
  const result2 = findBestMatch(['zh-Hans-CN'], ['zh', 'en'])
  expect(result2.matchedDesiredLocale).toEqual('zh-Hans-CN')
  expect(result2.matchedSupportedLocale).toEqual('zh')
  // Tier 3 calculates distance based on CLDR data
  expect(result2.distances['zh-Hans-CN'].zh).toBeLessThan(100) // Should match zh over en
})

test('Fallback matching - multi-level with extensions', () => {
  // Test that extensions are removed in fallback
  // 'en-US-x-custom' → 'en-US' → 'en' (maximization drops extensions, then fallback)
  const result = findBestMatch(['en-US-x-custom'], ['en', 'fr'])
  expect(result.matchedDesiredLocale).toEqual('en-US-x-custom')
  expect(result.matchedSupportedLocale).toEqual('en')
  // Tier 3 calculates accurate distance
  expect(result.distances['en-US-x-custom'].en).toBeLessThan(100)
})

test('Fallback matching - preferred over distant languages', () => {
  // Fallback to 'en' should be preferred over unrelated language
  const result = findBestMatch(['en-US'], ['ja', 'en', 'ko'])
  expect(result.matchedDesiredLocale).toBe('en-US')
  expect(result.matchedSupportedLocale).toBe('en')
  // Tier 3 calculates accurate distance
  expect(result.distances['en-US'].en).toBeLessThan(100)
})

test('Fallback matching - does not override exact match', () => {
  // Exact match should still be distance 0
  expect(findBestMatch(['en-US'], ['en-US', 'en'])).toEqual({
    distances: {
      'en-US': {
        'en-US': 0, // Exact match
      },
    },
    matchedDesiredLocale: 'en-US',
    matchedSupportedLocale: 'en-US',
  })
})

test('Fallback matching - multiple requested locales', () => {
  // Test with actual fallback scenario
  const result = findBestMatch(['en-US', 'fr-CA'], ['en', 'fr'])
  expect(result.matchedDesiredLocale).toBe('en-US')
  expect(result.matchedSupportedLocale).toBe('en')
  // Tier 3 calculates accurate distance (should be better than fr-CA → fr due to position penalty)
  expect(result.distances['en-US'].en).toBeLessThan(
    result.distances['fr-CA'].fr
  )
})

test('Fallback matching - falls through to distance calculation when no fallback', () => {
  // When no exact or fallback match exists, use full distance calculation
  // However, if distance exceeds threshold (838), no match is returned
  const result = findBestMatch(['en-XZ'], ['fr', 'es'])
  // en-XZ → en (not in supported), falls through to full distance calculation
  // Distance from en to fr/es is 838+, which exceeds threshold
  expect(result.matchedDesiredLocale).toBeUndefined()
  expect(result.matchedSupportedLocale).toBeUndefined()
})

test('GH #4936 - Fast path with many locales', () => {
  // Exact match should be O(1) with Set lookup even with 700+ locales
  const manyLocales = [
    'af',
    'ar',
    'be',
    'bg',
    'ca',
    'cs',
    'cy',
    'da',
    'de',
    'el',
    'en',
    'es',
    'et',
    'eu',
    'fa',
    'fi',
    'fr',
    'ga',
    'gl',
    'gu',
    'he',
    'hi',
    'hr',
    'hu',
    'id',
    'is',
    'it',
    'ja',
    'ka',
    'kk',
    'km',
    'kn',
    'ko',
    'ky',
    'lt',
    'lv',
    'mk',
    'ml',
    'mn',
    'mr',
    'ms',
    'nb',
    'ne',
    'nl',
    'nn',
    'no',
    'pa',
    'pl',
    'pt',
    'ro',
    'ru',
    'si',
    'sk',
    'sl',
    'sq',
    'sr',
    'sv',
    'sw',
    'ta',
    'te',
    'th',
    'tr',
    'uk',
    'ur',
    'uz',
    'vi',
    'zh',
  ]

  // Exact match should be instant
  expect(findBestMatch(['en'], manyLocales)).toEqual({
    distances: {
      en: {
        en: 0,
      },
    },
    matchedDesiredLocale: 'en',
    matchedSupportedLocale: 'en',
  })

  // Fallback should also be fast
  const fallbackResult = findBestMatch(['en-US'], manyLocales)
  expect(fallbackResult.matchedDesiredLocale).toBe('en-US')
  expect(fallbackResult.matchedSupportedLocale).toBe('en')
  // Tier 3 calculates accurate distance
  expect(fallbackResult.distances['en-US'].en).toBeLessThan(100)
})

test('GH #4267 - exact match with many locales', function () {
  // With fallback optimization, fr is an exact match so it returns immediately
  // without calculating distances to all other locales
  const manyLocales = [
    'af',
    'af-NA',
    'agq',
    'ak',
    'am',
    'ar',
    'ar-AE',
    'ar-BH',
    'ar-DJ',
    'ar-DZ',
    'ar-EG',
    'ar-EH',
    'ar-ER',
    'ar-IL',
    'ar-IQ',
    'ar-JO',
    'ar-KM',
    'ar-KW',
    'ar-LB',
    'ar-LY',
    'ar-MA',
    'ar-MR',
    'ar-OM',
    'ar-PS',
    'ar-QA',
    'ar-SA',
    'ar-SD',
    'ar-SO',
    'ar-SS',
    'ar-SY',
    'ar-TD',
    'ar-TN',
    'ar-YE',
    'as',
    'asa',
    'ast',
    'az',
    'az-Cyrl',
    'az-Latn',
    'bas',
    'be',
    'be-tarask',
    'bem',
    'bez',
    'bg',
    'bm',
    'bn',
    'bn-IN',
    'bo',
    'bo-IN',
    'br',
    'brx',
    'bs',
    'bs-Cyrl',
    'bs-Latn',
    'ca',
    'ca-AD',
    'ca-ES-valencia',
    'ca-FR',
    'ca-IT',
    'ccp',
    'ccp-IN',
    'ce',
    'ceb',
    'cgg',
    'chr',
    'ckb',
    'ckb-IR',
    'cs',
    'cy',
    'da',
    'da-GL',
    'dav',
    'de',
    'de-AT',
    'de-BE',
    'de-CH',
    'de-IT',
    'de-LI',
    'de-LU',
    'dje',
    'doi',
    'dsb',
    'dua',
    'dyo',
    'dz',
    'ebu',
    'ee',
    'ee-TG',
    'el',
    'el-CY',
    'en',
    'en-001',
    'en-150',
    'en-AE',
    'en-AG',
    'en-AI',
    'en-AS',
    'en-AT',
    'en-AU',
    'en-BB',
    'en-BE',
    'en-BI',
    'en-BM',
    'en-BS',
    'en-BW',
    'en-BZ',
    'en-CA',
    'en-CC',
    'en-CH',
    'en-CK',
    'en-CM',
    'en-CX',
    'en-CY',
    'en-DE',
    'en-DG',
    'en-DK',
    'en-DM',
    'en-ER',
    'en-FI',
    'en-FJ',
    'en-FK',
    'en-FM',
    'en-GB',
    'en-GD',
    'en-GG',
    'en-GH',
    'en-GI',
    'en-GM',
    'en-GU',
    'en-GY',
    'en-HK',
    'en-IE',
    'en-IL',
    'en-IM',
    'en-IN',
    'en-IO',
    'en-JE',
    'en-JM',
    'en-KE',
    'en-KI',
    'en-KN',
    'en-KY',
    'en-LC',
    'en-LR',
    'en-LS',
    'en-MG',
    'en-MH',
    'en-MO',
    'en-MP',
    'en-MS',
    'en-MT',
    'en-MU',
    'en-MW',
    'en-MY',
    'en-NA',
    'en-NF',
    'en-NG',
    'en-NL',
    'en-NR',
    'en-NU',
    'en-NZ',
    'en-PG',
    'en-PH',
    'en-PK',
    'en-PN',
    'en-PR',
    'en-PW',
    'en-RW',
    'en-SB',
    'en-SC',
    'en-SD',
    'en-SE',
    'en-SG',
    'en-SH',
    'en-SI',
    'en-SL',
    'en-SS',
    'en-SX',
    'en-SZ',
    'en-TC',
    'en-TK',
    'en-TO',
    'en-TT',
    'en-TV',
    'en-TZ',
    'en-UG',
    'en-UM',
    'en-VC',
    'en-VG',
    'en-VI',
    'en-VU',
    'en-WS',
    'en-ZA',
    'en-ZM',
    'en-ZW',
    'eo',
    'es',
    'es-419',
    'es-AR',
    'es-BO',
    'es-BR',
    'es-BZ',
    'es-CL',
    'es-CO',
    'es-CR',
    'es-CU',
    'es-DO',
    'es-EA',
    'es-EC',
    'es-GQ',
    'es-GT',
    'es-HN',
    'es-IC',
    'es-MX',
    'es-NI',
    'es-PA',
    'es-PE',
    'es-PH',
    'es-PR',
    'es-PY',
    'es-SV',
    'es-US',
    'es-UY',
    'es-VE',
    'et',
    'eu',
    'ewo',
    'fa',
    'fa-AF',
    'ff',
    'ff-Adlm',
    'ff-Adlm-BF',
    'ff-Adlm-CM',
    'ff-Adlm-GH',
    'ff-Adlm-GM',
    'ff-Adlm-GW',
    'ff-Adlm-LR',
    'ff-Adlm-MR',
    'ff-Adlm-NE',
    'ff-Adlm-NG',
    'ff-Adlm-SL',
    'ff-Adlm-SN',
    'ff-Latn',
    'ff-Latn-BF',
    'ff-Latn-CM',
    'ff-Latn-GH',
    'ff-Latn-GM',
    'ff-Latn-GN',
    'ff-Latn-GW',
    'ff-Latn-LR',
    'ff-Latn-MR',
    'ff-Latn-NE',
    'ff-Latn-NG',
    'ff-Latn-SL',
    'fi',
    'fil',
    'fo',
    'fo-DK',
    'fr',
    'fr-BE',
    'fr-BF',
    'fr-BI',
    'fr-BJ',
    'fr-BL',
    'fr-CA',
    'fr-CD',
    'fr-CF',
    'fr-CG',
    'fr-CH',
    'fr-CI',
    'fr-CM',
    'fr-DJ',
    'fr-DZ',
    'fr-GA',
    'fr-GF',
    'fr-GN',
    'fr-GP',
    'fr-GQ',
    'fr-HT',
    'fr-KM',
    'fr-LU',
    'fr-MA',
    'fr-MC',
    'fr-MF',
    'fr-MG',
    'fr-ML',
    'fr-MQ',
    'fr-MR',
    'fr-MU',
    'fr-NC',
    'fr-NE',
    'fr-PF',
    'fr-PM',
    'fr-RE',
    'fr-RW',
    'fr-SC',
    'fr-SN',
    'fr-SY',
    'fr-TD',
    'fr-TG',
    'fr-TN',
    'fr-VU',
    'fr-WF',
    'fr-YT',
    'fur',
    'fy',
    'ga',
    'ga-GB',
    'gd',
    'gl',
    'gsw',
    'gsw-FR',
    'gsw-LI',
    'gu',
    'guz',
    'gv',
    'ha',
    'ha-GH',
    'ha-NE',
    'haw',
    'he',
    'hi',
    'hr',
    'hr-BA',
    'hsb',
    'hu',
    'hy',
    'ia',
    'id',
    'ig',
    'ii',
    'is',
    'it',
    'it-CH',
    'it-SM',
    'it-VA',
    'ja',
    'jgo',
    'jmc',
    'jv',
    'ka',
    'kab',
    'kam',
    'kde',
    'kea',
    'kgp',
    'khq',
    'ki',
    'kk',
    'kkj',
    'kl',
    'kln',
    'km',
    'kn',
    'ko',
    'ko-KP',
    'kok',
    'ks',
    'ks-Arab',
    'ksb',
    'ksf',
    'ksh',
    'ku',
    'kw',
    'ky',
    'lag',
    'lb',
    'lg',
    'lkt',
    'ln',
    'ln-AO',
    'ln-CF',
    'ln-CG',
    'lo',
    'lrc',
    'lrc-IQ',
    'lt',
    'lu',
    'luo',
    'luy',
    'lv',
    'mai',
    'mas',
    'mas-TZ',
    'mer',
    'mfe',
    'mg',
    'mgh',
    'mgo',
    'mi',
    'mk',
    'ml',
    'mn',
    'mni',
    'mni-Beng',
    'mr',
    'ms',
    'ms-BN',
    'ms-ID',
    'ms-SG',
    'mt',
    'mua',
    'my',
    'mzn',
    'naq',
    'nb',
    'nb-SJ',
    'nd',
    'nds',
    'nds-NL',
    'ne',
    'ne-IN',
    'nl',
    'nl-AW',
    'nl-BE',
    'nl-BQ',
    'nl-CW',
    'nl-SR',
    'nl-SX',
    'nmg',
    'nn',
    'nnh',
    'no',
    'nus',
    'nyn',
    'om',
    'om-KE',
    'or',
    'os',
    'os-RU',
    'pa',
    'pa-Arab',
    'pa-Guru',
    'pcm',
    'pl',
    'ps',
    'ps-PK',
    'pt',
    'pt-AO',
    'pt-CH',
    'pt-CV',
    'pt-GQ',
    'pt-GW',
    'pt-LU',
    'pt-MO',
    'pt-MZ',
    'pt-PT',
    'pt-ST',
    'pt-TL',
    'qu',
    'qu-BO',
    'qu-EC',
    'rm',
    'rn',
    'ro',
    'ro-MD',
    'rof',
    'ru',
    'ru-BY',
    'ru-KG',
    'ru-KZ',
    'ru-MD',
    'ru-UA',
    'rw',
    'rwk',
    'sa',
    'sah',
    'saq',
    'sat',
    'sat-Olck',
    'sbp',
    'sc',
    'sd',
    'sd-Arab',
    'sd-Deva',
    'se',
    'se-FI',
    'se-SE',
    'seh',
    'ses',
    'sg',
    'shi',
    'shi-Latn',
    'shi-Tfng',
    'si',
    'sk',
    'sl',
    'smn',
    'sn',
    'so',
    'so-DJ',
    'so-ET',
    'so-KE',
    'sq',
    'sq-MK',
    'sq-XK',
    'sr',
    'sr-Cyrl',
    'sr-Cyrl-BA',
    'sr-Cyrl-ME',
    'sr-Cyrl-XK',
    'sr-Latn',
    'sr-Latn-BA',
    'sr-Latn-ME',
    'sr-Latn-XK',
    'su',
    'su-Latn',
    'sv',
    'sv-AX',
    'sv-FI',
    'sw',
    'sw-CD',
    'sw-KE',
    'sw-UG',
    'ta',
    'ta-LK',
    'ta-MY',
    'ta-SG',
    'te',
    'teo',
    'teo-KE',
    'tg',
    'th',
    'ti',
    'ti-ER',
    'tk',
    'to',
    'tr',
    'tr-CY',
    'tt',
    'twq',
    'tzm',
    'ug',
    'uk',
    'und',
    'ur',
    'ur-IN',
    'uz',
    'uz-Arab',
    'uz-Cyrl',
    'uz-Latn',
    'vai',
    'vai-Latn',
    'vai-Vaii',
    'vi',
    'vun',
    'wae',
    'wo',
    'xh',
    'xog',
    'yav',
    'yi',
    'yo',
    'yo-BJ',
    'yrl',
    'yrl-CO',
    'yrl-VE',
    'yue',
    'yue-Hans',
    'yue-Hant',
    'zgh',
    'zh',
    'zh-Hans',
    'zh-Hans-HK',
    'zh-Hans-MO',
    'zh-Hans-SG',
    'zh-Hant',
    'zh-Hant-HK',
    'zh-Hant-MO',
    'zu',
  ]

  const result = findBestMatch(['fr'], manyLocales)

  // With the fast-path optimization, exact match returns immediately
  // without calculating distances to all other locales
  expect(result).toEqual({
    distances: {
      fr: {
        fr: 0, // Exact match, no other distances calculated
      },
    },
    matchedDesiredLocale: 'fr',
    matchedSupportedLocale: 'fr',
  })
})
