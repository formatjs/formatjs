import {Temporal} from '#packages/temporal/index.js'
import {configureWasmBackend} from '#packages/temporal/wasm.js'
import {installTemporal} from '#packages/temporal/install.js'

export function configureTemporalWasm(
  instance: WebAssembly.Instance
): typeof Temporal {
  configureWasmBackend(instance)
  return Temporal
}
export function installTemporalWasm(
  instance: WebAssembly.Instance,
  force = false
): void {
  configureWasmBackend(instance)
  installTemporal(force)
}
