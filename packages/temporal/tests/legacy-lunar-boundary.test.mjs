import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)))
const Native = Intl.DateTimeFormat,
  nativeParts = Native.prototype.formatToParts
let {Temporal} = await load('index.js')
if (process.env.FORMATJS_TEMPORAL_LUNAR_WASM) {
  const instance = new WebAssembly.Instance(
    new WebAssembly.Module(
      readFileSync(join(directory, 'temporal-backend.wasm'))
    ),
    {}
  )
  if (process.env.FORMATJS_TEMPORAL_LUNAR_WASM === 'native') {
    const wasm = await load('wasm-native.js')
    Temporal = wasm.configureTemporalWasm(instance)
    wasm.installTemporalWasm(instance, true)
  } else {
    ;(await load('wasm.js')).configureWasmBackend(instance)
    await load('polyfill-force.js')
  }
} else await load('polyfill-force.js')
const {checkLegacyLunarBoundaries} = await import(
  pathToFileURL(runfiles.resolve(process.argv[3]))
)
assert.equal(checkLegacyLunarBoundaries(Temporal, Native, nativeParts), 24)
console.log(
  '24 lunar calendar/date/timezone boundary combinations; Number, Date, Instant, ZonedDateTime and ranges'
)
