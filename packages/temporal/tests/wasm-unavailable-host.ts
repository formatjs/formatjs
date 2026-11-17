import {configureWasmBackend} from '#packages/temporal/wasm.js'
import {Temporal} from '#packages/temporal/index.js'

if (typeof WebAssembly !== 'undefined')
  throw new Error('Expected pinned Hermes without WebAssembly')
let unavailable = false
try {
  configureWasmBackend({} as WebAssembly.Instance)
} catch (error) {
  unavailable = error instanceof TypeError
}
if (!unavailable) throw new Error('Unavailable WASM must fail explicitly')
if (
  Temporal.Instant.from('1970-01-01T00:00Z').toJSON() !== '1970-01-01T00:00:00Z'
)
  throw new Error('TS namespace must remain usable')
