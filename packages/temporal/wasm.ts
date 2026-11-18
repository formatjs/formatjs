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
  temporal_round_instant?(
    value: bigint,
    unit: number,
    increment: number,
    mode: number
  ): bigint
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
    core.temporal_abi_version() !== 18 ||
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
const ToNumber = Number
const asSigned64 = BigInt.asIntN
const readNumber = Function.prototype.call.bind(View.prototype.getFloat64)
const read16 = Function.prototype.call.bind(View.prototype.getUint16)
const read32 = Function.prototype.call.bind(View.prototype.getUint32)
const write32 = Function.prototype.call.bind(View.prototype.setUint32)
const readSigned = Function.prototype.call.bind(View.prototype.getBigInt64)
const readUnsigned = Function.prototype.call.bind(View.prototype.getBigUint64)
const writeSigned = Function.prototype.call.bind(View.prototype.setBigInt64)
const writeNumber = Function.prototype.call.bind(View.prototype.setFloat64)
const putText = Function.prototype.call.bind(encodeInto!)
const getText = Function.prototype.call.bind(decodeText!)
const arrayIndex = Function.prototype.call.bind(Array.prototype.indexOf)
function decodeISODate(output: DataView, bytes: Uint8Array, start: number) {
  const month = bytes[start + 8]
  const date = {
    year: read32(output, start + 4, true) | 0,
    month,
    day: bytes[start + 9],
    monthCode: wasmStrings[(month - 1) * 2],
  }
  const daysInYear = apply(getUint16, output, [start + 12, true])
  return {
    epochDay: read32(output, start, true) | 0,
    calendar: 'iso8601',
    properties: {
      date,
      values: {
        era: undefined,
        eraYear: undefined,
        dayOfWeek: bytes[start + 10],
        daysInWeek: 7,
        dayOfYear: apply(getUint16, output, [start + 14, true]),
        daysInMonth: bytes[start + 11],
        monthsInYear: 12,
        daysInYear,
        inLeapYear: daysInYear === 366,
        weekOfYear: bytes[start + 16],
        yearOfWeek: read32(output, start + 17, true) | 0,
      },
      errors: [],
    },
  }
}
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
    return decodeResult(result)
  }
  function decodeResult(result: number): any {
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
      if (tag === 16) {
        const ns =
          readUnsigned(output, cursor, true) +
          (readSigned(output, cursor + 8, true) << 64n)
        cursor += 16
        return {
          epochNanoseconds: ns,
          calendar: undefined,
          timeZone: undefined,
          properties: decode(),
        }
      }
      if (tag === 11) {
        const start = cursor
        cursor += 21
        return decodeISODate(output, bytes, start)
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
  let parseBytes: Uint8Array,
    zoneBytes: Uint8Array,
    calendarBytes: Uint8Array,
    formatCalendarBytes: Uint8Array
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
      calendarBytes = new Bytes(fastBuffer!, pointer + 96, capacity - 96)
      formatCalendarBytes = new Bytes(fastBuffer!, pointer + 15, capacity - 15)
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
    const tag = fastBytes[pointer++]
    if (tag === 15) return readSigned(fastView, pointer, true)
    if (tag !== 10) throw new BadType('Invalid Temporal WASM response')
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
  const disambiguations = ['compatible', 'earlier', 'later', 'reject']
  const offsetOptions = ['prefer', 'use', 'ignore', 'reject']
  const calendarNames = ['auto', 'always', 'never', 'critical']
  invoke.formatDate = (operation, slot, calendarName) => {
    const pointer = begin(
      operationCodes[operation],
      15 + slot.calendar.length * 3
    )
    writeNumber(fastView, pointer + 2, slot.epochDay, true)
    fastBytes[pointer + 10] = arrayIndex(calendarNames, calendarName)
    const encoded = putText(encoder, slot.calendar, formatCalendarBytes)
    write32(fastView, pointer + 11, encoded.written, true)
    const result = exchange(15 + encoded.written)
    if (fastBytes[result] !== 4)
      throw new BadType('Invalid Temporal WASM response')
    return getText(
      decoder,
      new Bytes(fastBuffer!, result + 5, read32(fastView, result + 1, true))
    )
  }
  function writeISOFields(
    pointer: number,
    fields: Record<string, unknown>,
    overflow: string
  ): void {
    writeNumber(fastView, pointer, fields.year, true)
    writeNumber(fastView, pointer + 8, fields.month, true)
    writeNumber(fastView, pointer + 16, fields.day, true)
    const code = fields.monthCode as string | undefined
    fastBytes[pointer + 24] =
      code === undefined
        ? 0
        : (apply(codeUnit, code, [1]) - 48) * 10 +
          apply(codeUnit, code, [2]) -
          48
    fastBytes[pointer + 25] = code === undefined ? 0 : code.length === 4 ? 3 : 1
    fastBytes[pointer + 26] = overflow === 'reject' ? 1 : 0
  }
  invoke.withISODate = (operation, slot, fields, overflow) => {
    const pointer = begin(operationCodes[operation], 37)
    writeNumber(fastView, pointer + 2, slot.epochDay, true)
    writeISOFields(pointer + 10, fields, overflow)
    const result = exchange(37)
    if (fastBytes[result] !== 11)
      throw new BadType('Invalid Temporal WASM response')
    return decodeISODate(fastView, fastBytes, result + 1)
  }
  invoke.createISODate = (fields, overflow) => {
    const pointer = begin(operationCodes.calendarToEpochDay, 29)
    writeISOFields(pointer + 2, fields, overflow)
    const result = exchange(29)
    if (fastBytes[result] !== 11)
      throw new BadType('Invalid Temporal WASM response')
    return decodeISODate(fastView, fastBytes, result + 1)
  }
  invoke.parseDate = (value, operation) => {
    validateText(value)
    const pointer = begin(operationCodes[operation], 6 + value.length * 3)
    const encoded = putText(encoder, value, parseBytes)
    write32(fastView, pointer + 2, encoded.written, true)
    const result = exchange(6 + encoded.written)
    return fastBytes[result] === 11
      ? decodeISODate(fastView, fastBytes, result + 1)
      : decodeResult(result - 8)
  }
  function dateTimeResult(result: number) {
    if (fastBytes[result] !== 12) return decodeResult(result - 8)
    const ns =
      readUnsigned(fastView, result + 1, true) +
      (readSigned(fastView, result + 9, true) << 64n)
    const month = fastBytes[result + 26]
    const daysInYear = read16(fastView, result + 30, true)
    return {
      epochNanoseconds: ns,
      calendar: 'iso8601',
      properties: {
        date: {
          year: read32(fastView, result + 22, true) | 0,
          month,
          day: fastBytes[result + 27],
          monthCode: wasmStrings[(month - 1) * 2],
        },
        values: {
          era: undefined,
          eraYear: undefined,
          dayOfWeek: fastBytes[result + 28],
          daysInWeek: 7,
          dayOfYear: read16(fastView, result + 32, true),
          daysInMonth: fastBytes[result + 29],
          monthsInYear: 12,
          daysInYear,
          inLeapYear: daysInYear === 366,
          weekOfYear: fastBytes[result + 34],
          yearOfWeek: read32(fastView, result + 35, true) | 0,
          hour: fastBytes[result + 39],
          minute: fastBytes[result + 40],
          second: fastBytes[result + 41],
          millisecond: read16(fastView, result + 42, true),
          microsecond: read16(fastView, result + 44, true),
          nanosecond: read16(fastView, result + 46, true),
        },
        errors: [],
      },
    }
  }
  function clockResult(pointer: number) {
    if (fastBytes[pointer] !== 13)
      throw new BadType('Invalid Temporal WASM response')
    return {
      nanoseconds: readNumber(fastView, pointer + 1, true),
      bigintNanoseconds: undefined,
      fields: [
        fastBytes[pointer + 9],
        fastBytes[pointer + 10],
        fastBytes[pointer + 11],
        read16(fastView, pointer + 12, true),
        read16(fastView, pointer + 14, true),
        read16(fastView, pointer + 16, true),
      ],
    }
  }
  invoke.differencePlainTime = (
    one,
    other,
    largest,
    smallest,
    increment,
    mode
  ) => {
    const pointer = begin(operationCodes.differencePlainTime, 25)
    writeNumber(fastView, pointer + 2, ToNumber(one), true)
    writeNumber(fastView, pointer + 10, ToNumber(other), true)
    fastBytes[pointer + 18] = arrayIndex(units, largest)
    fastBytes[pointer + 19] = arrayIndex(units, smallest)
    write32(fastView, pointer + 20, increment, true)
    fastBytes[pointer + 24] = arrayIndex(modes, mode)
    const result = exchange(25)
    if (fastBytes[result] !== 14)
      throw new BadType('Invalid Temporal WASM response')
    return {
      years: readNumber(fastView, result + 1, true),
      months: readNumber(fastView, result + 9, true),
      weeks: readNumber(fastView, result + 17, true),
      days: readNumber(fastView, result + 25, true),
      hours: readNumber(fastView, result + 33, true),
      minutes: readNumber(fastView, result + 41, true),
      seconds: readNumber(fastView, result + 49, true),
      milliseconds: readNumber(fastView, result + 57, true),
      microseconds: readNumber(fastView, result + 65, true),
      nanoseconds: readNumber(fastView, result + 73, true),
    }
  }
  invoke.formatDuration = (fields, precision, mode) => {
    const pointer = begin(operationCodes.formatDuration, 84)
    for (let index = 0; index < durationPropertyNames.length; index++)
      writeNumber(
        fastView,
        pointer + 2 + index * 8,
        fields[durationPropertyNames[index] as keyof typeof fields],
        true
      )
    fastBytes[pointer + 82] = precision === 'auto' ? 255 : precision
    fastBytes[pointer + 83] = arrayIndex(modes, mode)
    const result = exchange(84)
    if (fastBytes[result] !== 4)
      throw new BadType('Invalid Temporal WASM response')
    return getText(
      decoder,
      new Bytes(fastBuffer!, result + 5, read32(fastView, result + 1, true))
    )
  }
  invoke.parsePlainTimeResult = value => {
    validateText(value)
    const pointer = begin(operationCodes.parsePlainTime, 6 + value.length * 3)
    const encoded = putText(encoder, value, parseBytes)
    write32(fastView, pointer + 2, encoded.written, true)
    return clockResult(exchange(6 + encoded.written))
  }
  invoke.regulatePlainTimeResult = (values, constrain) => {
    const pointer = begin(operationCodes.regulatePlainTime, 51)
    for (let index = 0; index < 6; index++)
      writeNumber(fastView, pointer + 2 + index * 8, values[index], true)
    fastBytes[pointer + 50] = constrain ? 1 : 0
    return clockResult(exchange(51))
  }
  invoke.addPlainTimeResult = (value, fields, subtract) => {
    const pointer = begin(operationCodes.addPlainTime, 91)
    writeNumber(fastView, pointer + 2, ToNumber(value), true)
    for (let index = 0; index < durationPropertyNames.length; index++)
      writeNumber(
        fastView,
        pointer + 10 + index * 8,
        fields[durationPropertyNames[index] as keyof typeof fields],
        true
      )
    fastBytes[pointer + 90] = subtract ? 1 : 0
    return clockResult(exchange(91))
  }
  invoke.roundPlainTimeResult = (value, unit, increment, mode) => {
    const pointer = begin(operationCodes.roundPlainTime, 16)
    writeNumber(fastView, pointer + 2, ToNumber(value), true)
    fastBytes[pointer + 10] = arrayIndex(units, unit)
    write32(fastView, pointer + 11, increment, true)
    fastBytes[pointer + 15] = arrayIndex(modes, mode)
    return clockResult(exchange(16))
  }
  invoke.formatPlainTime = (value, precision, mode) => {
    const pointer = begin(operationCodes.formatPlainTime, 12)
    writeNumber(fastView, pointer + 2, ToNumber(value), true)
    fastBytes[pointer + 10] =
      precision === 'auto' ? 255 : precision === 'minute' ? 254 : precision
    fastBytes[pointer + 11] = arrayIndex(modes, mode)
    const result = exchange(12)
    if (fastBytes[result] !== 4)
      throw new BadType('Invalid Temporal WASM response')
    return getText(
      decoder,
      new Bytes(fastBuffer!, result + 5, read32(fastView, result + 1, true))
    )
  }
  invoke.parsePlainDateTime = value => {
    validateText(value)
    const pointer = begin(
      operationCodes.parsePlainDateTime,
      6 + value.length * 3
    )
    const encoded = putText(encoder, value, parseBytes)
    write32(fastView, pointer + 2, encoded.written, true)
    const result = exchange(6 + encoded.written)
    return dateTimeResult(result)
  }
  invoke.formatPlainDateTime = (
    value,
    calendar,
    precision,
    mode,
    calendarName
  ) => {
    const pointer = begin(
      operationCodes.formatPlainDateTime,
      25 + calendar.length * 3
    )
    integer(pointer + 2, value)
    fastBytes[pointer + 18] =
      precision === 'auto' ? 255 : precision === 'minute' ? 254 : precision
    fastBytes[pointer + 19] = arrayIndex(modes, mode)
    fastBytes[pointer + 20] = arrayIndex(calendarNames, calendarName)
    const encoded = putText(
      encoder,
      calendar,
      new Bytes(fastBuffer!, pointer + 25, fastCapacity - 25)
    )
    write32(fastView, pointer + 21, encoded.written, true)
    const result = exchange(25 + encoded.written)
    if (fastBytes[result] !== 4)
      throw new BadType('Invalid Temporal WASM response')
    return getText(
      decoder,
      new Bytes(fastBuffer!, result + 5, read32(fastView, result + 1, true))
    )
  }
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
  invoke.addPlainDate = (epochDay, calendar, fields, subtract, overflow) => {
    const pointer = begin(operationCodes.addPlainDate, 96 + calendar.length * 3)
    writeNumber(fastView, pointer + 2, epochDay, true)
    for (let i = 0; i < durationPropertyNames.length; i++)
      writeNumber(
        fastView,
        pointer + 10 + i * 8,
        fields[durationPropertyNames[i] as keyof typeof fields],
        true
      )
    fastBytes[pointer + 90] = subtract ? 1 : 0
    fastBytes[pointer + 91] = overflow === 'reject' ? 1 : 0
    const encoded = putText(encoder, calendar, calendarBytes)
    write32(fastView, pointer + 92, encoded.written, true)
    const result = exchange(96 + encoded.written)
    return fastBytes[result] === 11
      ? decodeISODate(fastView, fastBytes, result + 1)
      : decodeResult(result - 8)
  }
  const units = [
    'hour',
    'minute',
    'second',
    'millisecond',
    'microsecond',
    'nanosecond',
  ]
  invoke.addPlainDateTime = (value, calendar, fields, subtract, overflow) => {
    const pointer = begin(
      operationCodes.addPlainDateTime,
      104 + calendar.length * 3
    )
    integer(pointer + 2, value)
    for (let i = 0; i < durationPropertyNames.length; i++)
      writeNumber(
        fastView,
        pointer + 18 + i * 8,
        fields[durationPropertyNames[i] as keyof typeof fields],
        true
      )
    fastBytes[pointer + 98] = subtract ? 1 : 0
    fastBytes[pointer + 99] = overflow === 'reject' ? 1 : 0
    const encoded = putText(
      encoder,
      calendar,
      new Bytes(fastBuffer!, pointer + 104, fastCapacity - 104)
    )
    write32(fastView, pointer + 100, encoded.written, true)
    return dateTimeResult(exchange(104 + encoded.written))
  }
  invoke.roundPlainDateTime = (value, calendar, unit, increment, mode) => {
    const pointer = begin(
      operationCodes.roundPlainDateTime,
      28 + calendar.length * 3
    )
    integer(pointer + 2, value)
    fastBytes[pointer + 18] = unit === 'day' ? 6 : arrayIndex(units, unit)
    write32(fastView, pointer + 19, increment, true)
    fastBytes[pointer + 23] = arrayIndex(modes, mode)
    const encoded = putText(
      encoder,
      calendar,
      new Bytes(fastBuffer!, pointer + 28, fastCapacity - 28)
    )
    write32(fastView, pointer + 24, encoded.written, true)
    return dateTimeResult(exchange(28 + encoded.written))
  }
  invoke.parseZonedFields = value => {
    validateText(value)
    const pointer = begin(operationCodes.parseZonedFields, 6 + value.length * 3)
    const encoded = putText(encoder, value, parseBytes)
    write32(fastView, pointer + 2, encoded.written, true)
    const result = exchange(6 + encoded.written)
    if (fastBytes[result] !== 18)
      throw new BadType('Invalid Temporal WASM response')
    const localNanoseconds =
      readUnsigned(fastView, result + 1, true) +
      (readSigned(fastView, result + 9, true) << 64n)
    const fields = {
      year: read32(fastView, result + 17, true) | 0,
      month: fastBytes[result + 21],
      day: fastBytes[result + 22],
      hour: fastBytes[result + 23],
      minute: fastBytes[result + 24],
      second: fastBytes[result + 25],
      millisecond: read16(fastView, result + 26, true),
      microsecond: read16(fastView, result + 28, true),
      nanosecond: read16(fastView, result + 30, true),
      calendar: '',
    }
    const hasOffset = fastBytes[result + 32] !== 0
    let cursor = result + 33
    const texts: string[] = []
    for (let i = 0; i < 4; i++) {
      const length = read32(fastView, cursor, true)
      cursor += 4
      texts[i] = getText(decoder, new Bytes(fastBuffer!, cursor, length))
      cursor += length
    }
    fields.calendar = texts[0]
    return {
      fields,
      timeZone: texts[1],
      offset: hasOffset ? texts[2] : undefined,
      localNanoseconds,
      validatedTimeZone: texts[3] || undefined,
    }
  }
  function zonedResult(result: number, calendar: string, timeZone: string) {
    if (fastBytes[result] !== 17) {
      const value = decodeResult(result - 8)
      value.calendar = calendar
      value.timeZone = timeZone
      return value
    }
    const ns =
      readUnsigned(fastView, result + 1, true) +
      (readSigned(fastView, result + 9, true) << 64n)
    const offsetNanoseconds = readNumber(fastView, result + 17, true)
    const hoursInDay = readNumber(fastView, result + 25, true)
    const length = read32(fastView, result + 33, true)
    const offset = getText(decoder, new Bytes(fastBuffer!, result + 37, length))
    const local = dateTimeResult(result + 37 + length)
    return {
      epochNanoseconds: ns,
      calendar,
      timeZone,
      properties: {
        date: local.properties!.date,
        values: {
          ...local.properties!.values,
          localNanoseconds: local.epochNanoseconds,
          offsetNanoseconds,
          offset,
          hoursInDay,
        },
        errors: [],
      },
    }
  }
  function appendZonedText(pointer: number, cursor: number, text: string) {
    const encoded = putText(
      encoder,
      text,
      new Bytes(fastBuffer!, cursor + 4, fastCapacity - (cursor - pointer) - 4)
    )
    write32(fastView, cursor, encoded.written, true)
    return cursor + 4 + encoded.written
  }
  invoke.addZonedDateTime = (slot, fields, subtract, overflow) => {
    const pointer = begin(
      operationCodes.addZonedDateTime,
      108 + (slot.timeZone.length + slot.calendar.length) * 3
    )
    integer(pointer + 2, slot.epochNanoseconds)
    for (let i = 0; i < durationPropertyNames.length; i++)
      writeNumber(
        fastView,
        pointer + 18 + i * 8,
        fields[durationPropertyNames[i] as keyof typeof fields],
        true
      )
    fastBytes[pointer + 98] = subtract ? 1 : 0
    fastBytes[pointer + 99] = overflow === 'reject' ? 1 : 0
    let cursor = appendZonedText(pointer, pointer + 100, slot.timeZone)
    cursor = appendZonedText(pointer, cursor, slot.calendar)
    return zonedResult(exchange(cursor - pointer), slot.calendar, slot.timeZone)
  }
  invoke.startOfZonedDay = (slot, day) => {
    const pointer = begin(
      operationCodes.startOfZonedDay,
      35 + (slot.timeZone.length + slot.calendar.length) * 3
    )
    integer(pointer + 2, slot.epochNanoseconds)
    fastBytes[pointer + 18] = day === undefined ? 0 : 1
    writeNumber(fastView, pointer + 19, day ?? 0, true)
    let cursor = appendZonedText(pointer, pointer + 27, slot.timeZone)
    cursor = appendZonedText(pointer, cursor, slot.calendar)
    return zonedResult(exchange(cursor - pointer), slot.calendar, slot.timeZone)
  }
  invoke.roundZonedDateTime = (slot, unit, increment, mode) => {
    const pointer = begin(
      operationCodes.roundZonedDateTime,
      32 + (slot.timeZone.length + slot.calendar.length) * 3
    )
    integer(pointer + 2, slot.epochNanoseconds)
    fastBytes[pointer + 18] = unit === 'day' ? 6 : arrayIndex(units, unit)
    write32(fastView, pointer + 19, increment, true)
    fastBytes[pointer + 23] = arrayIndex(modes, mode)
    let cursor = appendZonedText(pointer, pointer + 24, slot.timeZone)
    cursor = appendZonedText(pointer, cursor, slot.calendar)
    return zonedResult(exchange(cursor - pointer), slot.calendar, slot.timeZone)
  }
  invoke.resolveZonedDateTime = (
    value,
    identifier,
    calendar,
    offset,
    behavior,
    disambiguation,
    matchMinute,
    dateOnly
  ) => {
    const pointer = begin(
      operationCodes.resolveZonedDateTime,
      33 + (identifier.length + calendar.length + (offset?.length ?? 0)) * 3
    )
    integer(pointer + 2, value)
    fastBytes[pointer + 18] = arrayIndex(disambiguations, disambiguation)
    fastBytes[pointer + 19] = arrayIndex(offsetOptions, behavior)
    fastBytes[pointer + 20] =
      (dateOnly ? 1 : 0) |
      (matchMinute ? 2 : 0) |
      (offset === undefined ? 0 : 4)
    let cursor = pointer + 21
    const texts = [identifier, calendar, offset ?? '']
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]
      const encoded = putText(
        encoder,
        text,
        new Bytes(
          fastBuffer!,
          cursor + 4,
          fastCapacity - (cursor - pointer) - 4
        )
      )
      write32(fastView, cursor, encoded.written, true)
      cursor += 4 + encoded.written
    }
    return zonedResult(exchange(cursor - pointer), calendar, identifier)
  }
  invoke.timeZoneTransition = (identifier, value, direction) => {
    const pointer = begin(
      operationCodes.timeZoneTransition,
      23 + identifier.length * 3
    )
    integer(pointer + 2, value)
    fastBytes[pointer + 18] =
      direction === 'next' ? 0 : direction === 'previous' ? 1 : 255
    const encoded = putText(
      encoder,
      identifier,
      new Bytes(fastBuffer!, pointer + 23, fastCapacity - 23)
    )
    write32(fastView, pointer + 19, encoded.written, true)
    const result = exchange(23 + encoded.written)
    return fastBytes[result] === 0 ? null : readInteger(result)
  }
  const scalarRound = (() => {
    const round = core.temporal_round_instant
    if (!round) return undefined
    try {
      return round(0n, 5, 1, 3) === 0n ? round : undefined
    } catch {
      return undefined
    }
  })()
  invoke.roundInstantUnit = (value, unit, increment, mode) => {
    if (scalarRound && asSigned64(64, value) === value) {
      const result = scalarRound(
        value,
        arrayIndex(units, unit),
        increment,
        arrayIndex(modes, mode)
      )
      if (result !== -9223372036854775808n) return result
    }
    const pointer = begin(operationCodes.roundInstant, 24)
    integer(pointer + 2, value)
    fastBytes[pointer + 18] = arrayIndex(units, unit)
    write32(fastView, pointer + 19, increment, true)
    fastBytes[pointer + 23] = arrayIndex(modes, mode)
    return readInteger(exchange(24))
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
