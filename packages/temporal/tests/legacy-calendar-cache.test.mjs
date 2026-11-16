import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

let constructions = 0
for (const name of ['DateTimeFormat', 'NumberFormat']) {
  const Native = Intl[name]
  Intl[name] = new Proxy(Native, {
    construct(target, argumentsList, newTarget) {
      constructions++
      return Reflect.construct(target, argumentsList, newTarget)
    },
  })
}
const directory = runfiles.resolve(process.argv[2])
const {Temporal} = await import(pathToFileURL(join(directory, 'index.js')))
await import(pathToFileURL(join(directory, 'polyfill-force.js')))
const cases = ['buddhist', 'japanese', 'coptic', 'islamic-civil'].map(
  calendar => ({
    formatter: new Intl.DateTimeFormat('en', {
      calendar,
      dateStyle: 'full',
      timeZone: 'UTC',
    }),
    dates: Array.from({length: 4}, (_, days) =>
      Temporal.PlainDate.from('2024-02-10').add({days}).withCalendar(calendar)
    ),
  })
)
const expected = cases.map(({formatter, dates}) =>
  dates.map(date => formatter.format(date))
)
const warmed = constructions
for (let iteration = 0; iteration < 10; iteration++) {
  for (const [index, {formatter, dates}] of cases.entries()) {
    for (const [position, date] of dates.entries())
      assert.equal(formatter.format(date), expected[index][position])
  }
}
assert.equal(
  constructions,
  warmed,
  'Repeated formatting must reuse warmed Intl dependencies'
)
