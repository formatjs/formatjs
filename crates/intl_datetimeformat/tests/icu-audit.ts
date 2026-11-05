import {DateTimeFormat} from '@formatjs/intl-datetimeformat'
import calendars from '#packages/intl-datetimeformat/calendars/all.js'
import {runfiles} from '@bazel/runfiles'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

interface Output {
  text: string
  parts: {type: string; value: string; source?: string}[]
}
const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const argument = (name: string) =>
  process.argv.find(s => s.startsWith(`--${name}=`))?.slice(name.length + 3)
const update = argument('update-snapshot')
assert.ok(
  !update || !process.env.TEST_SRCDIR,
  'Cannot update snapshots during bazel test'
)
const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'))
const fixture = readFileSync(
  resolve('conformance-tests/icu4j/date-time-format-fixtures.tsv'),
  'utf8'
)
const rows = fixture
  .trimEnd()
  .split('\n')
  .slice(1)
  .map(row => row.split('\t'))
assert.ok(
  rows.every(row => row.length === 11),
  'Raw ICU evidence must accompany every case'
)
const rangeKey = (
  locale: string,
  options: string,
  start: string,
  end: string
) => JSON.stringify([locale, options, start, end])
const icu4cFixture = readFileSync(
  resolve('conformance-tests/icu4c/date-time-format-range-fixtures.tsv'),
  'utf8'
)
const icu4c = new Map(
  icu4cFixture
    .trimEnd()
    .split('\n')
    .map((line): [string, Output] => {
      const row = line.split('\t')
      assert.equal(row.length, 8)
      return [
        rangeKey(row[0], row[1], row[4], row[5]),
        {text: row[6], parts: JSON.parse(row[7])} as Output,
      ]
    })
)
assert.equal(icu4c.size, rows.filter(row => row[5]).length)
for (const row of rows)
  if (row[5])
    assert.ok(
      icu4c.has(rangeKey(row[0], row[1], row[4], row[5])),
      'Missing ICU4C range'
    )
for (const value of icu4c.values())
  assert.equal(value.parts.map(part => part.value).join(''), value.text)
const oracleTextDisagreements = rows.filter(
  row =>
    row[5] &&
    icu4c.get(rangeKey(row[0], row[1], row[4], row[5]))!.text !== row[8]
).length

