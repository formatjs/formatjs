import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {PluralRules} from '@formatjs/intl-pluralrules'
import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {runInNewContext} from 'node:vm'
import {expect, it} from 'vitest'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)

it('matches mathematical primitive text, exact radix values and unbounded BigInt', () => {
  const values: (string | bigint)[] = [
    '',
    ' \uFEFF ',
    '.5',
    '1.',
    '+1',
    '-0',
    '1e+0',
    '1e-0',
    '1e-7',
    '1e9999',
    '-1e9999',
    '1e-9999',
    '-1e-9999',
    '0e9999999999999999999999999',
    '0xDEAD1',
    '0x20000000000001',
    '0o400000000000000001',
    '0b100000000000000000000000000000000000000000000000000001',
    '.',
    '--1',
    '+0x1',
    '1e3junk',
    '1_0',
    '\u00851',
    'NaN',
    'Infinity',
    '-Infinity',
    '9007199254740993',
    9007199254740993n,
    10n ** 1000n + 3n,
  ]
  const configurations: any[] = [
    {},
    {maximumFractionDigits: 0, roundingMode: 'ceil'},
    {maximumFractionDigits: 0, roundingMode: 'floor'},
    {maximumFractionDigits: 2, roundingMode: 'halfEven'},
    {maximumSignificantDigits: 2},
    {minimumFractionDigits: 2, maximumFractionDigits: 2, roundingIncrement: 25},
  ]
  const records: any[] = []
  function add(locale: string, options: any, values: (string | bigint)[]) {
    const raw = runInNewContext(
      '(' +
        readFileSync(
          resolve(`packages/intl-pluralrules/cldr-raw/${locale}.js`),
          'utf8'
        ) +
        ')'
    )
    PluralRules.__addLocaleData(raw)
    const pack = readFileSync(
      resolve(`crates/intl_pluralrules/locale-data/${locale}.json`),
      'utf8'
    )
    const rules = [
      new PluralRules(locale, {...options, type: 'cardinal'}),
      new PluralRules(locale, {...options, type: 'ordinal'}),
    ]
    const cases = [false, true].flatMap(ordinal =>
      values.map(value => ({
        decimal: String(value),
        ordinal,
        exponent: 0,
        bigint: typeof value === 'bigint',
      }))
    )
    const ranges = [false, true].flatMap(ordinal =>
      [
        [0x1n, 2n],
        ['0x1', '2'],
        ['1e9999', 'Infinity'],
        ['1e-9999', '0'],
      ].map(([start, end]) => ({
        start: String(start),
        end: String(end),
        ordinal,
        startBigint: typeof start === 'bigint',
        endBigint: typeof end === 'bigint',
        expected: rules[ordinal ? 1 : 0].selectRange(start as any, end as any),
      }))
    )
    records.push({
      locale,
      options,
      request: {pack, cases, ranges, digits: options, mathematical: true},
      expected: {
        values: [false, true].flatMap(ordinal =>
          values.map(value => rules[ordinal ? 1 : 0].select(value as any))
        ),
        ranges: ranges.map(range => range.expected),
      },
    })
  }
  for (const locale of ['en', 'fr', 'lv', 'ru', 'ar', 'pt'])
    for (const options of configurations) add(locale, options, values)
  const huge = BigInt('1' + '0'.repeat(39_998) + '3')
  add('en', {}, [huge, -huge, String(huge)])
  add('en', {maximumFractionDigits: 0, roundingMode: 'halfTrunc'}, [
    '1.5' + '0'.repeat(40_000) + '1',
    '1.5' + '0'.repeat(40_000),
  ])
  const result = spawnSync(resolve('crates/intl_pluralrules/conformance'), [], {
    input:
      records.map(record => JSON.stringify(record.request)).join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const actual = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(actual).toHaveLength(records.length)
  records.forEach((record, index) => {
    expect(
      actual[index].values,
      `${record.locale} ${JSON.stringify(record.options)}`
    ).toEqual(record.expected.values)
    expect(actual[index].ranges, `${record.locale} ranges`).toEqual(
      record.expected.ranges
    )
  })
}, 180_000)
