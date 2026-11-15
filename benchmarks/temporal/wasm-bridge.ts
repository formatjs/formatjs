interface CoreExports {
  memory: WebAssembly.Memory
  input_ptr(): number
  output_ptr(): number
  run(operation: number, length: number): number
  duration_total(length: number, unit: number): number
  round_duration(length: number, unit: number, mode: number): number
}

export interface WasmCore {
  readonly memoryBytes: number
  run(operation: number, input: string): string | number
  total(input: string, unit: number): number
  roundDuration(input: string, unit: number, mode: number): string
}

export async function createWasmCore(bytes: BufferSource): Promise<WasmCore> {
  const {instance} = await WebAssembly.instantiate(bytes, {})
  const core = instance.exports as unknown as CoreExports
  const encoder = new TextEncoder(),
    decoder = new TextDecoder()
  const encode = (input: string): number => {
    const result = encoder.encodeInto(
      input,
      new Uint8Array(core.memory.buffer, core.input_ptr(), 256)
    )
    if (result.read !== input.length)
      throw new RangeError('WASM input exceeds 256 bytes')
    return result.written
  }
  const decode = (length: number): string => {
    if (length < 0)
      throw new RangeError('Invalid Temporal WASM operation or input')
    return decoder.decode(
      new Uint8Array(core.memory.buffer, core.output_ptr(), length)
    )
  }
  return {
    memoryBytes: core.memory.buffer.byteLength,
    run(operation, input) {
      const length = encode(input)
      return operation === 4
        ? core.duration_total(length, 1)
        : decode(core.run(operation, length))
    },
    total(input, unit) {
      return core.duration_total(encode(input), unit)
    },
    roundDuration(input, unit, mode) {
      return decode(core.round_duration(encode(input), unit, mode))
    },
  }
}
