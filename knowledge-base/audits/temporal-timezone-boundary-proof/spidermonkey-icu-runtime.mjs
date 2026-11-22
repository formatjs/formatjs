// Adapter for the hash-pinned Debian SpiderMonkey's local ICU symbols.
// The replay checks the ELF and its matching debug file before exposing this map.
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  DynamicLibrary,
  getFloat64,
  getInt32,
  getRawPointer,
  getUint64,
  toString,
} from 'node:ffi'

const input = JSON.parse(
  readFileSync(new URL('./spidermonkey-input.json', import.meta.url))
)
const library = new DynamicLibrary(input.library)
const processLibrary = new DynamicLibrary(null)
const exported = '_Z13JS_NewContextjP9JSRuntime'
const address = library.getSymbol(exported)
const getAddressInfo = processLibrary.getFunction('dladdr', {
  return: 'i32',
  arguments: ['pointer', 'pointer'],
})
const addressInfo = Buffer.alloc(32)
assert.equal(getAddressInfo(address, addressInfo), 1)
assert.equal(toString(addressInfo.readBigUInt64LE()), input.library)
const base = addressInfo.readBigUInt64LE(8)
function symbol(name) {
  assert.ok(Object.hasOwn(input.symbols, name), name)
  return base + BigInt(input.symbols[name])
}
assert.equal(symbol(exported), address)

const pointer = 'pointer'
const int = 'i32'
const double = 'f64'
const ffi = new DynamicLibrary('libffi.so.8')
const ffiTypeNames = {
  pointer,
  f64: 'double',
  i8: 'sint8',
  i32: 'sint32',
  void: 'void',
}
const ffiTypes = Object.fromEntries(
  Object.entries(ffiTypeNames).map(([type, name]) => [
    type,
    ffi.getSymbol('ffi_type_' + name),
  ])
)
const prepare = ffi.getFunction('ffi_prep_cif', {
  return: int,
  arguments: [pointer, int, int, pointer, pointer],
})
const call = ffi.getFunction('ffi_call', {
  return: 'void',
  arguments: [pointer, pointer, pointer, pointer],
})

function bind(name, result, types) {
  const target = symbol(name)
  const context = {
    interface: Buffer.alloc(128),
    types: Buffer.alloc(types.length * 8),
    pointers: Buffer.alloc(types.length * 8),
    result: Buffer.alloc(8),
  }
  const values = types.map((type, index) => {
    const value = Buffer.alloc(8)
    context.types.writeBigUInt64LE(ffiTypes[type], index * 8)
    context.pointers.writeBigUInt64LE(getRawPointer(value), index * 8)
    return value
  })
  const x86_64SystemV = 2
  assert.equal(
    prepare(
      context.interface,
      x86_64SystemV,
      types.length,
      ffiTypes[result],
      context.types
    ),
    0
  )
  return (...parameters) => {
    for (const [index, type] of types.entries()) {
      const value = parameters[index]
      const buffer = values[index]
      switch (type) {
        case 'pointer':
          buffer.writeBigUInt64LE(
            typeof value === 'bigint' ? value : getRawPointer(value)
          )
          break
        case 'i32':
          buffer.writeInt32LE(value)
          break
        case 'i8':
          buffer.writeInt8(value)
          break
        case 'f64':
          buffer.writeDoubleLE(value)
          break
      }
    }
    call(context.interface, target, context.result, context.pointers)
    switch (result) {
      case 'pointer':
        return context.result.readBigUInt64LE()
      case 'i32':
        return context.result.readInt32LE()
      case 'i8':
        return context.result.readInt8()
      case 'f64':
        return context.result.readDoubleLE()
    }
  }
}

// The release inlines several C wrappers and trivial rule accessors. Use
// their C++ operations and the field offsets verified in this ELF.
const getMillis = bind(
  '_ZNK6icu_738Calendar15getTimeInMillisER10UErrorCode',
  double,
  [pointer, pointer]
)
const getTimeZone = bind('_ZNK6icu_738Calendar11getTimeZoneEv', pointer, [
  pointer,
])
const extract = bind(
  '_ZNK6icu_7313UnicodeString7extractENS_9Char16PtrEiR10UErrorCode',
  int,
  [pointer, pointer, int, pointer]
)
const getNext = bind(
  '_ZNK6icu_7313OlsonTimeZone17getNextTransitionEdaRNS_18TimeZoneTransitionE',
  'i8',
  [pointer, double, 'i8', pointer]
)
const getTime = bind('_ZNK6icu_7318TimeZoneTransition7getTimeEv', double, [
  pointer,
])
const makeTransition = bind('_ZN6icu_7318TimeZoneTransitionC1Ev', 'void', [
  pointer,
])
const destroyTransition = bind('_ZN6icu_7318TimeZoneTransitionD1Ev', 'void', [
  pointer,
])
const annualStart = bind(
  '_ZNK6icu_7318AnnualTimeZoneRule14getStartInYearEiiiRd.part.0',
  'i8',
  [pointer, int, int, int, pointer]
)
const countTimes = rule => getInt32(rule + 0x54n)

const wrappers = {
  ucal_getMillis_73: getMillis,
  ucal_getTimeZoneID_73(calendar, buffer, capacity, status) {
    // TimeZone's UnicodeString starts at +8. Char16Ptr is passed indirectly.
    const output = Buffer.alloc(8)
    output.writeBigUInt64LE(getRawPointer(buffer))
    return extract(getTimeZone(calendar) + 8n, output, capacity, status)
  },
  ucal_getTimeZoneTransitionDate_73(calendar, kind, output, status) {
    assert.ok(kind === 0 || kind === 1)
    const transition = Buffer.alloc(40)
    makeTransition(transition)
    try {
      const found = getNext(
        getTimeZone(calendar),
        getMillis(calendar, status),
        kind,
        transition
      )
      if (found) output.writeDoubleLE(getTime(transition))
      return found
    } finally {
      destroyTransition(transition)
    }
  },
  _ZNK6icu_7321TimeArrayTimeZoneRule11getTimeTypeEv: rule =>
    getInt32(rule + 0x50n),
  _ZNK6icu_7321TimeArrayTimeZoneRule15countStartTimesEv: countTimes,
  _ZNK6icu_7321TimeArrayTimeZoneRule14getStartTimeAtEiRd(rule, index, output) {
    assert.ok(index >= 0 && index < countTimes(rule))
    const times = getUint64(rule + 0x58n)
    output.writeDoubleLE(getFloat64(times + 8n * BigInt(index)))
    return 1
  },
  _ZNK6icu_7318AnnualTimeZoneRule14getStartInYearEiiiRd(
    rule,
    year,
    raw,
    dst,
    output
  ) {
    // Restore the year check split out of the compiler's partial clone.
    if (year < getInt32(rule + 0x58n) || year > getInt32(rule + 0x5cn)) return 0
    return annualStart(rule, year, raw, dst, output)
  },
}

export async function loadPinnedIcu() {
  return {
    binarySha256: input.shellHash,
    icuMajor: '73',
    toString,
    lib: {
      getSymbol: symbol,
      getFunction(name, signature) {
        if (name === '__dynamic_cast')
          return processLibrary.getFunction(name, signature)
        const target =
          name === 'ucal_get_73'
            ? '_ZNK6icu_738Calendar3getE19UCalendarDateFieldsR10UErrorCode'
            : name
        return (
          wrappers[name] ?? bind(target, signature.return, signature.arguments)
        )
      },
      close() {
        library.close()
      },
    },
  }
}
