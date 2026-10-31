import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import '@formatjs/intl-pluralrules/polyfill-force.js'
import type {PluralRules} from '@formatjs/intl-pluralrules'
import {NumberFormat} from '@formatjs/intl-numberformat'
import type {NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {runInNewContext} from 'node:vm'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const directory = resolve('crates/intl_numberformat/locale-data')
const pluralRules = Intl.PluralRules as unknown as typeof PluralRules
for (const file of readdirSync(resolve('crates/intl_pluralrules/locale-data'))
  .filter(file => file.endsWith('.json'))
  .sort(
    (a, b) =>
      Number(b === 'en.json') - Number(a === 'en.json') || a.localeCompare(b)
  ))
  pluralRules.__addLocaleData(
    runInNewContext(
      '(' +
        readFileSync(
          resolve(
            'packages/intl-pluralrules/cldr-raw/' + file.replace('.json', '.js')
          ),
          'utf8'
        ) +
        ')'
    )
  )
for (const file of readdirSync(directory)
  .filter(file => file.endsWith('.json'))
  .sort(
    (a, b) =>
      Number(b === 'en.json') - Number(a === 'en.json') || a.localeCompare(b)
  ))
  NumberFormat.__addLocaleData(
    JSON.parse(readFileSync(join(directory, file), 'utf8'))
  )
interface Part {
  type: string
  value: string
  source?: string
}
interface Output {
  text: string
  parts: Part[]
}
interface Case {
  locales: string[]
  options: NumberFormatOptions
  values: string[]
  ranges: [string, string][]
}
interface Sample {
  locale: string
  options: string
  start: string
  end: string
  caseIndex: number
  index: number
  range: boolean
  expected: Output
}
const cases: Case[] = []
const groups = new Map<string, number>()
const samples: Sample[] = []
const javaFixture = readFileSync(
  resolve('conformance-tests/icu4j/number-format-fixtures.tsv'),
  'utf8'
)
for (const row of javaFixture.trimEnd().split('\n').slice(1)) {
  const [locale, options, , start, end, text, parts] = row.split('\t')
  const key = locale + options
  let caseIndex = groups.get(key)
  if (caseIndex === undefined) {
    caseIndex = cases.length
    groups.set(key, caseIndex)
    cases.push({
      locales: [locale],
      options: JSON.parse(options),
      values: [],
      ranges: [],
    })
  }
  const value = cases[caseIndex]
  const range = end !== ''
  const index = range ? value.ranges.length : value.values.length
  if (range) value.ranges.push([start, end])
  else value.values.push(start)
  samples.push({
    locale,
    options,
    start,
    end,
    caseIndex,
    index,
    range,
    expected: {text, parts: JSON.parse(parts)},
  })
}
const probes: {locale: string; options: NumberFormatOptions}[] = [
  {locale: 'en', options: {style: 'unit', unit: 'meter', unitDisplay: 'long'}},
  {locale: 'en', options: {style: 'percent'}},
  {
    locale: 'en',
    options: {style: 'currency', currency: 'USD', currencyDisplay: 'name'},
  },
  {
    locale: 'en',
    options: {style: 'currency', currency: 'USD', currencySign: 'accounting'},
  },
  {locale: 'ar', options: {}},
  {locale: 'he', options: {}},
  {locale: 'fa', options: {}},
]
const probeStart = cases.length
for (const {locale, options} of probes)
  cases.push({
    locales: [locale],
    options,
    values: [],
    ranges: [
      ['-3', '-2'],
      ['-3', '2'],
      ['-2', '-1'],
    ],
  })
const result = spawnSync(
  resolve('crates/intl_numberformat/conformance'),
  [directory],
  {
    input: cases.map(value => JSON.stringify(value)).join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  }
)
assert.equal(result.status, 0, result.stderr)
const output: {values: Output[]; ranges: Output[]; error?: string}[] =
  result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
assert.equal(output.length, cases.length)
const reference = cases.map(
  value => new NumberFormat(value.locales, value.options)
)
const native = cases.map(
  value =>
    new (Intl.NumberFormat as unknown as typeof NumberFormat)(
      value.locales,
      value.options
    )
)
const argument = (name: string) =>
  process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
const snapshotOracle = argument('snapshot-oracle')
const snapshotFile = argument('snapshot')
const updateSnapshot = argument('update-snapshot')
if (snapshotOracle) {
  assert.ok(snapshotOracle === 'icu4j' || snapshotOracle === 'icu4c')
  assert.ok(snapshotFile || updateSnapshot, 'Snapshot path required')
}
const cFile =
  argument('icu4c') ||
  (snapshotOracle === 'icu4c'
    ? resolve('conformance-tests/icu4c/number-format-c-fixtures.tsv')
    : undefined)
const cFixture = cFile ? readFileSync(cFile, 'utf8') : undefined
const cRows = cFixture
  ? cFixture
      .trimEnd()
      .split('\n')
      .slice(1)
      .map(row => row.split('\t'))
  : undefined
if (cRows) assert.equal(cRows.length, samples.length)
const snapshotDifferences = []
const differences = []
const oracleDifferences = []
const icu4cSummary: Record<string, number> = {}
const summary: Record<string, number> = {}
for (const [rowIndex, sample] of samples.entries()) {
  const evaluate = (formatter: NumberFormat) =>
    sample.range
      ? {
          text: formatter.formatRange(sample.start, sample.end),
          parts: formatter.formatRangeToParts(sample.start, sample.end),
        }
      : {
          text: formatter.format(sample.start),
          parts: formatter.formatToParts(sample.start),
        }
  assert.equal(output[sample.caseIndex].error, undefined)
  const rust = (
    sample.range
      ? output[sample.caseIndex].ranges
      : output[sample.caseIndex].values
  )[sample.index]
  const ts = evaluate(reference[sample.caseIndex])
  const nativeResult = evaluate(native[sample.caseIndex])
  const c = cRows?.[rowIndex]
  if (c) {
    assert.deepEqual(
      [c[0], c[1], c[3], c[4]],
      [sample.locale, sample.options, sample.start, sample.end]
    )
    if (c[5] !== sample.expected.text)
      oracleDifferences.push({...sample, icu4c: c[5]})
  }
  const expected = snapshotOracle === 'icu4c' ? {text: c![5]} : sample.expected
  const actual =
    snapshotOracle === 'icu4c'
      ? {ts: {text: ts.text}, rust: {text: rust.text}}
      : {ts, rust}
  if (
    Object.values(actual).some(
      value => JSON.stringify(value) !== JSON.stringify(expected)
    )
  ) {
    snapshotDifferences.push({
      locale: sample.locale,
      options: JSON.parse(sample.options),
      start: sample.start,
      ...(sample.range ? {end: sample.end} : {}),
      expected,
      actual,
    })
  }
  for (const [engine, actual] of Object.entries({ts, rust})) {
    if (c && actual.text !== c[5]) {
      const key = `${engine}/${sample.range ? 'range' : 'single'}/text`
      icu4cSummary[key] = (icu4cSummary[key] || 0) + 1
    }
    if (JSON.stringify(actual) === JSON.stringify(sample.expected)) continue
    const kind = actual.text === sample.expected.text ? 'parts-only' : 'text'
    const key = `${engine}/${sample.range ? 'range' : 'single'}/${kind}`
    summary[key] = (summary[key] || 0) + 1
    differences.push({
      engine,
      ...sample,
      kind,
      actual,
      native: nativeResult,
      ...(c ? {icu4c: c[5]} : {}),
    })
  }
}
const specProbes = probes.map(({locale, options}, index) => ({
  locale,
  options,
  inputs: cases[probeStart + index].ranges,
  ts: cases[probeStart + index].ranges.map(([a, b]) =>
    reference[probeStart + index].formatRange(a, b)
  ),
  rust: output[probeStart + index].ranges.map(value => value.text),
  native: cases[probeStart + index].ranges.map(([a, b]) =>
    native[probeStart + index].formatRange(a, b)
  ),
  uncollapsed: cases[probeStart + index].ranges
    .slice(0, 2)
    .map(([a, b]) => [
      reference[probeStart + index].format(a),
      reference[probeStart + index].format(b),
    ]),
}))
const report = {
  icu4j: '79.1',
  icu4c: cRows ? '79.1' : undefined,
  localePacks: readdirSync(directory).filter(file => file.endsWith('.json'))
    .length,
  numericNumberingSystems: new Set(
    samples
      .filter(sample => sample.locale.startsWith('en-u-nu-'))
      .map(sample => sample.locale)
  ).size,
  cldr: '49',
  node: process.version,
  nativeICU: process.versions.icu,
  cases: samples.length,
  summary,
  icu4cSummary,
  differences,
  oracleDifferences,
  specProbes,
}
const outputFile = argument('output')
assert.ok(outputFile || snapshotOracle, '--output=<report.json> required')
if (snapshotOracle) {
  const snapshot =
    [
      {
        oracle: snapshotOracle,
        version: '79.1',
        cldr: '49',
        cases: samples.length,
        // Guard against silently dropping cases or changing the pinned oracle.
        fixtureSHA256: createHash('sha256')
          .update(javaFixture)
          .update(snapshotOracle === 'icu4c' ? cFixture! : '')
          .digest('hex'),
        differences: snapshotDifferences.length,
      },
      ...snapshotDifferences,
      {specProbes: specProbes.map(({native: _, ...probe}) => probe)},
    ]
      .map(value => JSON.stringify(value))
      .join('\n') + '\n'
  if (updateSnapshot) {
    assert.ok(
      !process.env.TEST_SRCDIR,
      'Cannot update snapshots during bazel test'
    )
    writeFileSync(updateSnapshot, snapshot)
  } else {
    const expected = readFileSync(resolve(snapshotFile!), 'utf8')
    const expectedLines = expected.trimEnd().split('\n')
    const actualLines = snapshot.trimEnd().split('\n')
    const firstDifference = actualLines.findIndex(
      (line, index) => line !== expectedLines[index]
    )
    if (firstDifference !== -1 || actualLines.length !== expectedLines.length) {
      const index =
        firstDifference === -1 ? actualLines.length : firstDifference
      const artifact = join(
        process.env.TEST_UNDECLARED_OUTPUTS_DIR ||
          process.env.TEST_TMPDIR ||
          '/tmp',
        `${snapshotOracle}-numberformat-actual.jsonl`
      )
      writeFileSync(artifact, snapshot)
      assert.fail(
        `NumberFormat ${snapshotOracle} snapshot changed at line ${index + 1}.\n` +
          `Expected: ${expectedLines[index] || '<missing>'}\n` +
          `Actual: ${actualLines[index] || '<missing>'}\nActual snapshot: ${artifact}`
      )
    }
  }
}
if (outputFile) writeFileSync(outputFile, JSON.stringify(report, null, 2))
console.log(
  JSON.stringify(
    {
      cases: samples.length,
      summary,
      icu4cSummary,
      oracleDifferences: oracleDifferences.length,
      report: outputFile,
    },
    null,
    2
  )
)
if (
  process.argv.includes('--strict') &&
  (differences.length ||
    Object.keys(icu4cSummary).length ||
    specProbes.some(
      probe => probe.ts[0] === probe.ts[1] || probe.rust[0] === probe.rust[1]
    ))
)
  process.exitCode = 1
