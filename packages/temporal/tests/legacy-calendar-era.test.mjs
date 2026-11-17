import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'
const Native = Intl.DateTimeFormat
let forced = 0
if (process.env.FORMATJS_TEMPORAL_CALENDAR_FAULT) {
  const parts = Native.prototype.formatToParts,
    resolved = Native.prototype.resolvedOptions
  Native.prototype.formatToParts = function (value) {
    if (resolved.call(this).calendar === 'coptic' && Number(value) < -8e15) {
      forced++
      throw new RangeError('Forced host calendar boundary failure')
    }
    return parts.call(this, value)
  }
}
if (process.env.FORMATJS_TEMPORAL_ARABIC_PROBE) {
  Intl.DateTimeFormat = new Proxy(Native, {
    construct(target, args, newTarget) {
      if (args[0] === 'en-US-u-nu-latn') args[0] = 'ar-EG'
      return Reflect.construct(target, args, newTarget)
    },
  })
}
const directory = runfiles.resolve(process.argv[2])
let {Temporal} = await import(pathToFileURL(join(directory, 'index.js')))
if (process.env.FORMATJS_TEMPORAL_EXTENDED_WASM) {
  const instance = new WebAssembly.Instance(
    new WebAssembly.Module(
      readFileSync(join(directory, 'temporal-backend.wasm'))
    ),
    {}
  )
  if (process.env.FORMATJS_TEMPORAL_EXTENDED_WASM === 'native')
    Temporal = (
      await import(pathToFileURL(join(directory, 'wasm-native.js')))
    ).configureTemporalWasm(instance)
  else
    (
      await import(pathToFileURL(join(directory, 'wasm.js')))
    ).configureWasmBackend(instance)
}
const {checkLegacyCalendarEras} = await import(
  pathToFileURL(runfiles.resolve(process.argv[4]))
)
await import(pathToFileURL(join(directory, 'polyfill-force.js')))
Intl.DateTimeFormat.__addTemporalNamespace(Temporal)
const count = checkLegacyCalendarEras(
  Temporal,
  readFileSync(runfiles.resolve(process.argv[3]), 'utf8'),
  Native
)
assert.equal(count, 936, 'Complete independent ICU era selection')
if (process.env.FORMATJS_TEMPORAL_CALENDAR_FAULT)
  assert(forced > 0, 'Host calendar boundary failure was exercised')
console.log(`${count} legacy calendar checks from 81 independent ICU rows`)
