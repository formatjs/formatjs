import {readFileSync} from 'node:fs'
import {performance} from 'node:perf_hooks'
import {pathToFileURL} from 'node:url'
import {getCompileCacheDir} from 'node:module'

const [entry, backend, wasmPath, calendar] = process.argv.slice(2)
if (getCompileCacheDir() !== undefined)
  throw new Error(
    'Startup benchmark requires disabled persistent compile cache'
  )
globalThis.gc()
const before = process.memoryUsage()
const begin = performance.now()
let start = begin
const module = await import(pathToFileURL(entry))
const importMilliseconds = performance.now() - start
let compileMilliseconds = 0,
  instantiateMilliseconds = 0,
  configureMilliseconds = 0
let Temporal = module.Temporal,
  memory
if (backend !== 'typescript') {
  let bytes = readFileSync(wasmPath)
  start = performance.now()
  const compiled = new WebAssembly.Module(bytes)
  compileMilliseconds = performance.now() - start
  bytes = undefined
  start = performance.now()
  const instance = new WebAssembly.Instance(compiled, {})
  instantiateMilliseconds = performance.now() - start
  start = performance.now()
  if (backend === 'native') Temporal = module.configureTemporalWasm(instance)
  else module.configureWasmBackend(instance)
  configureMilliseconds = performance.now() - start
  memory = instance.exports.memory
}
start = performance.now()
const instant = Temporal.Instant.from('2020-02-28T23:59:59.123456789+05:45')
const iso = instant.toString()
const firstInstantMilliseconds = performance.now() - start
start = performance.now()
const zoned = instant.toZonedDateTimeISO('America/New_York').toString()
const firstTimezoneMilliseconds = performance.now() - start
const isoTimezoneReadyMilliseconds = performance.now() - begin
let chinese = null,
  firstCalendarMilliseconds = null
if (calendar === 'true') {
  start = performance.now()
  chinese = Temporal.PlainDate.from('2024-02-10')
    .withCalendar('chinese')
    .add({months: 1})
    .toString()
  firstCalendarMilliseconds = performance.now() - start
}
const linearMemoryBytes = memory?.buffer.byteLength ?? 0
const readyMilliseconds = performance.now() - begin
globalThis.gc()
const after = process.memoryUsage()
console.log(
  JSON.stringify({
    importMilliseconds,
    compileMilliseconds,
    instantiateMilliseconds,
    configureMilliseconds,
    firstInstantMilliseconds,
    firstTimezoneMilliseconds,
    firstCalendarMilliseconds,
    linearMemoryBytes,
    readyMilliseconds,
    isoTimezoneReadyMilliseconds,
    retainedHeapDeltaBytes: after.heapUsed - before.heapUsed,
    residentDeltaBytes: after.rss - before.rss,
    output: {iso, zoned, chinese},
  })
)
