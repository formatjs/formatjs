import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {
  Collator as TypeScriptCollator,
  type CollatorOptions,
} from '@formatjs/intl-collator'
import {
  availableCollationLocales,
  collationLocaleData,
} from '@formatjs_generated/cldr.collation/locale-data.js'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
interface Request {
  locales: string[]
  options: CollatorOptions
  pairs: [number[], number[]][]
}
interface Result {
  options: Intl.ResolvedCollatorOptions
  values: number[]
  error?: string
}
const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const units = (text: string) =>
  Array.from({length: text.length}, (_, index) => text.charCodeAt(index))
const sign = (value: number) => (value < 0 ? -1 : value > 0 ? 1 : 0)
function run(requests: Request[]): Result[] {
  const result = spawnSync(resolve('crates/intl_collator/conformance'), [], {
    input: requests.map(request => JSON.stringify(request)).join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.error) throw new Error(String(result.error) + '\n' + result.stderr)
  expect(result.status, result.stderr).toBe(0)
  const values = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(values.length).toBe(requests.length)
  return values
}
function compare(
  requests: {
    locales: string[]
    options: CollatorOptions
    pairs: readonly (readonly [string, string])[]
  }[]
) {
  const results = run(
    requests.map(request => ({
      ...request,
      pairs: request.pairs.map(([left, right]) => [units(left), units(right)]),
    }))
  )
  for (let index = 0; index < requests.length; index++) {
    const request = requests[index]
    const reference = new TypeScriptCollator(request.locales, request.options)
    const description = JSON.stringify({
      locales: request.locales,
      options: request.options,
    })
    expect(results[index].error, description).toBeUndefined()
    expect(results[index].options, description).toEqual(
      reference.resolvedOptions()
    )
    expect(results[index].values, description).toEqual(
      request.pairs.map(([left, right]) => sign(reference.compare(left, right)))
    )
  }
  return results
}
it('ports the full existing TSV corpus against Rust, TS and native Intl.Collator', () => {
  const lines = readFileSync(
    resolve('packages/intl-collator/tests/collator-conformance.tsv'),
    'utf8'
  )
    .trim()
    .split(/\r?\n/)
    .slice(1)
  const cases = lines.map(line => {
    const fields = line.split('\t')
    expect(fields.length).toBe(9)
    const [
      description,
      locale,
      sensitivity,
      numeric,
      caseFirst,
      ignorePunctuation,
      left,
      right,
      expected,
    ] = fields
    const options: CollatorOptions = {}
    if (sensitivity !== '-')
      options.sensitivity = sensitivity as CollatorOptions['sensitivity']
    if (caseFirst !== '-')
      options.caseFirst = caseFirst as CollatorOptions['caseFirst']
    if (numeric !== '-') options.numeric = numeric === 'true'
    if (ignorePunctuation !== '-')
      options.ignorePunctuation = ignorePunctuation === 'true'
    return {
      description,
      locales: [locale],
      options,
      pairs: [
        [left, right],
        [right, left],
        [left, left],
      ] as const,
      expected: Number(expected),
    }
  })
  expect(cases.length).toBeGreaterThan(20)
  const results = compare(cases)
  for (let index = 0; index < cases.length; index++) {
    const item = cases[index]
    expect(results[index].values, item.description).toEqual([
      item.expected,
      -item.expected || 0,
      0,
    ])
    const native = new Intl.Collator(
      item.locales,
      item.options as Intl.CollatorOptions
    )
    expect(sign(native.compare(...item.pairs[0])), item.description).toBe(
      item.expected
    )
  }
}, 120_000)
const pairs = [
  ['', ''],
  ['', 'a'],
  ['a', 'b'],
  ['resume', 'résumé'],
  ['é', 'e\u0301'],
  ['a', 'A'],
  ['A', 'á'],
  ['x', 'x1'],
  ['x', 'x2'],
  ['x1', 'x2'],
  ['Å', 'A\u030a'],
  ['å', 'A\u030a'],
  ['å', 'Å'],
  ['item2', 'item10'],
  ['item0002', 'item2'],
  ['n' + '9'.repeat(100), 'n1' + '0'.repeat(100)],
  ['a—b', 'ab'],
  ['a b', 'ab'],
  ['a-b', 'a_b'],
  ['l·', 'lz'],
  ['cz', 'ch'],
  ['dz', 'dž'],
  ['z', 'å'],
  ['å', 'ä'],
  ['ä', 'ö'],
  ['æ', 'ø'],
  ['ø', 'å'],
  ['AE', 'Ä'],
  ['ss', 'ß'],
  ['I', 'ı'],
  ['İ', 'i'],
  ['ΟΣ', 'ος'],
  ['ā', 'á'],
  ['ǎ', 'à'],
  ['à', 'a'],
  ['中文', '汉字'],
  ['あ', 'ア'],
  ['カ', 'か'],
  ['é', 'e'],
  ['😀', '😃'],
  ['𐐀', '𐐨'],
  ['\ud800', '\udc00'],
  ['\ud800', '\ufffd'],
  ['a\ud800', 'a\udc00'],
  ['\0', ''],
  ['x\0', 'x'],
  ['\u2060', ''],
] as const
it('applies pinned CLDR German EOR reordering around the others group', () => {
  // CLDR 49 common/collation/de.xml explicitly puts digits after letters.
  const [result] = compare([
    {
      locales: ['de-u-co-eor'],
      options: {numeric: true},
      pairs: [
        ['2', 'a'],
        ['10', '2'],
        ['\u0378', '2'],
        ['\ufffe', 'a'],
        ['\uffff', '2'],
      ],
    },
  ])
  expect(result.options.collation).toBe('eor')
  expect(result.values).toEqual([1, 1, -1, -1, 1])
  const [base] = compare([
    {
      locales: ['de-u-co-eor'],
      options: {sensitivity: 'base'},
      // CLDR's provisional German delta imports root EOR, then moves ezh to y.
      // https://github.com/unicode-org/cldr/blob/release-49/common/collation/de.xml#L29-L51
      pairs: [
        ['y', 'ʒ'],
        ['ʒ', 'z'],
      ],
    },
  ])
  expect(base.values).toEqual([0, -1])
})

it('places implicit weights in their CLDR groups and resolves Han references', () => {
  const [variant, base, reordered] = compare([
    {
      locales: ['en'],
      options: {},
      pairs: [
        ['\u0378', '\ufffd'],
        ['\ue000', '\uffff'],
        ['\ud800', '\udc00'],
        ['\ud800', '\ufffd'],
        ['\u{323b0}', '\u0378'],
        ['一', '㐀'],
        ['𪛙', '丁'],
        ['一', '⼀'],
      ],
    },
    {
      locales: ['en'],
      options: {sensitivity: 'base'},
      pairs: [
        ['㈠', '(一)'],
        ['⼀', '一'],
      ],
    },
    {
      locales: ['ru'],
      options: {},
      pairs: [
        ['я', '一'],
        ['一', '\u0378'],
        ['\u0378', '\ufffd'],
      ],
    },
  ])
  expect(variant.values).toEqual([-1, -1, -1, -1, -1, -1, -1, -1])
  expect(base.values).toEqual([0, 0])
  expect(reordered.values).toEqual([-1, -1, -1])
})

it('puts tailored CJK primaries in the Han group before implicit Han', () => {
  const [japanese, chinese] = compare([
    {
      locales: ['ja'],
      options: {sensitivity: 'base'},
      pairs: [
        ['a', '一'],
        ['あ', '阿'],
        ['亜', '阿'],
        ['阿', '𪛙'],
        ['一', 'α'],
      ],
    },
    {
      locales: ['zh-u-co-pinyin'],
      options: {sensitivity: 'base'},
      pairs: [
        ['阿', '一'],
        ['阿', 'a'],
        ['一', '\u{33479}'],
      ],
    },
  ])
  expect(japanese.values).toEqual([-1, -1, -1, -1, -1])
  expect(chinese.values).toEqual([-1, -1, -1])
})

it('applies Kana prefix relations and retains collation extensions', () => {
  const [kanaBase, kanaVariant, swedish] = compare([
    {
      locales: ['ja'],
      options: {sensitivity: 'base'},
      pairs: [
        ['こー', 'こお'],
        ['カレー', 'カレエ'],
        ['こゝ', 'ここ'],
        ['aー', 'aお'],
        ['ー', 'お'],
      ],
    },
    {
      locales: ['ja'],
      options: {sensitivity: 'variant'},
      pairs: [
        ['こー', 'こお'],
        ['か', 'カ'],
      ],
    },
    {
      locales: ['sv'],
      options: {sensitivity: 'base'},
      pairs: [
        ['þ', 'th'],
        ['þ', 't'],
      ],
    },
  ])
  expect(kanaBase.values).toEqual([0, 0, 0, -1, -1])
  expect(kanaVariant.values).toEqual([-1, 0])
  expect(swedish.values).toEqual([0, 1])
})

it('suppresses root contractions and prefixes only in the configured tailoring', () => {
  const [serbian, macedonian, russian, sort, search, imported] = compare([
    {
      locales: ['sr'],
      options: {sensitivity: 'base'},
      pairs: [
        ['и', 'й'],
        ['И', 'И\u0306'],
      ],
    },
    {locales: ['mk'], options: {sensitivity: 'base'}, pairs: [['и', 'й']]},
    {locales: ['ru'], options: {sensitivity: 'base'}, pairs: [['и', 'й']]},
    {
      locales: ['en'],
      options: {sensitivity: 'base'},
      pairs: [
        ['เก', 'กเ'],
        ['ເກ', 'ກເ'],
        ['l·', 'l'],
      ],
    },
    // CLDR 49 root search removes prefixes for U+00B7 and U+0387 (CLDR-19476).
    {
      locales: ['en'],
      options: {usage: 'search', sensitivity: 'base'},
      pairs: [
        ['เก', 'กเ'],
        ['ເກ', 'ກເ'],
        ['l·', 'l'],
        ['l·', 'l'],
      ],
    },
    {
      locales: ['de'],
      options: {usage: 'search', sensitivity: 'base'},
      pairs: [
        ['เก', 'กเ'],
        ['l·', 'l'],
        ['ä', 'ae'],
      ],
    },
  ])
  expect(serbian.values).toEqual([0, 0])
  expect(macedonian.values).toEqual([0])
  expect(russian.values).toEqual([-1])
  expect(sort.values).toEqual([0, 0, 0])
  expect(search.values).toEqual([1, 1, 1, 1])
  expect(imported.values).toEqual([1, 1, 0])
})

it('applies escaped apostrophes in Breton and escaped letters in Church Slavonic', () => {
  const [breton, churchSlavonic] = compare([
    {
      locales: ['br'],
      options: {sensitivity: 'variant'},
      pairs: [
        ["c'h", 'cʼh'],
        ["c'h", 'c’h'],
        ['ch', "c'h"],
      ],
    },
    {
      locales: ['cu'],
      options: {sensitivity: 'variant'},
      pairs: [['д', 'ᲁ']],
    },
  ])
  expect(breton.values).toEqual([0, 0, -1])
  expect(churchSlavonic.values).toEqual([0])
})

it('extends contractions across lower combining classes and retains skipped accents', () => {
  const [russian, accent, danish, serbian] = compare([
    {
      locales: ['ru'],
      options: {sensitivity: 'base'},
      pairs: [
        ['и\u0323\u0306', 'й'],
        ['и\u0301\u0306', 'й'],
        ['и\u034f\u0306', 'й'],
      ],
    },
    {
      locales: ['ru'],
      options: {sensitivity: 'accent'},
      pairs: [['и\u0323\u0306', 'й']],
    },
    {
      locales: ['da'],
      options: {sensitivity: 'base'},
      pairs: [
        ['a\u0327\u030a', 'å'],
        ['a\u0304\u030a', 'å'],
      ],
    },
    {
      locales: ['sr'],
      options: {sensitivity: 'base'},
      pairs: [['и\u0323\u0306', 'и']],
    },
  ])
  expect(russian.values).toEqual([0, -1, -1])
  expect(accent.values).toEqual([1])
  expect(danish.values).toEqual([0, -1])
  expect(serbian.values).toEqual([0])
})

it('resolves CLDR case and punctuation defaults separately for sort and search', () => {
  const cases = compare([
    {locales: ['da'], options: {}, pairs: [['A', 'a']]},
    {locales: ['mt'], options: {}, pairs: [['A', 'a']]},
    {locales: ['da'], options: {usage: 'search'}, pairs: [['A', 'a']]},
    {locales: ['da-u-kf-false'], options: {}, pairs: [['A', 'a']]},
    {
      locales: ['da-u-kf-upper'],
      options: {caseFirst: 'lower'},
      pairs: [['A', 'a']],
    },
    {locales: ['th'], options: {}, pairs: [['a-b', 'ab']]},
    {locales: ['th'], options: {usage: 'search'}, pairs: [['a-b', 'ab']]},
    {
      locales: ['th'],
      options: {usage: 'search', ignorePunctuation: true},
      pairs: [['a-b', 'ab']],
    },
  ])
  expect(cases.slice(0, 5).map(({options}) => options.caseFirst)).toEqual([
    'upper',
    'upper',
    'false',
    'false',
    'lower',
  ])
  expect(cases[3].options.locale).toBe('da-u-kf-false')
  expect(cases[4].options.locale).toBe('da')
  expect(cases.slice(5).map(({options}) => options.ignorePunctuation)).toEqual([
    true,
    false,
    true,
  ])
  expect(cases.flatMap(({values}) => values)).toEqual([
    -1, -1, 1, 1, 1, 0, -1, 0,
  ])
})

it('uses the chosen collation defaults while retaining explicit overrides', () => {
  const cases = compare([
    {locales: ['da-u-co-eor'], options: {}, pairs: [['A', 'a']]},
    {locales: ['da-u-co-eor-kf-upper'], options: {}, pairs: [['A', 'a']]},
    {
      locales: ['da'],
      options: {collation: 'eor', caseFirst: 'upper'},
      pairs: [['A', 'a']],
    },
    {locales: ['th'], options: {collation: 'emoji'}, pairs: [['a-b', 'ab']]},
    {
      locales: ['th-u-co-emoji'],
      options: {ignorePunctuation: true},
      pairs: [['a-b', 'ab']],
    },
  ])
  expect(cases.slice(0, 3).map(({options}) => options.caseFirst)).toEqual([
    'false',
    'upper',
    'upper',
  ])
  expect(cases[1].options.locale).toBe('da-u-co-eor-kf-upper')
  expect(cases.slice(3).map(({options}) => options.ignorePunctuation)).toEqual([
    false,
    true,
  ])
  expect(cases.flatMap(({values}) => values)).toEqual([1, -1, -1, -1, 0])
})

it('compares every available locale, every advertised collation and search with TS', () => {
  const metadata = collationLocaleData as Record<
    string,
    {co: readonly string[]}
  >
  const configurations = availableCollationLocales.flatMap(locale => [
    {
      locales: [locale],
      options: {localeMatcher: 'lookup' as const},
      pairs,
    },
    ...metadata[locale].co.map(collation => ({
      locales: [locale],
      options: {collation, localeMatcher: 'lookup' as const},
      pairs,
    })),
    {
      locales: [locale],
      options: {usage: 'search' as const, localeMatcher: 'lookup' as const},
      pairs,
    },
  ])
  expect(availableCollationLocales.length).toBeGreaterThan(100)
  compare(configurations)
}, 120_000)
it('compares sensitivity/numeric/caseFirst/punctuation/usage combinations and extension resolution with TS', () => {
  const requests: {
    locales: string[]
    options: CollatorOptions
    pairs: typeof pairs
  }[] = []
  for (const locale of [
    'en',
    'de',
    'fr',
    'sv',
    'da',
    'tr',
    'lt',
    'el',
    'th',
    'zh',
    'ja',
    'es',
  ])
    for (const sensitivity of ['base', 'accent', 'case', 'variant'] as const)
      for (const numeric of [false, true])
        for (const caseFirst of ['false', 'upper', 'lower'] as const)
          for (const ignorePunctuation of [false, true])
            for (const usage of ['sort', 'search'] as const)
              requests.push({
                locales: [locale],
                options: {
                  localeMatcher: 'lookup',
                  sensitivity,
                  numeric,
                  caseFirst,
                  ignorePunctuation,
                  usage,
                },
                pairs,
              })
  for (const locales of [
    ['en-u-co-default'],
    ['en-u-co-standard'],
    ['en-u-co-search'],
    ['en-u-kn-true-kf-upper'],
    ['de-u-co-phonebk'],
    ['zh-u-co-stroke-kf-lower-kn'],
    ['zz-ZZ-u-kn', 'en-u-kf-upper'],
    ['en-u-kn', 'en-u-kf-upper'],
    ['en-US-u-kn-kf-upper'],
  ])
    for (const options of [
      {},
      {usage: 'search'},
      {numeric: false, caseFirst: 'lower'},
      {collation: 'pinyin'},
      {collation: 'phonebk', usage: 'search'},
    ] as CollatorOptions[])
      requests.push({locales, options, pairs})
  compare(requests)
}, 120_000)
