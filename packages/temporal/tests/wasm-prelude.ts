import {configureWasmBackend} from '#packages/temporal/wasm.js'
import {installTemporal} from '#packages/temporal/install.js'

const host = globalThis as typeof globalThis & {
  __formatjsTemporalWasmInstance?: WebAssembly.Instance
}
if (!host.__formatjsTemporalWasmInstance)
  throw new Error('Temporal WASM instance missing')
configureWasmBackend(host.__formatjsTemporalWasmInstance)
delete host.__formatjsTemporalWasmInstance
installTemporal(true)
