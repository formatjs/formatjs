import {bigIntFrom} from '#packages/ecma262-abstract/intrinsics.js'
const getTime = Function.prototype.call.bind(Date.prototype.getTime)
// Temporal comparison §14.9.1 step 5.
// Create the Date hook around its Instant factory.
export function createDateToTemporalInstant<T>(
  create: (ns: bigint) => T
): (this: unknown) => T {
  return {
    // Proposal comparison §14.9.1 steps 2–5: Read Date milliseconds and create an exact Instant.
    toTemporalInstant(this: unknown): T {
      return create(bigIntFrom(getTime(this)) * 1_000_000n)
    },
  }.toTemporalInstant
}