const contractAdjustments = {
  collapsedRanges: rows.filter(
    row => row[5] && (row[6] !== row[8] || row[7] !== row[9])
  ).length,
  numericYears: rows.filter(
    row =>
      !row[5] && JSON.parse(row[1]).calendar === 'japanese' && row[6] !== row[8]
  ).length,
  hourCycles: rows.filter(
    row => !row[5] && JSON.parse(row[1]).hourCycle && row[6] !== row[8]
  ).length,
}
interface FieldEvidence {
  start: Record<string, string>
  end: Record<string, string>
}
interface OracleFields {
  periods?: FieldEvidence
  zones?: FieldEvidence
  clocks?: FieldEvidence
}
const same = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right)
function classify(
  options: Intl.DateTimeFormatOptions,
  expected: Output,
  actual: Output,
  secondary: Output | undefined,
  fields: OracleFields
): string {
  if (same(actual, secondary)) return 'icu4c'
  let changedHour = false
  const boundary: Partial<
    Record<
      NonNullable<Intl.DateTimeFormatOptions['hourCycle']>,
      [number, number]
    >
  > = {h11: [12, 0], h12: [0, 12], h23: [24, 0], h24: [0, 24]}
  const correction = options.hourCycle && boundary[options.hourCycle]
  if (
    correction &&
    fields.clocks &&
    actual.parts.length === expected.parts.length &&
    expected.parts.every((part, index) => {
      const other = actual.parts[index]
      if (same(part, other)) return true
      if (
        part.type !== 'hour' ||
        other.type !== part.type ||
        part.source !== other.source ||
        Number(part.value) !== correction[0] ||
        Number(other.value) !== correction[1]
      )
        return false
      changedHour = true
      return Object.values(
        fields.clocks![other.source === 'endRange' ? 'end' : 'start']
      ).includes(other.value)
    }) &&
    changedHour
  )
    return 'hour-cycle'
  let changedZone = false
  if (
    actual.parts.length === expected.parts.length &&
    expected.parts.every((part, index) => {
      const other = actual.parts[index]
      if (same(part, other)) return true
      if (
        part.type !== 'timeZoneName' ||
        other.type !== part.type ||
        part.source !== 'shared' ||
        other.source !== 'shared' ||
        !fields.zones
      )
        return false
      changedZone = true
      return Object.keys(fields.zones.end).some(
        pattern =>
          fields.zones!.end[pattern] === part.value &&
          fields.zones!.start[pattern] === other.value
      )
    }) &&
    changedZone
  )
    return 'shared-start-timezone'
  const periods = actual.parts.filter(part => part.type === 'dayPeriod')
  const originalPeriods = expected.parts.filter(
    part => part.type === 'dayPeriod'
  )
  const frame = (parts: Output['parts']) =>
    parts.filter(part => !['literal', 'dayPeriod'].includes(part.type))
  if (
    fields.periods &&
    periods.length === 2 &&
    periods[0].source === 'startRange' &&
    periods[1].source === 'endRange' &&
    periods[0].value !== periods[1].value &&
    periods.every((part, index) =>
      Object.values(fields.periods![index ? 'end' : 'start']).includes(
        part.value
      )
    )
  ) {
    const actualFrame = frame(actual.parts),
      expectedFrame = frame(expected.parts)
    if (
      options.dayPeriod &&
      new Set(originalPeriods.map(part => part.value)).size < 2 &&
      same(actualFrame, expectedFrame)
    )
      return 'flexible-day-period'
    if (
      !options.dayPeriod &&
      !originalPeriods.length &&
      fields.periods.start.a !== undefined &&
      actualFrame.length === expectedFrame.length &&
      actualFrame.every((part, index) => {
        const original = expectedFrame[index]
        if (same(part, original)) return true
        return (
          part.type === 'hour' &&
          original.type === part.type &&
          part.source === original.source &&
          Number(part.value) === Number(original.value) &&
          fields.clocks &&
          Object.values(
            fields.clocks[part.source === 'endRange' ? 'end' : 'start']
          ).includes(part.value)
        )
      })
    )
      return 'ampm-label-repair'
  }
  return 'unclassified'
}
const locales = new Set(rows.map(row => row[0]))
const directory = resolve('crates/intl_datetimeformat/locale-data')
const files = readdirSync(directory)
  .filter(f => f.endsWith('.json') && locales.has(f.slice(0, -5)))
  .sort(
    (a, b) =>
      Number(b === 'en.json') - Number(a === 'en.json') || a.localeCompare(b)
  )
  .map(f => join(directory, f))
