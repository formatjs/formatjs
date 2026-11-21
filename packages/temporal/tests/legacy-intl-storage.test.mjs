import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)).href)
const Native = Intl.DateTimeFormat
const date = {year: 'numeric', month: '2-digit', day: '2-digit'}
const time = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hourCycle: 'h23',
}
const cases = [
  {
    name: 'PlainDate',
    options: date,
    first: Date.UTC(2024, 0, 2, 12),
    last: Date.UTC(2024, 0, 3, 12),
    values: T => [new T.PlainDate(2024, 1, 2), new T.PlainDate(2024, 1, 3)],
  },
  {
    name: 'PlainDateTime',
    options: {...date, ...time},
    first: Date.UTC(2024, 0, 2, 3, 4, 5, 123),
    last: Date.UTC(2024, 0, 3, 3, 4, 5, 123),
    values: T => [
      new T.PlainDateTime(2024, 1, 2, 3, 4, 5, 123, 456, 789),
      new T.PlainDateTime(2024, 1, 3, 3, 4, 5, 123, 456, 789),
    ],
  },
  {
    name: 'PlainTime',
    options: time,
    first: Date.UTC(1970, 0, 1, 3, 4, 5, 123),
    last: Date.UTC(1970, 0, 1, 4, 4, 5, 123),
    values: T => [
      new T.PlainTime(3, 4, 5, 123, 456, 789),
      new T.PlainTime(4, 4, 5, 123, 456, 789),
    ],
  },
  {
    name: 'PlainYearMonth',
    options: {calendar: 'iso8601', year: 'numeric', month: '2-digit'},
    first: Date.UTC(2024, 0, 1, 12),
    last: Date.UTC(2024, 1, 1, 12),
    values: T => [new T.PlainYearMonth(2024, 1), new T.PlainYearMonth(2024, 2)],
  },
  {
    name: 'PlainMonthDay',
    options: {calendar: 'iso8601', month: '2-digit', day: '2-digit'},
    first: Date.UTC(1972, 0, 2, 12),
    last: Date.UTC(1972, 0, 3, 12),
    values: T => [new T.PlainMonthDay(1, 2), new T.PlainMonthDay(1, 3)],
  },
  {
    name: 'Instant',
    options: {...date, ...time},
    first: Date.UTC(2024, 0, 2, 3, 4, 5, 123),
    last: Date.UTC(2024, 0, 3, 3, 4, 5, 123),
    values: T => [
      T.Instant.from('2024-01-02T03:04:05.123456789Z'),
      T.Instant.from('2024-01-03T03:04:05.123456789Z'),
    ],
  },
  {
    name: 'Instant submillisecond',
    options: {...date, ...time},
    first: -1,
    last: 0,
    values: T => [new T.Instant(-1n), new T.Instant(1n)],
  },
].map(sample => {
  const options = {...sample.options, timeZone: 'UTC'}
  const formatter = new Native('en', options)
  return {
    ...sample,
    options,
    expected: {
      text: formatter.format(sample.first),
      parts: formatter.formatToParts(sample.first),
      range: formatter.formatRange(sample.first, sample.last),
      rangeParts: formatter.formatRangeToParts(sample.first, sample.last),
      fresh: formatter.format(sample.first),
    },
  }
})

const {Temporal} = await load('index.js')
await load('polyfill-force.js')
assert.notEqual(
  Intl.DateTimeFormat,
  Native,
  'Exercise installed native-Intl bridge'
)
let scenarios = 0
for (const sample of cases) {
  const [first, last] = sample.values(Temporal)
  for (const [prototype, method, label] of [
    [WeakMap.prototype, 'get', 'WeakMap.get'],
    [WeakMap.prototype, 'set', 'WeakMap.set'],
    [Map.prototype, 'get', 'Map.get'],
    [Map.prototype, 'set', 'Map.set'],
    [Reflect, 'apply', 'Reflect.apply'],
    [Reflect, 'construct', 'Reflect.construct'],
    [globalThis, 'Map', 'Map constructor'],
  ]) {
    for (const warm of [false, true]) {
      const create = () => new Intl.DateTimeFormat('en', sample.options)
      const formatter = create()
      if (warm) {
        formatter.formatToParts(first)
        formatter.formatToParts(last)
      }
      const descriptor = Object.getOwnPropertyDescriptor(prototype, method)
      let actual,
        error,
        observed,
        calls = 0
      try {
        Object.defineProperty(prototype, method, {
          value: function () {
            calls++
            observed = new Error(`Mutable ${label}`)
            throw observed
          },
        })
        actual = {
          text: formatter.format(first),
          parts: formatter.formatToParts(first),
          range: formatter.formatRange(first, last),
          rangeParts: formatter.formatRangeToParts(first, last),
          fresh: create().format(first),
        }
      } catch (caught) {
        error = caught
      } finally {
        Object.defineProperty(prototype, method, descriptor)
      }
      assert.equal(
        calls,
        0,
        `${sample.name} ${label} warm=${warm}: ${observed?.stack}`
      )
      assert.equal(
        error,
        undefined,
        `${sample.name} ${label} warm=${warm}: ${error?.stack}`
      )
      assert.deepEqual(
        actual,
        sample.expected,
        `${sample.name} ${label} warm=${warm}`
      )
      scenarios++
    }
  }
}
assert.equal(scenarios, 98)
console.log(
  '98 packaged Temporal/native-Intl private storage and dispatch controls'
)
