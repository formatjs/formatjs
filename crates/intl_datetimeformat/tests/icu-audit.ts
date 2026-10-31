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
const formatters = new Map<string, DateTimeFormat>()
const differences = []
const summary: Record<string, number> = {}
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
  const actual = {ts, rust: rust[i]}
  for (const [engine, value] of Object.entries(actual)) {
    if (JSON.stringify(value) === JSON.stringify(expected)) continue
    const key = `${engine}/${sample.end === undefined ? 'single' : 'range'}/${value.text === expected.text ? 'parts-only' : 'text'}`
    summary[key] = (summary[key] || 0) + 1
  }
  if (
    Object.values(actual).some(
      value => JSON.stringify(value) !== JSON.stringify(expected)
    )
  )
    differences.push({...sample, expected, actual})
}
const snapshot =
  [
    {
      oracle: 'icu4j',
      version: '79.1',
      cldr: '49',
      cases: cases.length,
      fixtureSHA256: createHash('sha256').update(fixture).digest('hex'),
      differences: differences.length,
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
    summary,
    differences: differences.length,
  })
)
