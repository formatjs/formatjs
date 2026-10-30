import {supportedValuesOf} from '#packages/intl-supportedvaluesof/index.js'

declare function print(value: string): void

const candidate = Intl.supportedValuesOf as (key?: unknown) => string[]
const reference = supportedValuesOf as (key?: unknown) => string[]
const savedAddUnitData = (Intl.NumberFormat as any).__addUnitData
const keys = [
  'calendar',
  'collation',
  'currency',
  'numberingSystem',
  'timeZone',
  'unit',
] as const
let assertions = 0

function check(condition: boolean, message: string) {
  assertions++
  if (!condition) throw new Error(message)
}

function equal(actual: unknown, expected: unknown, message: string) {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${message}: ${JSON.stringify(actual)}`
  )
}

function outcome(method: typeof candidate, key?: unknown) {
  try {
    return {values: method(key)}
  } catch (error) {
    return {error: (error as Error).name}
  }
}

for (const key of keys) {
  const expected = reference(key)
  const actual = candidate(key)
  check(expected.length > 0, `Empty reference backend for ${key}`)
  check(Array.isArray(actual), `Non-array ${key}`)
  equal(actual, expected, `Differential ${key}`)
  equal(actual, [...actual].sort(), `Sorted ${key}`)
  equal(actual, [...new Set(actual)], `Unique ${key}`)
  actual.length = 0
  equal(candidate(key), expected, `Fresh result ${key}`)
}

for (const key of [
  '',
  'invalid',
  'Calendar',
  'calendars',
  'numberingsystem',
  'timezone',
  'unit\0',
  undefined,
  null,
  true,
  42,
  NaN,
  Infinity,
  1n,
  Symbol('unit'),
]) {
  equal(
    outcome(candidate, key),
    outcome(reference, key),
    'Invalid/primitive key'
  )
}
for (const key of [new String('unit'), ['unit']]) {
  equal(candidate(key), reference(key), 'Object key')
}

function observableKey(
  method: typeof candidate,
  kind: 'primitive' | 'fallback'
) {
  const log: string[] = []
  const key =
    kind === 'primitive'
      ? {
          [Symbol.toPrimitive](hint: string) {
            log.push(hint)
            return 'unit'
          },
        }
      : {
          toString() {
            log.push('toString')
            return {}
          },
          valueOf() {
            log.push('valueOf')
            return 'unit'
          },
        }
  return {result: outcome(method, key), log}
}
for (const kind of ['primitive', 'fallback'] as const) {
  equal(
    observableKey(candidate, kind),
    observableKey(reference, kind),
    'Coercion order'
  )
}
equal(
  observableKey(candidate, 'primitive').log,
  ['string'],
  'Single string hint'
)
equal(
  observableKey(candidate, 'fallback').log,
  ['toString', 'valueOf'],
  'Ordinary string coercion'
)

for (const method of [candidate, reference]) {
  const sentinel = new Error('key coercion')
  for (const key of [
    {
      [Symbol.toPrimitive]() {
        throw sentinel
      },
    },
    {
      get [Symbol.toPrimitive]() {
        throw sentinel
      },
    },
    {
      toString() {
        throw sentinel
      },
    },
  ]) {
    let caught: unknown
    try {
      method(key)
    } catch (error) {
      caught = error
    }
    check(caught === sentinel, 'Preserve coercion exception identity')
  }
  equal(
    outcome(method, {
      [Symbol.toPrimitive]() {
        return {}
      },
    }),
    {error: 'TypeError'},
    'Nonprimitive coercion result'
  )
}

for (const receiver of [undefined, null, 123, Symbol(), {}]) {
  equal(candidate.call(receiver, 'unit'), reference('unit'), 'Ignored receiver')
}

// Support belongs to the current runtime, not a cached build-host snapshot.
const numberFormatDescriptor = Object.getOwnPropertyDescriptor(
  Intl,
  'NumberFormat'
)!
const unitsBefore = candidate('unit')
try {
  Object.defineProperty(Intl, 'NumberFormat', {value: undefined})
  equal(candidate('unit'), [], 'Missing formatter')
} finally {
  Object.defineProperty(Intl, 'NumberFormat', numberFormatDescriptor)
}
equal(candidate('unit'), unitsBefore, 'Restored formatter support')

const resolvedDescriptor = Object.getOwnPropertyDescriptor(
  Intl.NumberFormat.prototype,
  'resolvedOptions'
)!
try {
  Object.defineProperty(Intl.NumberFormat.prototype, 'resolvedOptions', {
    ...resolvedDescriptor,
    value() {
      return {...resolvedDescriptor.value.call(this), unit: 'unsupported'}
    },
  })
  equal(candidate('unit'), [], 'Changed formatter behavior')
} finally {
  Object.defineProperty(
    Intl.NumberFormat.prototype,
    'resolvedOptions',
    resolvedDescriptor
  )
}
equal(candidate('unit'), unitsBefore, 'Restored formatter behavior')

let probes = 0
try {
  Object.defineProperty(Intl.NumberFormat.prototype, 'resolvedOptions', {
    ...resolvedDescriptor,
    value() {
      probes++
      return resolvedDescriptor.value.call(this)
    },
  })
  candidate('unit')
  const first = probes
  candidate('unit')
  check(probes === first, 'Cached formatter observations')
  savedAddUnitData('en', {simple: {}, compound: {}})
  candidate('unit')
  check(probes > first, 'Saved locale loader invalidates cache')
} finally {
  Object.defineProperty(
    Intl.NumberFormat.prototype,
    'resolvedOptions',
    resolvedDescriptor
  )
}

const descriptor = Object.getOwnPropertyDescriptor(Intl, 'supportedValuesOf')!
check(descriptor.value === candidate, 'Installed method')
check(descriptor.writable === true, 'Writable')
check(descriptor.enumerable === false, 'Non-enumerable')
check(descriptor.configurable === true, 'Configurable')
check(candidate.name === 'supportedValuesOf', 'Name')
check(candidate.length === 1, 'Length')
check(
  !Object.prototype.hasOwnProperty.call(candidate, 'prototype'),
  'No prototype'
)
let constructed = false
try {
  Reflect.construct(candidate, ['unit'])
} catch (error) {
  constructed = error instanceof TypeError
}
check(constructed, 'Not constructible')

print(
  JSON.stringify({
    type: 'supportedValuesOf-conformance',
    keys: keys.length,
    assertions,
    candidate: 'Rust JSI installed API',
    backend: 'TypeScript formatters',
  })
)
