import {Temporal} from '#packages/temporal/index.js'
import {nativeTemporal} from '#packages/temporal/native.js'

declare function print(value: string): void
if (nativeTemporal()) throw new Error('Expected TS Temporal arithmetic')
for (const calendar of ['chinese', 'dangi']) {
  const date = new Temporal.PlainDate(2023, 3, 22, calendar),
    next = new Temporal.PlainDate(2024, 2, 10, calendar),
    actual = [
      date.year,
      date.monthCode,
      date.day,
      date.monthsInYear,
      date.add({months: 1}).toString().slice(0, 10),
      date.until(next, {largestUnit: 'month'}).months,
      next.until(date, {largestUnit: 'month'}).months,
    ]
  if (
    JSON.stringify(actual) !==
    JSON.stringify([2023, 'M02L', 1, 13, '2023-04-20', 11, -11])
  )
    throw new Error(`${calendar}: ${JSON.stringify(actual)}`)
}
const ramadan = new Temporal.PlainDate(2024, 3, 11, 'islamic-umalqura')
if (ramadan.year !== 1445 || ramadan.month !== 9 || ramadan.day !== 1)
  throw new Error('Host Umm al-Qura conversion failed')
print('Host calendar arithmetic through Intl passes')
