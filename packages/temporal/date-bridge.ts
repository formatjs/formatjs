import {bigIntFrom} from '#packages/ecma262-abstract/intrinsics.js'
const getTime = Function.prototype.call.bind(Date.prototype.getTime)
export function createDateToTemporalInstant<T>(
  create: (ns: bigint) => T
): (this: unknown) => T {
  return {
    // ECMA-262 preview §22.1.4.42 steps 1–6: getTime checks the Date slot.
    // BigInt rejects NaN and preserves integral milliseconds before scaling.
    // https://tc39.es/ecma262/pr/3966/#sec-date.prototype.totemporalinstant
    toTemporalInstant(this: unknown): T {
      return create(bigIntFrom(getTime(this)) * 1_000_000n)
    },
  }.toTemporalInstant
}
