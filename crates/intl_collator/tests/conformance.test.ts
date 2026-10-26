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
it('compares every available locale, every advertised collation and search with TS', () => {
  const metadata = collationLocaleData as Record<
    string,
    {co: readonly string[]}
  >
  const configurations = availableCollationLocales.flatMap(locale => [
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
