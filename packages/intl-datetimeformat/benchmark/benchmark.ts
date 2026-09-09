import {readFileSync} from 'node:fs'
import {DateTimeFormat} from '@formatjs/intl-datetimeformat'
import allData from '@formatjs_generated/tz/all-tz.js'
import {Bench} from 'tinybench'

DateTimeFormat.__addTZData(allData)
DateTimeFormat.__addLocaleData(
  JSON.parse(
    readFileSync(
      new URL('../tests/locale-data/en.json', import.meta.url),
      'utf8'
    )
  )
)

const start = Date.UTC(2024, 0, 15, 10, 15)
const sameDate = Date.UTC(2024, 0, 15, 11, 45)
const differentDate = Date.UTC(2024, 0, 17, 11, 45)
const options: Intl.DateTimeFormatOptions = {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
}
const dateOnly = new DateTimeFormat('en', {timeZone: 'UTC'})
const nativeDateOnly = new Intl.DateTimeFormat('en', {timeZone: 'UTC'})
const formatter = new DateTimeFormat('en', options)
const nativeFormatter = new Intl.DateTimeFormat('en', options)

async function main() {
  const bench = new Bench({time: 1000})
  function add(name: string, polyfill: () => unknown, native: () => unknown) {
    bench.add(`${name} x16 (polyfill)`, () => {
      for (let i = 0; i < 16; i++) polyfill()
    })
    bench.add(`${name} x16 (native)`, () => {
      for (let i = 0; i < 16; i++) native()
    })
  }
  add(
    'format',
    () => dateOnly.format(start),
    () => nativeDateOnly.format(start)
  )
  add(
    'formatRange same date',
    () => formatter.formatRange(start, sameDate),
    () => nativeFormatter.formatRange(start, sameDate)
  )
  add(
    'formatRangeToParts same date',
    () => formatter.formatRangeToParts(start, sameDate),
    () => nativeFormatter.formatRangeToParts(start, sameDate)
  )
  add(
    'formatRange different dates',
    () => formatter.formatRange(start, differentDate),
    () => nativeFormatter.formatRange(start, differentDate)
  )
  add(
    'formatRangeToParts different dates',
    () => formatter.formatRangeToParts(start, differentDate),
    () => nativeFormatter.formatRangeToParts(start, differentDate)
  )
  add(
    'formatRange equal endpoints',
    () => formatter.formatRange(start, start),
    () => nativeFormatter.formatRange(start, start)
  )
  await bench.run()
  console.table(bench.table())
}

await main()
