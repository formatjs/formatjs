import {isoToEpochNanoseconds} from '#packages/temporal/kernel.js'

// RFC 3339-style subset; extended years and nanosecond offsets, no annotations.
export function parseInstantString(value: string): bigint {
  const match =
    /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2}):(\d{2})(?:[.,](\d{1,9}))?([Zz]|([+-])(\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)$/.exec(
      value
    )
  if (!match || match[1] === '-000000')
    throw new RangeError('Unsupported instant string')
  const fraction = (match[7] ?? '').padEnd(9, '0')
  const seconds = +match[6]
  const local = isoToEpochNanoseconds({
    year: +match[1],
    month: +match[2],
    day: +match[3],
    hour: +match[4],
    minute: +match[5],
    second: seconds === 60 ? 59 : seconds,
    millisecond: +fraction.slice(0, 3),
    microsecond: +fraction.slice(3, 6),
    nanosecond: +fraction.slice(6, 9),
  })
  let offset = 0n
  if (match[9]) {
    const hour = +match[10],
      minute = +match[11],
      second = +(match[12] ?? 0)
    if (hour > 23 || minute > 59 || second > 59)
      throw new RangeError('Invalid UTC offset')
    offset =
      BigInt(hour * 3600 + minute * 60 + second) * 1_000_000_000n +
      BigInt((match[13] ?? '').padEnd(9, '0'))
    if (match[9] === '-') offset = -offset
  }
  return local - offset
}
