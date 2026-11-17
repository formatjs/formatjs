import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkPlainRelativeOracle(
  Temporal: typeof TemporalNamespace,
  fixture: string,
  equal: (
    actual: string | number,
    expected: string | number,
    context: string
  ) => void
): {rounds: number; totals: number; dates: number; comparisons: number} {
  const dateTime = (epoch: string) =>
    Temporal.Instant.fromEpochNanoseconds(BigInt(epoch))
      .toZonedDateTimeISO('UTC')
      .toPlainDateTime()
  let rounds = 0,
    totals = 0,
    dates = 0,
    comparisons = 0
  for (const line of fixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [
      kind,
      origin,
      dest,
      unit,
      increment,
      roundingMode,
      until,
      since,
      total,
    ] = line.trim().split('\t')
    const start = dateTime(origin),
      date = start.toPlainDate()
    if (kind === 'C') {
      equal(
        Temporal.Duration.compare(dest, unit, {relativeTo: date}),
        +increment,
        line
      )
      comparisons++
      continue
    }
    const end = dateTime(dest)
    const options = {
      largestUnit: unit,
      smallestUnit: unit,
      roundingIncrement: +increment,
      roundingMode,
    }
    const expected = Temporal.Duration.from({[unit + 's']: +until}).toString()
    const expectedSince = Temporal.Duration.from({
      [unit + 's']: +since,
    }).toString()
    if (kind === 'D') {
      equal(date.until(end.toPlainDate(), options).toString(), expected, line)
      equal(
        date.since(end.toPlainDate(), options).toString(),
        expectedSince,
        line
      )
      dates++
      continue
    }
    equal(start.until(end, options).toString(), expected, line)
    equal(start.since(end, options).toString(), expectedSince, line)
    const delta = BigInt(dest) - BigInt(origin)
    const duration = Temporal.Duration.from({
      hours: Number(delta / 3_600_000_000_000n),
      nanoseconds: Number(delta % 3_600_000_000_000n),
    })
    equal(
      duration.round({...options, relativeTo: date}).toString(),
      expected,
      line
    )
    rounds++
    if (total !== 'null') {
      equal(duration.total({relativeTo: date, unit}), +total, line)
      totals++
    }
  }
  return {rounds, totals, dates, comparisons}
}
