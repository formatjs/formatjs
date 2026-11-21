import {bigIntFrom} from '#packages/ecma262-abstract/intrinsics.js'
const getTime = Function.prototype.call.bind(Date.prototype.getTime)
export function createDateToTemporalInstant<T>(
  create: (ns: bigint) => T
): (this: unknown) => T {
  return {
    toTemporalInstant(this: unknown): T {
      return create(bigIntFrom(getTime(this)) * 1_000_000n)
    },
  }.toTemporalInstant
}