for (const file of files) DateTimeFormat.__addLocaleData(read(file))
const timezone = resolve('packages/intl-datetimeformat/tz-all.json')
DateTimeFormat.__addTZData(read(timezone))
DateTimeFormat.__addCalendarData(...calendars)
const providers = calendars.map(({calendar}) =>
  resolve(`crates/intl_datetimeformat_calendars/calendar-data/${calendar}.json`)
)
const patches = calendars.flatMap(({calendar}) =>
  ['en', 'ja', 'ar', 'he'].map(locale =>
    resolve(
      `packages/intl-datetimeformat-calendar-${calendar}/locale-data-json/${locale}.json`
    )
  )
)
for (const file of patches) DateTimeFormat.__addCalendarLocaleData(read(file))
assert.ok(rows.length > 12000, 'Incomplete DateTimeFormat matrix')
const cases = rows.map(([locale, options, , , start, end]) => ({
  locale,
  options: JSON.parse(options),
  start: Number(start),
  ...(end ? {end: Number(end)} : {}),
}))
const result = spawnSync(resolve('crates/intl_datetimeformat/audit'), [], {
  input: JSON.stringify({files, timezone, providers, patches, cases}),
  encoding: 'utf8',
  maxBuffer: 128 * 1024 * 1024,
  timeout: 120000,
})
assert.equal(result.status, 0, result.stderr)
const rust: Output[] = JSON.parse(result.stdout)
assert.equal(rust.length, cases.length)
const formatters = new Map<string, InstanceType<typeof DateTimeFormat>>()
const differences = []
const summary: Record<string, number> = {}
const parity: Record<string, number> = {}
for (const [i, sample] of cases.entries()) {
  const key = sample.locale + JSON.stringify(sample.options)
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new DateTimeFormat(sample.locale, sample.options)
    formatters.set(key, formatter)
  }
  const ts =
    sample.end === undefined
      ? {
          text: formatter.format(sample.start),
          parts: formatter.formatToParts(sample.start),
        }
      : {
          text: formatter.formatRange(sample.start, sample.end),
          parts: formatter.formatRangeToParts(sample.start, sample.end),
        }
  const expected: Output = {text: rows[i][6], parts: JSON.parse(rows[i][7])}
  for (const actual of [ts, rust[i]]) {
    assert.equal(
      actual.parts.map(p => p.value).join(''),
      actual.text,
      'Parts must concatenate to formatted string'
    )
  }
  assert.deepEqual(ts, rust[i], `TS/Rust divergence: ${JSON.stringify(sample)}`)
  const actual = {ts, rust: rust[i]}
  for (const [engine, value] of Object.entries(actual)) {
    if (JSON.stringify(value) === JSON.stringify(expected)) continue
    const key = `${engine}/${sample.end === undefined ? 'single' : 'range'}/${value.text === expected.text ? 'parts-only' : 'text'}`
    summary[key] = (summary[key] || 0) + 1
  }
  if (Object.values(actual).some(value => !same(value, expected))) {
    const secondary =
      sample.end === undefined
        ? undefined
        : icu4c.get(rangeKey(rows[i][0], rows[i][1], rows[i][4], rows[i][5]))
    const fields: OracleFields = JSON.parse(rows[i][10])
    const classification = classify(
      sample.options,
      expected,
      ts,
      secondary,
      fields
    )
    parity[classification] = (parity[classification] || 0) + 1
    differences.push({
      ...sample,
      classification,
      expected,
      ...(secondary ? {icu4c: secondary} : {}),
      ...(classification !== 'icu4c' && Object.keys(fields).length
        ? {oracleFields: fields}
        : {}),
      ...(rows[i][6] !== rows[i][8] || rows[i][7] !== rows[i][9]
        ? {rawExpected: {text: rows[i][8], parts: JSON.parse(rows[i][9])}}
        : {}),
      actual,
    })
  }
}
const snapshot =
  [
    {
      oracle: 'icu4j',
      version: '79.1',
      cldr: '49',
      cases: cases.length,
      contractAdjustments,
      parity,
      icu4c: {
        version: '79.1',
        cases: icu4c.size,
        textDisagreements: oracleTextDisagreements,
        fixtureSHA256: createHash('sha256').update(icu4cFixture).digest('hex'),
      },
      fixtureSHA256: createHash('sha256').update(fixture).digest('hex'),
      differences: differences.length,
      unclassified: parity.unclassified || 0,
    },
    ...differences,
  ]
    .map(value => JSON.stringify(value))
    .join('\n') + '\n'
if (update) writeFileSync(update, snapshot)
else {
  const expected = readFileSync(
    resolve('crates/intl_datetimeformat/tests/snapshots/icu4j.jsonl'),
    'utf8'
  )
  if (snapshot !== expected) {
    const artifact = join(
      process.env.TEST_UNDECLARED_OUTPUTS_DIR ||
        process.env.TEST_TMPDIR ||
        '/tmp',
      'datetimeformat-icu4j-actual.jsonl'
    )
    writeFileSync(artifact, snapshot)
    const lines = snapshot.trimEnd().split('\n'),
      previous = expected.trimEnd().split('\n')
    const changed = lines.findIndex((line, i) => line !== previous[i])
    assert.fail(
      `DateTimeFormat ICU snapshot changed at line ${changed < 0 ? lines.length + 1 : changed + 1}. Actual snapshot: ${artifact}`
    )
  }
}
console.log(
  JSON.stringify({
    cases: cases.length,
    contractAdjustments,
    parity,
    summary,
    differences: differences.length,
  })
)

assert.equal(
  parity.unclassified || 0,
  0,
  `Unclassified ICU differences: ${update || process.env.TEST_UNDECLARED_OUTPUTS_DIR || 'audit output'}`
)
