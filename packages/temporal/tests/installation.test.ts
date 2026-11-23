import {afterEach, expect, it, vi} from 'vitest'
import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Temporal, toTemporalInstant} from '#packages/temporal/index.js'
import {installTemporal} from '#packages/temporal/install.js'
import {shouldPolyfill} from '#packages/temporal/should-polyfill.js'

function copyReference() {
  return Object.defineProperties(
    {},
    Object.getOwnPropertyDescriptors(reference)
  ) as typeof reference
}

const original = Object.getOwnPropertyDescriptor(
  Date.prototype,
  'toTemporalInstant'
)
afterEach(() => {
  vi.unstubAllGlobals()
  if (original)
    Object.defineProperty(Date.prototype, 'toTemporalInstant', original)
  else Reflect.deleteProperty(Date.prototype, 'toTemporalInstant')
})

it('installs both globals when absent, preserving identity on repeat installation', () => {
  vi.stubGlobal('Temporal', undefined)
  Reflect.deleteProperty(Date.prototype, 'toTemporalInstant')
  expect(shouldPolyfill()).toBe(true)
  installTemporal()
  const method = Date.prototype.toTemporalInstant
  expect(globalThis.Temporal).toBe(Temporal)
  expect(new Date(-1).toTemporalInstant().epochNanoseconds).toBe(-1_000_000n)
  expect(shouldPolyfill()).toBe(false)
  installTemporal()
  expect(globalThis.Temporal).toBe(Temporal)
  expect(Date.prototype.toTemporalInstant).toBe(method)
})

it('preserves an existing namespace and repairs its Date bridge with matching brands', () => {
  const namespace = copyReference()
  vi.stubGlobal('Temporal', namespace)
  Reflect.deleteProperty(Date.prototype, 'toTemporalInstant')
  expect(shouldPolyfill()).toBe(true)
  installTemporal()
  const value = new Date(123).toTemporalInstant()
  expect(globalThis.Temporal).toBe(namespace)
  expect(value).toBeInstanceOf(reference.Instant)
  expect(value).not.toBeInstanceOf(Temporal.Instant)
  expect(value.epochNanoseconds).toBe(123_000_000n)
  const method = Date.prototype.toTemporalInstant
  namespace.Instant = new Proxy(reference.Instant, {
    construct() {
      throw new Error('mutable namespace constructor called')
    },
  })
  expect(new Date(0).toTemporalInstant().epochNanoseconds).toBe(0n)
  installTemporal()
  expect(Date.prototype.toTemporalInstant).toBe(method)
})

it('keeps an existing Date bridge unless forcing the owned namespace', () => {
  vi.stubGlobal('Temporal', reference)
  const existing = function () {
    return new reference.Instant(1n)
  }
  Object.defineProperty(Date.prototype, 'toTemporalInstant', {
    value: existing,
    configurable: true,
    writable: true,
    enumerable: true,
  })
  installTemporal()
  expect(Date.prototype.toTemporalInstant).toBe(existing)
  installTemporal(true)
  expect(globalThis.Temporal).toBe(Temporal)
  expect(
    Object.getOwnPropertyDescriptor(globalThis, 'Temporal')?.enumerable
  ).toBe(false)
  expect(
    Object.getOwnPropertyDescriptor(Date.prototype, 'toTemporalInstant')
      ?.enumerable
  ).toBe(false)
  expect(Date.prototype.toTemporalInstant).toBe(toTemporalInstant)
  expect(new Date(0).toTemporalInstant()).toBeInstanceOf(Temporal.Instant)
})

it('replaces incomplete namespaces and binds Date results to the installed constructors', () => {
  for (const value of [
    null,
    1,
    {},
    Object.assign(copyReference(), {PlainTime: undefined}),
    Object.assign(copyReference(), {Now: {instant: reference.Now.instant}}),
  ]) {
    vi.stubGlobal('Temporal', value)
    expect(shouldPolyfill()).toBe(true)
    installTemporal()
    expect(new Date(1).toTemporalInstant()).toBeInstanceOf(Temporal.Instant)
  }
})

it('reads Date slots without coercion, public methods or constructor calls', () => {
  const value = new Date(-1)
  value.getTime = () => {
    throw new Error('public getTime called')
  }
  Object.defineProperty(value, Symbol.toPrimitive, {
    value: () => {
      throw new Error('coercion called')
    },
  })
  expect(toTemporalInstant.call(value).epochNanoseconds).toBe(-1_000_000n)
  for (const invalid of [
    null,
    undefined,
    0,
    '1970-01-01',
    {},
    new Proxy(value, {}),
  ])
    expect(() => toTemporalInstant.call(invalid)).toThrow(TypeError)
  expect(() => toTemporalInstant.call(new Date(NaN))).toThrow(RangeError)
})

it('matches independent ICU Gregorian fixtures through the Date bridge', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-iso-fixtures.tsv`
  )
  let count = 0,
    rejected = 0
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const fields = line.split('\t'),
      milliseconds = Number(fields[0])
    if (Math.abs(milliseconds) > 8_640_000_000_000_000) {
      expect(
        () => toTemporalInstant.call(new Date(milliseconds)),
        line
      ).toThrow(RangeError)
      rejected++
      continue
    }
    const value = toTemporalInstant.call(new Date(milliseconds))
    expect(value.epochNanoseconds, line).toBe(
      BigInt(Math.trunc(milliseconds)) * 1_000_000n
    )
    const actual = value.toZonedDateTimeISO('UTC')
    expect(
      [
        actual.year,
        actual.month,
        actual.day,
        actual.hour,
        actual.minute,
        actual.second,
        actual.millisecond,
      ],
      line
    ).toEqual(fields.slice(1).map(Number))
    count++
  }
  expect(count).toBe(25265)
  expect(rejected).toBe(4)
  console.log(`${count} ICU Date bridge Gregorian samples`)
})

it('executes conditional and force package entrypoints', async () => {
  vi.stubGlobal('Temporal', undefined)
  Reflect.deleteProperty(Date.prototype, 'toTemporalInstant')
  await import('#packages/temporal/polyfill.js')
  expect(globalThis.Temporal).toBe(Temporal)
  expect(new Date(0).toTemporalInstant()).toBeInstanceOf(Temporal.Instant)
  vi.stubGlobal('Temporal', reference)
  await import('#packages/temporal/polyfill-force.js')
  expect(globalThis.Temporal).toBe(Temporal)
  expect(Date.prototype.toTemporalInstant).toBe(toTemporalInstant)
})
