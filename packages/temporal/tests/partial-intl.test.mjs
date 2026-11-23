import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

if (process.argv[3] === 'empty') globalThis.Intl = {}
else if (process.argv[3] === 'absent') delete globalThis.Intl
else if (process.argv[3] === 'numberformat_parts')
  delete Intl.NumberFormat.prototype.formatToParts
else if (process.argv[3] === 'listformat_parts')
  delete Intl.ListFormat.prototype.formatToParts
else delete Intl.DateTimeFormat
if (process.argv[3]?.endsWith('_parts')) {
  const numberDirectory = runfiles.resolve(process.argv[4])
  await import(pathToFileURL(join(numberDirectory, 'polyfill-force.js')))
  await import(pathToFileURL(join(numberDirectory, 'locale-data/en.js')))
  assert.equal(new Intl.NumberFormat('en').format(1234.5), '1,234.5')
  assert.deepEqual(new Intl.NumberFormat('en').formatToParts(1234.5), [
    {type: 'integer', value: '1'},
    {type: 'group', value: ','},
    {type: 'integer', value: '234'},
    {type: 'decimal', value: '.'},
    {type: 'fraction', value: '5'},
  ])
}
const directory = runfiles.resolve(process.argv[2])
const {Temporal} = await import(pathToFileURL(join(directory, 'index.js')))
assert.equal(
  Temporal.Instant.from('2020-01-01T00:00Z').epochNanoseconds,
  1577836800000000000n
)
assert.equal(
  Temporal.PlainDate.from('2020-01-31').add({months: 1}).toString(),
  '2020-02-29'
)
await import(pathToFileURL(join(directory, 'polyfill-force.js')))
assert.equal(globalThis.Temporal, Temporal)
assert.equal(new Date(0).toTemporalInstant().epochNanoseconds, 0n)
