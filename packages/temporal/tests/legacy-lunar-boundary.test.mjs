import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)))
const Native = Intl.DateTimeFormat,
  nativeParts = Native.prototype.formatToParts
const {Temporal} = await load('index.js')
await load('polyfill-force.js')

const {checkLegacyLunarBoundaries} = await import(
  pathToFileURL(runfiles.resolve(process.argv[3]))
)
assert.equal(checkLegacyLunarBoundaries(Temporal, Native, nativeParts), 24)
console.log(
  '24 lunar calendar/date/timezone boundary combinations; Number, Date, Instant, ZonedDateTime and ranges'
)
