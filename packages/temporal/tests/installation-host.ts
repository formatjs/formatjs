import '#packages/temporal/polyfill.js'

function check(value: boolean): void {
  if (!value) throw new Error('Temporal installation assertion failed')
}
const value = new Date(-1).toTemporalInstant()
check(value instanceof Temporal.Instant)
check(value.epochNanoseconds === -1_000_000n)
check(
  Object.getOwnPropertyDescriptor(globalThis, 'Temporal')?.enumerable === false
)
check(
  Object.getOwnPropertyDescriptor(Date.prototype, 'toTemporalInstant')
    ?.enumerable === false
)
check(
  Temporal.Now.zonedDateTimeISO('America/New_York').timeZoneId ===
    'America/New_York'
)
let rejected = false
try {
  new Date(NaN).toTemporalInstant()
} catch (error) {
  rejected = error instanceof RangeError
}
check(rejected)

// ECMA-262 §7.3.24 step 2 follows a bound target after the prototype Get.
for (const [revoke, prototype] of [
  [false, null],
  [true, null],
  [true, {}],
] as const) {
  const pair = Proxy.revocable(function Target() {
    throw new Error('newTarget body must not run')
  }, {})
  const bound = pair.proxy.bind(null)
  let prototypeGets = 0
  Object.defineProperty(bound, 'prototype', {
    get() {
      check(this === bound)
      prototypeGets++
      if (revoke) pair.revoke()
      return prototype
    },
  })
  let result: object | undefined
  let typeError = false
  try {
    result = Reflect.construct(Temporal.Instant, [0n], bound)
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    typeError = true
  }
  check(prototypeGets === 1)
  if (revoke && prototype === null) check(typeError)
  else {
    check(result !== undefined)
    check(
      Object.getPrototypeOf(result!) ===
        (prototype ?? Temporal.Instant.prototype)
    )
  }
}
