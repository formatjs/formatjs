import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'
const Native = Intl.DateTimeFormat
if (process.env.FORMATJS_TEMPORAL_STALE_TIMEZONE)
  await import(pathToFileURL(runfiles.resolve(process.argv[5])))
const directory = runfiles.resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)))
let {Temporal} = await load('index.js')
const mode = process.env.FORMATJS_TEMPORAL_TIMEZONE_WASM
let install = () => load('polyfill-force.js')
if (mode) {
  const instance = new WebAssembly.Instance(
    new WebAssembly.Module(
      readFileSync(join(directory, 'temporal-backend.wasm'))
    ),
    {}
  )
  if (mode === 'native') {
    const wasm = await load('wasm-native.js')
    Temporal = wasm.configureTemporalWasm(instance)
    install = () => wasm.installTemporalWasm(instance, true)
  } else {
    ;(await load('wasm.js')).configureWasmBackend(instance)
  }
}
const {checkLegacyTimezoneVersions} = await import(
  pathToFileURL(runfiles.resolve(process.argv[4]))
)
const fixture = readFileSync(runfiles.resolve(process.argv[3]), 'utf8')
for (const installed of [false, true]) {
  if (installed) await install()
  assert.equal(checkLegacyTimezoneVersions(Temporal, fixture, Native), 171)
}
if (process.env.FORMATJS_TEMPORAL_STALE_TIMEZONE)
  assert(globalThis.__formatjsTimezoneFaults() > 0)
console.log(
  '171 ICU timezone-version locale controls before and after installation'
)
