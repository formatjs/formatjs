import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkTimezoneOracle(
  Temporal: typeof TemporalNamespace,
  identities: string,
  offsets: string,
  transitions: string,
  equal: (actual: unknown, expected: unknown, context: string) => void
): {
  identities: number
  pairs: number
  offsets: number
  gapsAndFolds: number
  transitions: number
} {
  const lines = (value: string) =>
    value
      .trim()
      .split('\n')
      .filter(line => !line.startsWith('#'))
  const supported = new Set<string>()
  const values: {
    primary: string
    value: InstanceType<typeof Temporal.ZonedDateTime>
  }[] = []
  for (const line of lines(identities)) {
    const [id, primary] = line.split('\t')
    let value: InstanceType<typeof Temporal.ZonedDateTime>
    try {
      value = new Temporal.ZonedDateTime(0n, id.toLowerCase())
    } catch (error) {
      if (!(error instanceof RangeError)) throw error
      continue
    }
    equal(value.timeZoneId, id, line)
    equal(value.equals(new Temporal.ZonedDateTime(0n, primary)), true, line)
    supported.add(id)
    values.push({primary, value})
  }
  const counts = {
    identities: supported.size,
    pairs: 0,
    offsets: 0,
    gapsAndFolds: 0,
    transitions: 0,
  }
  equal(counts.identities, 597, 'Supported ICU identities')
  for (let i = 0; i < values.length; i++)
    for (let j = 0; j <= i; j++) {
      equal(
        values[i].value.equals(values[j].value),
        values[i].primary === values[j].primary,
        values[i].value.timeZoneId + '/' + values[j].value.timeZoneId
      )
      counts.pairs++
    }
  let previous: {id: string; instant: bigint; offset: bigint} | undefined
  for (const line of lines(offsets)) {
    const [id, milliseconds, seconds] = line.split('\t')
    if (!supported.has(id)) continue
    const instant = BigInt(milliseconds) * 1_000_000n
    const offset = BigInt(seconds) * 1_000_000_000n
    const value = new Temporal.ZonedDateTime(instant, id)
    equal(value.offsetNanoseconds, Number(offset), line)
    if (
      previous?.id === id &&
      instant === previous.instant + 1_000_000n &&
      offset !== previous.offset
    ) {
      const local = Temporal.Instant.fromEpochNanoseconds(
        instant + (offset + previous.offset) / 2n + 123n
      )
        .toZonedDateTimeISO('UTC')
        .toPlainDateTime()
      const candidates = [
        instant + (offset + previous.offset) / 2n + 123n - offset,
        instant + (offset + previous.offset) / 2n + 123n - previous.offset,
      ].sort((a, b) => (a < b ? -1 : 1))
      equal(
        local.toZonedDateTime(id, {disambiguation: 'earlier'}).epochNanoseconds,
        candidates[0],
        line
      )
      equal(
        local.toZonedDateTime(id, {disambiguation: 'later'}).epochNanoseconds,
        candidates[1],
        line
      )
      equal(
        local.toZonedDateTime(id).epochNanoseconds,
        candidates[offset > previous.offset ? 1 : 0],
        line
      )
      let rejected = false
      try {
        local.toZonedDateTime(id, {disambiguation: 'reject'})
      } catch (error) {
        rejected = error instanceof RangeError
      }
      equal(rejected, true, line)
      const before = new Temporal.ZonedDateTime(
        instant - 43_200_000_000_000n,
        id
      )
      equal(
        before.add({days: 1}).epochNanoseconds,
        before.epochNanoseconds +
          86_400_000_000_000n +
          previous.offset -
          offset,
        line
      )
      equal(
        before.add({hours: 24}).epochNanoseconds,
        before.epochNanoseconds + 86_400_000_000_000n,
        line
      )
      equal(
        Temporal.Duration.compare({days: 1}, {hours: 24}, {relativeTo: before}),
        previous.offset > offset ? 1 : -1,
        line
      )
      counts.gapsAndFolds++
    }
    previous = {id, instant, offset}
    counts.offsets++
  }
  for (const line of lines(transitions)) {
    const [id, milliseconds, next, previous] = line.split('\t')
    if (!supported.has(id)) continue
    const value = new Temporal.ZonedDateTime(
      BigInt(milliseconds) * 1_000_000n,
      id
    )
    for (const [direction, text] of [
      ['next', next],
      ['previous', previous],
    ] as const) {
      const expected = text === 'null' ? null : BigInt(text) * 1_000_000n
      const result = value.getTimeZoneTransition(direction)
      equal(result?.epochNanoseconds ?? null, expected, line + direction)
      if (result) {
        equal(result.timeZoneId, id, line)
        equal(
          new Temporal.ZonedDateTime(
            result.epochNanoseconds + (direction === 'next' ? -1n : 1n),
            id
          ).getTimeZoneTransition(direction)?.epochNanoseconds,
          expected,
          line
        )
        const other = result.getTimeZoneTransition(direction)
        equal(
          other === null ||
            (direction === 'next'
              ? other.epochNanoseconds > result.epochNanoseconds
              : other.epochNanoseconds < result.epochNanoseconds),
          true,
          line
        )
      }
    }
    counts.transitions++
  }
  equal(counts.transitions, 14058, 'Strict transition rows')
  equal(counts.pairs, 178503, 'Identity pairs')
  equal(counts.offsets, 17640, 'Future offsets')
  equal(counts.gapsAndFolds, 1900, 'Gap/fold windows')
  return counts
}
