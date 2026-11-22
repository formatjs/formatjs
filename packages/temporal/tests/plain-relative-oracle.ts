import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkPlainRelativeEndpointBounds(
  Temporal: typeof TemporalNamespace,
  equal: (
    actual: string | number,
    expected: string | number,
    context: string
  ) => void
): void {
  const relativeTo = '-271821-04-20',
    value = Temporal.Duration.from('-P1D'),
    rejected: number[] = []
  for (const operation of [
    () => value.total({unit: 'hour', relativeTo}),
    () => value.round({smallestUnit: 'hour', relativeTo}),
  ]) {
    let error: unknown
    try {
      operation()
    } catch (caught) {
      error = caught
    }
    rejected.push(error instanceof RangeError ? 1 : 0)
  }
  equal(rejected.join(','), '1,1', 'Excluded lower destination: total,round')
  const adjacent = Temporal.Duration.from('-PT23H59M59.999999999S')
  equal(
    adjacent.total({unit: 'hour', relativeTo}),
    -86399999999999 / 3600000000000,
    'One nanosecond inside lower destination'
  )
  equal(
    adjacent.round({smallestUnit: 'nanosecond', relativeTo}).toString(),
    '-PT23H59M59.999999999S',
    'Exact adjacent destination'
  )
  const zero = Temporal.Duration.from('PT0S')
  equal(
    zero.total({unit: 'hour', relativeTo: '-271821-04-19'}),
    0,
    'Plain zero total shortcut'
  )
  equal(
    zero.round({smallestUnit: 'hour', relativeTo: '-271821-04-19'}).toString(),
    'PT0S',
    'Plain zero rounding shortcut'
  )
}

export function checkPlainRelativeOracle(
  Temporal: typeof TemporalNamespace,
  fixture: string,
  equal: (
    actual: string | number,
    expected: string | number,
    context: string
  ) => void
): {rounds: number; totals: number; dates: number; comparisons: number} {
  checkPlainRelativeEndpointBounds(Temporal, equal)
  const plainDate = Temporal.PlainDate.from('2020-01-01')
  const otherDate = Temporal.PlainDate.from('2020-01-03')
  const plainDateTime = Temporal.PlainDateTime.from('2020-01-01T00:00')
  const otherDateTime = Temporal.PlainDateTime.from('2020-01-03T00:00')
  const yearMonth = Temporal.PlainYearMonth.from('2020-01')
  const otherYearMonth = Temporal.PlainYearMonth.from('2021-01')
  const cases = [
    [() => plainDate.since(otherDate), '-P2D'],
    [() => plainDateTime.since(otherDateTime), '-P2D'],
    [() => yearMonth.since(otherYearMonth, {smallestUnit: 'year'}), '-P1Y'],
  ] as const
  for (const [run, expected] of cases) {
    const originalKeys = Object.keys
    let hooks = 0
    let result: InstanceType<typeof Temporal.Duration> | undefined
    let error: unknown
    try {
      Object.keys = () => {
        hooks++
        throw new Error('Observable private difference keys')
      }
      try {
        result = run()
      } catch (caught) {
        error = caught
      }
    } finally {
      Object.keys = originalKeys
    }
    equal(hooks, 0, `Plain since avoids private enumeration ${expected}`)
    if (error) throw error
    equal(result!.toString(), expected, 'Plain since retains signed result')
    equal(
      Number(Object.is(result!.nanoseconds, -0)),
      0,
      'Since zero stays positive'
    )
  }
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
