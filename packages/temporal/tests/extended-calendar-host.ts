import {Temporal} from '#packages/temporal/index.js'
import {installTemporal} from '#packages/temporal/install.js'

declare function print(value: string): void
const fixture = (
  globalThis as unknown as {__formatjsExtendedCalendarOracle: string}
).__formatjsExtendedCalendarOracle
const rows = fixture
  .trim()
  .split('\n')
  .filter(line => !line.startsWith('#'))
  .map(line => line.split('\t'))
if (rows.length !== 60)
  throw new Error('Incomplete ICU extended-calendar corpus')
installTemporal(true)
function equal(actual: unknown, expected: unknown, context: string): void {
  if (actual !== expected)
    throw new Error(`${context}: ${String(actual)} !== ${String(expected)}`)
}
let checked = 0
for (const locale of [
  'en',
  'ar-EG',
  'bn',
  'zh-Hans-u-nu-hanidec',
  'en-u-nu-mathsans',
]) {
  const number = new Intl.NumberFormat(locale, {
      useGrouping: false,
      maximumFractionDigits: 0,
    }).format,
    two = new Intl.NumberFormat(locale, {
      useGrouping: false,
      minimumIntegerDigits: 2,
      maximumFractionDigits: 0,
    }).format
  for (const row of rows) {
    const fields = row.slice(3, 10).map(Number),
      calendar = row[1],
      input =
        row[0] === 'yearmonth'
          ? new Temporal.PlainYearMonth(
              fields[0],
              fields[1],
              calendar,
              fields[2]
            )
          : new Temporal.PlainDateTime(
              fields[0],
              fields[1],
              fields[2],
              fields[3],
              fields[4],
              fields[5],
              fields[6],
              0,
              123,
              calendar
            ),
      formatter = new Intl.DateTimeFormat(locale, {
        calendar,
        year: 'numeric',
        month: 'numeric',
        day: '2-digit',
        era: 'short',
        timeZone: 'UTC',
      }),
      parts = formatter.formatToParts(input as unknown as Date),
      actual = Object.fromEntries(parts.map(part => [part.type, part.value]))
    const year = +row[14]
    equal(
      actual.year,
      number(year <= 0 ? 1 - year : year),
      row.join(' ') + ' year'
    )
    if (![number(+row[11]), two(+row[11])].includes(actual.month))
      throw new Error(row.join(' ') + ' month')
    if (row[0] === 'datetime')
      equal(actual.day, two(+row[12]), row.join(' ') + ' day')
    equal(
      formatter.format(input as unknown as Date),
      parts.map(part => part.value).join(''),
      'format/parts'
    )
    const range = formatter.formatRangeToParts(
      input as unknown as Date,
      input as unknown as Date
    )
    if (!range.every(part => part.source === 'shared'))
      throw new Error('Equal range did not collapse')
    checked++
  }
}
print(`${checked} independent ICU extended-calendar checks`)
