import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const directory = process.argv[2]
assert.ok(directory, 'Pass assembled intl-datetimeformat package directory')
const load = file => import(pathToFileURL(resolve(directory, file)).href)
const Native = Intl.DateTimeFormat
const {DateTimeFormat: Owned} = await load('index.js')
try {
  Intl.DateTimeFormat = Owned
  await load('locale-data/ja.js')
} finally {
  Intl.DateTimeFormat = Native
}
const options = {timeZone: 'UTC', dayPeriod: 'long'}
const owned = new Owned('ja', options)
const native = new Native('ja', options)
const first = Date.UTC(2024, 0, 1)
const cases = [
  {
    end: '2024-01-01T23:00:00Z',
    expected: [{type: 'dayPeriod', value: '夜中', source: 'shared'}],
  },
  {
    end: '2024-01-01T04:00:00Z',
    expected: [
      {type: 'dayPeriod', value: '夜中', source: 'startRange'},
      {type: 'literal', value: '～', source: 'shared'},
      {type: 'dayPeriod', value: '朝', source: 'endRange'},
    ],
  },
]
const observations = cases.map(({end, expected}) => {
  const last = Date.parse(end)
  const actual = owned.formatRangeToParts(first, last)
  assert.deepEqual(actual, expected)
  return {
    start: '2024-01-01T00:00:00Z',
    end,
    singles: [owned.format(first), owned.format(last)],
    owned: actual,
    native: native.formatRangeToParts(first, last),
  }
})
console.log(
  JSON.stringify({node: process.version, options, observations}, null, 2)
)
