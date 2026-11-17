import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

if (process.argv[3] === 'empty') globalThis.Intl = {}
else if (process.argv[3] === 'absent') delete globalThis.Intl
else delete Intl.DateTimeFormat
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
