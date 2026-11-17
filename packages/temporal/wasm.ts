import {wasmOperations, wasmStrings} from '#packages/temporal/wasm-wire.js'
import {
  configureNativeTemporal,
  type NativeQuery,
  type NativeCall,
} from '#packages/temporal/native.js'

interface BackendExports {
  memory: WebAssembly.Memory
  temporal_input(capacity: number): number
  temporal_exchange(length: number): number
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
    core.temporal_abi_version() !== 11 ||
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
  configureNativeTemporal(createWasmQuery(instance), createWasmCall(instance))
}

const objectKeys = Object.keys
const objectCreate = Object.create
const isArray = Array.isArray
const setUint32 = View.prototype.setUint32
const setUint16 = View.prototype.setUint16
const getUint16 = View.prototype.getUint16
const setFloat64 = View.prototype.setFloat64
const getFloat64 = View.prototype.getFloat64
const codeUnit = String.prototype.charCodeAt
const textIndex = String.prototype.indexOf
const encodeInto = Encoder?.prototype.encodeInto
const read32 = Function.prototype.call.bind(View.prototype.getUint32)
const write32 = Function.prototype.call.bind(View.prototype.setUint32)
const readSigned = Function.prototype.call.bind(View.prototype.getBigInt64)
const readUnsigned = Function.prototype.call.bind(View.prototype.getBigUint64)
const writeSigned = Function.prototype.call.bind(View.prototype.setBigInt64)
const writeNumber = Function.prototype.call.bind(View.prototype.setFloat64)
const putText = Function.prototype.call.bind(encodeInto!)
const getText = Function.prototype.call.bind(decodeText!)
const arrayIndex = Function.prototype.call.bind(Array.prototype.indexOf)
const stringCodes: Record<string, number> = objectCreate(null)
for (let index = 0; index < wasmStrings.length; index++)
  stringCodes[wasmStrings[index]] = index
const durationPropertyNames = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
]
const datePropertyNames = [
  'dayOfWeek',
  'daysInWeek',
  'dayOfYear',
  'daysInMonth',
  'monthsInYear',
  'daysInYear',
  'inLeapYear',
  'weekOfYear',
  'yearOfWeek',
  'era',
  'eraYear',
  'hour',
  'minute',
  'second',
  'millisecond',
  'microsecond',
  'nanosecond',
  'localNanoseconds',
  'offsetNanoseconds',
  'offset',
  'hoursInDay',
]
const operationCodes: Record<string, number> = objectCreate(null)
for (let index = 0; index < wasmOperations.length; index++)
  operationCodes[wasmOperations[index]] = index

