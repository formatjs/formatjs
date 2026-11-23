import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const Native = Intl.DateTimeFormat
const nativeFormat = Object.getOwnPropertyDescriptor(
  Native.prototype,
  'format'
).get
const strictLocaleData =
  process.env.FORMATJS_TEMPORAL_ICU_STRICT_LOCALE_DATA === '1'
let localeDataDifferences = 0
const directory = runfiles.resolve(process.argv[2])
const {Temporal} = await import(pathToFileURL(join(directory, 'index.js')).href)
const rows = readFileSync(runfiles.resolve(process.argv[3]), 'utf8')
  .trim()
  .split('\n')
  .filter(line => !line.startsWith('#'))
assert.equal(rows.length, 384)
function check(direct) {
  for (const row of rows) {
    const [kind, locale, milliseconds, dateStyle, rawFields, icuExpected] =
      row.split('\t')
    // ICU selects fields; the native host supplies its locale names and literals.
    const reference = new Native(locale, {
      calendar: 'gregory',
      timeZone: 'UTC',
      ...JSON.parse(rawFields),
    })
    const nativeExpected = nativeFormat.call(reference)(Number(milliseconds))
    if (nativeExpected !== icuExpected) localeDataDifferences++
    const expected = strictLocaleData ? icuExpected : nativeExpected
    const date = new Temporal.ZonedDateTime(
      BigInt(milliseconds) * 1000000n,
      'UTC'
    )
      .toPlainDate()
      .withCalendar('gregory')
    const value =
      kind === 'PlainYearMonth'
        ? date.toPlainYearMonth()
        : date.toPlainMonthDay()
    const options = {calendar: 'gregory', dateStyle}
    assert.equal(value.toLocaleString(locale, options), expected, row)
    if (direct) {
      const formatter = new Intl.DateTimeFormat(locale, options)
      assert.equal(formatter.format(value), expected, row)
      const parts = formatter.formatToParts(value)
      assert.equal(parts.map(part => part.value).join(''), expected, row)
      const allowed =
        kind === 'PlainYearMonth'
          ? ['literal', 'year', 'month', 'era']
          : ['literal', 'month', 'day']
      assert(
        parts.every(part => allowed.includes(part.type)),
        row
      )
    }
  }
}
check(false)
await import(pathToFileURL(join(directory, 'polyfill-force.js')).href)
check(true)
console.log(
  `384 independent ICU style selections; standalone and installed locale/format/parts; ${localeDataDifferences} raw ICU string differences, host CLDR ${process.versions.cldr}`
)
