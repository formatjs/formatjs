const getTime = Function.prototype.call.bind(Date.prototype.getTime)
export function createDateToTemporalInstant<T>(
  create: (ns: bigint) => T
): (this: unknown) => T {
  return {
    toTemporalInstant(this: unknown): T {
      // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/mainadditions.html#L788-L795
      // 1–3: the captured getTime checks this for [[DateValue]] and reads it;
      // neither a user-defined getTime nor a numeric valueOf is consulted.
      // 4: convert the milliseconds to bigint (NaN throws), then scale exactly.
      // 5: allocate the Instant only after the conversion succeeds.
      return create(BigInt(getTime(this)) * 1_000_000n)
    },
  }.toTemporalInstant
}
