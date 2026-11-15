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
