import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'
import {chinese} from '@formatjs_generated/icu.calendar/chinese.js'
import {dangi} from '@formatjs_generated/icu.calendar/dangi.js'

const numeric = await import(pathToFileURL(runfiles.resolve(process.argv[2])))
const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
let years = 0,
  months = 0
function equal(actual, expected, context) {
  if (actual !== expected)
    throw new Error(`${context}: ${actual} !== ${expected}`)
}
for (const [calendar, data] of [
  ['chinese', chinese],
  ['dangi', dangi],
]) {
  let start = data.checkpoints[0],
    serial = numeric.calendarMonthSerial(calendar, data.firstYear, 1)
  for (let index = 0; index < data.years.length / 2; index++) {
    const year = data.firstYear + index,
      packed =
        data.dictionary[
          alphabet.indexOf(data.years[index * 2]) * 64 +
            alphabet.indexOf(data.years[index * 2 + 1])
        ],
      count = packed >>> 13 ? 13 : 12,
      context = `${calendar}:${year}`
    equal(numeric.calendarStartOfYear(calendar, year), start, context)
    equal(numeric.monthsInYear(calendar, year), count, context)
    const last = numeric.tableAddMonths(calendar, year, 1, count - 1)
    equal(last.year, year, context)
    equal(last.month, count, context)
    for (let month = 1; month <= count; month++) {
      equal(
        numeric.calendarMonthSerial(calendar, year, month),
        serial++,
        context
      )
      const length = 29 + ((packed >>> (month - 1)) & 1)
      equal(numeric.daysInMonth(calendar, year, month), length, context)
      const epoch = start + length - 1
      if (epoch >= -110000000 && epoch <= 110000000) {
        const date = numeric.calendarFromEpochDayRaw(calendar, epoch)
        equal(date.year, year, context)
        equal(date.month, month, context)
        equal(date.day, length, context)
        const leap = packed >>> 13
        const code =
          'M' +
          String(month - Number(leap > 0 && month > leap)).padStart(2, '0') +
          (leap > 0 && month === leap + 1 ? 'L' : '')
        equal(date.monthCode, code, context)
      }
      start += length
      months++
    }
    years++
  }
  equal(start, data.endDay, calendar)
}
console.log(JSON.stringify({years, months}))
