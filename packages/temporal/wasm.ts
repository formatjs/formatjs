import {
  configureNativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'

interface BackendExports {
  memory: WebAssembly.Memory
  temporal_abi_version(): number
  temporal_alloc(length: number): number
  temporal_free(pointer: number, length: number): void
  temporal_query(pointer: number, length: number, output: number): number
}
const Instance =
  typeof WebAssembly === 'object' ? WebAssembly.Instance : undefined
const Memory = typeof WebAssembly === 'object' ? WebAssembly.Memory : undefined
const Bytes = Uint8Array
const View = DataView
const BadRange = RangeError
const BadType = TypeError
const Encoder = typeof TextEncoder === 'function' ? TextEncoder : undefined
const Decoder = typeof TextDecoder === 'function' ? TextDecoder : undefined
const encodeText = Encoder?.prototype.encode
const decodeText = Decoder?.prototype.decode
const apply = Reflect.apply
const define = Object.defineProperty
const memoryBuffer =
  Memory && Object.getOwnPropertyDescriptor(Memory.prototype, 'buffer')!.get!
const instanceExports =
  Instance &&
  Object.getOwnPropertyDescriptor(Instance.prototype, 'exports')!.get!
const set = Bytes.prototype.set
const read = View.prototype.getUint32
const inputSize = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Bytes.prototype),
  'length'
)!.get!

export type WasmQuery = NativeQuery & {readonly memoryBytes: number}

/** @internal Synchronous adapter shared by installation and backend controls. */
export function createWasmQuery(instance: WebAssembly.Instance): WasmQuery {
  if (
    !Memory ||
    !Encoder ||
    !Decoder ||
    !encodeText ||
    !decodeText ||
    !memoryBuffer ||
    !instanceExports
  )
    throw new BadType('Temporal WASM runtime unavailable')
  const core = apply(instanceExports, instance, []) as BackendExports
  if (
    !(core.memory instanceof Memory) ||
    typeof core.temporal_abi_version !== 'function' ||
    core.temporal_abi_version() !== 4 ||
    typeof core.temporal_alloc !== 'function' ||
    typeof core.temporal_free !== 'function' ||
    typeof core.temporal_query !== 'function'
  )
    throw new BadType('Invalid Temporal WASM module')
  const buffer = (): ArrayBuffer => apply(memoryBuffer, core.memory, [])
  const encoder = new Encoder()
  const decoder = new Decoder('utf-8', {fatal: true})
  const query: NativeQuery = request => {
    const input = apply(encodeText, encoder, [request]) as Uint8Array
    const inputLength = apply(inputSize, input, []) as number
    const pointer = core.temporal_alloc(inputLength) >>> 0
    if (!pointer) throw new BadRange('Temporal WASM allocation failed')
    let output = 0
    let response = 0,
      length = 0
    try {
      output = core.temporal_alloc(8) >>> 0
      if (!output) throw new BadRange('Temporal WASM allocation failed')
      apply(set, new Bytes(buffer(), pointer, inputLength), [input])
      const status = core.temporal_query(pointer, inputLength, output)
      if (status !== 0) {
        if (status === 1) return status
        throw new BadType('Temporal WASM bridge failed: ' + status)
      }
      // Rust allocation may grow memory; construct every view after the call.
      const result = new View(buffer(), output, 8)
      response = apply(read, result, [0, true])
      length = apply(read, result, [4, true])
      return apply(decodeText, decoder, [new Bytes(buffer(), response, length)])
    } finally {
      if (response) core.temporal_free(response, length)
      if (output) core.temporal_free(output, 8)
      core.temporal_free(pointer, inputLength)
    }
  }
  return define(query, 'memoryBytes', {
    get: () => buffer().byteLength,
  }) as WasmQuery
}

export function configureWasmBackend(instance: WebAssembly.Instance): void {
  configureNativeTemporal(createWasmQuery(instance))
}
