import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'
import {checkPlainRelativeOracle} from '#packages/temporal/tests/plain-relative-oracle.js'

export function checkDurationOracle(
  Temporal: typeof TemporalNamespace,
  scalar: readonly (readonly string[])[],
  plain: string,
  zoned: string,
  equal: (actual: unknown, expected: unknown, context: string) => void
): {
  scalar: number
  plainRounds: number
  plainTotals: number
  plainComparisons: number
  zonedRounds: number
  zonedTotals: number
} {
  const fieldReads: string[] = []
  const inherited = Temporal.Duration.from(
    Object.create({
      get days() {
        fieldReads.push('get days')
        return {
          [Symbol.toPrimitive](hint: string) {
            fieldReads.push('convert days:' + hint)
            return -0
          },
        }
      },
      get hours() {
        fieldReads.push('get hours')
        return 1
      },
    })
  )
  equal(
    fieldReads.join(','),
    'get days,convert days:number,get hours',
    'Duration.from inherited fields convert before the next getter'
  )
  equal(inherited.days, 0, 'Duration.from normalizes inherited negative zero')
  equal(inherited.hours, 1, 'Duration.from retains inherited hours')

  const abrupt = {}
  let laterRead = false
  let caught: unknown
  try {
    Temporal.Duration.from(
      Object.create({
        get days() {
          return {
            [Symbol.toPrimitive]() {
              throw abrupt
            },
          }
        },
        get hours() {
          laterRead = true
          return 0
        },
      })
    )
  } catch (error) {
    caught = error
  }
  equal(caught, abrupt, 'Duration.from preserves the coercion exception')
  equal(
    laterRead,
    false,
    'Duration.from stops before the next inherited getter'
  )

  const limit = 9_007_199_254_740_992_000_000_000n
  const nanoseconds = (value: InstanceType<typeof Temporal.Duration>): bigint =>
    BigInt(value.days) * 86_400_000_000_000n +
    BigInt(value.hours) * 3_600_000_000_000n +
    BigInt(value.minutes) * 60_000_000_000n +
    BigInt(value.seconds) * 1_000_000_000n +
    BigInt(value.milliseconds) * 1_000_000n +
    BigInt(value.microseconds) * 1000n +
    BigInt(value.nanoseconds)
  let scalarCount = 0
  for (const [kind, amount, unit, mode, expected] of scalar) {
    const ns = BigInt(amount)
    const duration = Temporal.Duration.from({
      seconds: Number(ns / 1_000_000_000n),
      nanoseconds: Number(ns % 1_000_000_000n),
    })
    if (kind === 'total') equal(duration.total(unit), +expected, amount + unit)
    else {
      const target = BigInt(expected)
      const action = () =>
        duration.round({
          largestUnit: unit === 'day' ? 'day' : 'hour',
          smallestUnit: unit,
          roundingMode: mode,
        })
      if (target <= -limit || target >= limit) {
        let rejected = false
        try {
          action()
        } catch (error) {
          rejected = error instanceof RangeError
        }
        equal(rejected, true, amount + unit + mode)
      } else {
        equal(nanoseconds(action()), target, amount + unit + mode)
        if (
          ['second', 'millisecond', 'microsecond', 'nanosecond'].includes(unit)
        ) {
          equal(
            nanoseconds(
              Temporal.Duration.from(
                duration.toString({smallestUnit: unit, roundingMode: mode})
              )
            ),
            target,
            amount + unit + mode + ' format/parse'
          )
        }
      }
    }
    scalarCount++
  }
  equal(scalarCount, 7130, 'Scalar ICU controls')
  const plainCounts = checkPlainRelativeOracle(
    Temporal,
    plain,
    (actual, expected, context) => equal(actual, expected, context)
  )
  equal(plainCounts.rounds, 51840, 'Plain rounds')
  equal(plainCounts.totals, 17280, 'Plain totals')
  equal(plainCounts.comparisons, 4224, 'Plain comparisons')
  let zonedRounds = 0,
    zonedTotals = 0
  for (const line of zoned.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [zone, start, end, unit, increment, mode, expected, , total] =
      line.split('\t')
    const a = new Temporal.ZonedDateTime(BigInt(start), zone)
    const b = new Temporal.ZonedDateTime(BigInt(end), zone)
    const duration = a.until(b, {largestUnit: unit})
    equal(
      duration
        .round({
          relativeTo: a,
          largestUnit: unit,
          smallestUnit: unit,
          roundingIncrement: +increment,
          roundingMode: mode,
        })
        .toString(),
      Temporal.Duration.from({[unit + 's']: +expected}).toString(),
      line
    )
    if (total !== 'null') {
      equal(duration.total({relativeTo: a, unit}), +total, line)
      zonedTotals++
    }
    zonedRounds++
  }
  equal(zonedRounds, 19440, 'Zoned rounds')
  equal(zonedTotals, 6480, 'Zoned totals')
  return {
    scalar: scalarCount,
    plainRounds: plainCounts.rounds,
    plainTotals: plainCounts.totals,
    plainComparisons: plainCounts.comparisons,
    zonedRounds,
    zonedTotals,
  }
}