/** @internal One synchronous Rust operation through module-owned record buffers. */
export function createWasmCall(instance: WebAssembly.Instance): NativeCall {
  if (!Encoder || !Decoder || !encodeInto || !memoryBuffer || !instanceExports)
    throw new BadType('Temporal WASM runtime unavailable')
  const core = apply(instanceExports, instance, []) as BackendExports
  if (
    typeof core.temporal_input !== 'function' ||
    typeof core.temporal_exchange !== 'function'
  )
    throw new BadType('Invalid Temporal WASM module')
  const info = core.temporal_input(1024) >>> 0
  if (!info) throw new BadRange('Temporal WASM allocation failed')
  const encoder = new Encoder(),
    decoder = new Decoder('utf-8', {fatal: true})
  const buffer = (): ArrayBuffer => apply(memoryBuffer!, core.memory, [])
  let pointer = 0,
    capacity = 0,
    offset = 0,
    view: DataView,
    inputBytes: Uint8Array
  function refresh(): void {
    const descriptor = new View(buffer(), info, 8)
    pointer = apply(read, descriptor, [0, true])
    capacity = apply(read, descriptor, [4, true])
    view = new View(buffer(), pointer, capacity)
    inputBytes = new Bytes(buffer(), pointer, capacity)
  }
  function reserve(count: number): void {
    if (offset + count <= capacity) return
    const next = Math.max(offset + count, capacity * 2)
    if (next > 0x7fffffff || !core.temporal_input(next))
      throw new BadRange('Temporal WASM allocation failed')
    refresh()
  }
  function byte(value: number): void {
    reserve(1)
    inputBytes[offset++] = value
  }
  function length(value: number): void {
    reserve(4)
    apply(setUint32, view, [offset, value, true])
    offset += 4
  }
  function short(value: number): void {
    reserve(2)
    apply(setUint16, view, [offset, value, true])
    offset += 2
  }
  function key(value: string): void {
    const code = stringCodes[value]
    if (code !== undefined) short(code)
    else {
      short(65535)
      text(value)
    }
  }
  function text(value: string): void {
    reserve(4 + value.length * 3)
    const result = apply(encodeInto!, encoder, [
      value,
      new Bytes(buffer(), pointer + offset + 4, capacity - offset - 4),
    ]) as TextEncoderEncodeIntoResult
    apply(setUint32, view, [offset, result.written, true])
    offset += 4 + result.written
  }
  function write(value: unknown): void {
    if (value === null || value === undefined) byte(0)
    else if (value === false) byte(1)
    else if (value === true) byte(2)
    else if (typeof value === 'number') {
      byte(3)
      reserve(8)
      apply(setFloat64, view, [offset, value, true])
      offset += 8
    } else if (typeof value === 'string') {
      const code = stringCodes[value]
      if (code !== undefined) {
        byte(8)
        short(code)
      } else {
        byte(4)
        text(value)
      }
    } else if (isArray(value)) {
      byte(5)
      length(value.length)
      for (let i = 0; i < value.length; i++) write(value[i])
    } else if (typeof value === 'object') {
      byte(6)
      const names = objectKeys(value),
        countOffset = offset
      length(0)
      let count = 0
      for (let i = 0; i < names.length; i++) {
        const name = names[i],
          item = (value as Record<string, unknown>)[name]
        if (item !== undefined) {
          key(name)
          write(item)
          count++
        }
      }
      apply(setUint32, view, [countOffset, count, true])
    } else throw new BadType('Invalid Temporal WASM record')
  }
  function validateText(value: string): void {
    if (apply(textIndex, value, ['\\u']) >= 0)
      throw new BadRange('Invalid Temporal string')
    for (let i = 0; i < value.length; i++) {
      const first = apply(codeUnit, value, [i]) as number
      if (first >= 0xd800 && first <= 0xdbff) {
        const second = apply(codeUnit, value, [++i]) as number
        if (!(second >= 0xdc00 && second <= 0xdfff))
          throw new BadRange('Invalid Temporal string')
      } else if (first >= 0xdc00 && first <= 0xdfff)
        throw new BadRange('Invalid Temporal string')
    }
  }
  const invoke: NativeCall = (operation, properties) => {
    const code = operationCodes[operation]
    if (code === undefined) throw new BadType('Invalid Temporal WASM operation')
    if (
      apply(textIndex, operation, ['parse']) === 0 &&
      typeof properties.text === 'string'
    )
      validateText(properties.text)
    refresh()
    offset = 0
    byte(code)
    if (
      operation === 'parsePlainDate' ||
      operation === 'parsePlainYearMonth' ||
      operation === 'parsePlainMonthDay'
    ) {
      byte(10)
      text(properties.text as string)
    } else if (operation === 'addPlainDate') {
      byte(10)
      reserve(88)
      apply(setFloat64, view, [offset, properties.epochDay, true])
      offset += 8
      const fields = properties.duration as Record<string, number>
      for (let i = 0; i < durationPropertyNames.length; i++) {
        apply(setFloat64, view, [
          offset,
          fields[durationPropertyNames[i]],
          true,
        ])
        offset += 8
      }
      byte(properties.subtract ? 1 : 0)
      byte(properties.overflow === 'reject' ? 1 : 0)
      text(properties.calendar as string)
    } else write(properties)
    const result = core.temporal_exchange(offset) >>> 0
    if (!result) throw new BadType('Temporal WASM bridge failed')
    const header = new View(buffer(), result, 8)
    const status = apply(read, header, [0, true]) as number
    if (status === 1) throw new BadRange('Invalid Temporal value or range')
    if (status !== 0)
      throw new BadType('Temporal WASM bridge failed: ' + status)
    const size = apply(read, header, [4, true]) as number
    const bytes = new Bytes(buffer(), result + 8, size)
    const output = new View(buffer(), result + 8, size)
    let cursor = 0
    function readLength(): number {
      const count = apply(read, output, [cursor, true]) as number
      cursor += 4
      return count
    }
    function readText(): string {
      const count = readLength()
      const value = apply(decodeText!, decoder, [
        new Bytes(buffer(), result + 8 + cursor, count),
      ]) as string
      cursor += count
      return value
    }
    function decode(): any {
      const tag = bytes[cursor++]
      if (tag === 0) return null
      if (tag === 1) return false
      if (tag === 2) return true
      if (tag === 3) {
        const value = apply(getFloat64, output, [cursor, true])
        cursor += 8
        return value
      }
      if (tag === 4) return readText()
      if (tag === 8) {
        const code = apply(getUint16, output, [cursor, true]) as number
        cursor += 2
        return wasmStrings[code]
      }
      if (tag === 9) {
        const date = {
          year: decode(),
          month: decode(),
          day: decode(),
          monthCode: decode(),
        }
        const mask = readLength()
        const values = objectCreate(null),
          errors = []
        for (let i = 0; i < datePropertyNames.length; i++) {
          const value = decode(),
            key = datePropertyNames[i]
          if (value !== null) values[key] = value
          if (mask & (1 << i)) errors[errors.length] = key
        }
        return {date: date.year === null ? null : date, values, errors}
      }
      if (tag === 5) {
        const count = readLength(),
          values = []
        for (let i = 0; i < count; i++) values[i] = decode()
        return values
      }
      if (tag === 6) {
        const count = readLength(),
          value = objectCreate(null)
        for (let i = 0; i < count; i++) {
          const code = apply(getUint16, output, [cursor, true]) as number
          cursor += 2
          const key = code === 65535 ? readText() : wasmStrings[code]
          value[key] = decode()
        }
        return value
      }
      throw new BadType('Invalid Temporal WASM response')
    }
    return decode()
  }
  if (
    typeof View.prototype.getBigInt64 !== 'function' ||
    typeof View.prototype.setBigInt64 !== 'function' ||
    typeof View.prototype.getBigUint64 !== 'function'
  )
    return invoke
  let fastBuffer: ArrayBuffer | undefined
  let fastView: DataView
  let fastBytes: Uint8Array
  let fastPointer = -1,
    fastCapacity = 0
  let parseBytes: Uint8Array, zoneBytes: Uint8Array
  function fastMemory(): void {
    const memory = buffer()
    if (memory !== fastBuffer) {
      fastBuffer = memory
      fastView = new View(memory)
      fastBytes = new Bytes(memory)
      fastPointer = -1
    }
  }
  function begin(code: number, size: number): number {
    fastMemory()
    let pointer = read32(fastView, info, true),
      capacity = read32(fastView, info + 4, true)
    if (size > capacity) {
      if (!core.temporal_input(Math.max(size, capacity * 2)))
        throw new BadRange('Temporal WASM allocation failed')
      fastMemory()
      pointer = read32(fastView, info, true)
      capacity = read32(fastView, info + 4, true)
    }
    if (pointer !== fastPointer || capacity !== fastCapacity) {
      fastPointer = pointer
      fastCapacity = capacity
      parseBytes = new Bytes(fastBuffer!, pointer + 6, capacity - 6)
      zoneBytes = new Bytes(fastBuffer!, pointer + 33, capacity - 33)
    }
    fastBytes[pointer] = code
    fastBytes[pointer + 1] = 10
    return pointer
  }
  function integer(pointer: number, value: bigint): void {
    writeSigned(fastView, pointer, value, true)
    writeSigned(fastView, pointer + 8, value >> 64n, true)
  }
  function exchange(length: number): number {
    const result = core.temporal_exchange(length) >>> 0
    if (!result) throw new BadType('Temporal WASM bridge failed')
    fastMemory()
    const status = read32(fastView, result, true)
    if (status === 1) throw new BadRange('Invalid Temporal value or range')
    if (status !== 0)
      throw new BadType('Temporal WASM bridge failed: ' + status)
    return result + 8
  }
  function readInteger(pointer: number): bigint {
    if (fastBytes[pointer++] !== 10)
      throw new BadType('Invalid Temporal WASM response')
    return (
      readUnsigned(fastView, pointer, true) +
      (readSigned(fastView, pointer + 8, true) << 64n)
    )
  }
  const modes = [
    'ceil',
    'floor',
    'expand',
    'trunc',
    'halfCeil',
    'halfFloor',
    'halfExpand',
    'halfTrunc',
    'halfEven',
  ]
  invoke.parseInstant = value => {
    validateText(value)
    const pointer = begin(operationCodes.parseInstant, 6 + value.length * 3)
    const encoded = putText(encoder, value, parseBytes)
    write32(fastView, pointer + 2, encoded.written, true)
    return readInteger(exchange(6 + encoded.written))
  }
  invoke.addInstant = (value, fields, subtract) => {
    const pointer = begin(operationCodes.addInstant, 99)
    integer(pointer + 2, value)
    writeNumber(fastView, pointer + 18, fields.years, true)
    writeNumber(fastView, pointer + 26, fields.months, true)
    writeNumber(fastView, pointer + 34, fields.weeks, true)
    writeNumber(fastView, pointer + 42, fields.days, true)
    writeNumber(fastView, pointer + 50, fields.hours, true)
    writeNumber(fastView, pointer + 58, fields.minutes, true)
    writeNumber(fastView, pointer + 66, fields.seconds, true)
    writeNumber(fastView, pointer + 74, fields.milliseconds, true)
    writeNumber(fastView, pointer + 82, fields.microseconds, true)
    writeNumber(fastView, pointer + 90, fields.nanoseconds, true)
    fastBytes[pointer + 98] = subtract ? 1 : 0
    return readInteger(exchange(99))
  }
  invoke.formatInstant = (
    value,
    precision,
    offset,
    mode = 'trunc',
    identifier
  ) => {
    if (
      identifier === undefined &&
      offset !== undefined &&
      (offset <= -86400000000000n || offset >= 86400000000000n)
    )
      throw new BadRange('Invalid Temporal offset')
    const pointer = begin(
      operationCodes.formatInstant,
      33 + (identifier?.length ?? 0) * 3
    )
    integer(pointer + 2, value)
    fastBytes[pointer + 18] =
      precision === 'auto' ? 255 : precision === 'minute' ? 254 : precision
    fastBytes[pointer + 19] = arrayIndex(modes, mode)
    fastBytes[pointer + 20] =
      (offset === undefined ? 0 : 1) | (identifier === undefined ? 0 : 2)
    writeSigned(fastView, pointer + 21, offset ?? 0n, true)
    const length =
      identifier === undefined
        ? 0
        : putText(encoder, identifier, zoneBytes).written
    write32(fastView, pointer + 29, length, true)
    const result = exchange(33 + length)
    if (fastBytes[result] !== 4)
      throw new BadType('Invalid Temporal WASM response')
    return getText(
      decoder,
      new Bytes(fastBuffer!, result + 5, read32(fastView, result + 1, true))
    )
  }
  return invoke
}

export {wasmOperations, wasmStrings}
