import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'

// Chronological fixtures are independent of the implementation's scalar encoding.
function checkOrder<T>(values: T[], compare: (one: T, two: T) => number): void {
  for (let first = 0; first < values.length; first++) {
    for (let second = 0; second < values.length; second++) {
      expect(
        compare(values[first], values[second]),
        `${first}, ${second}`
      ).toBe(first < second ? -1 : first > second ? 1 : 0)
    }
  }
}

const clocks = [
  '00:00:00',
  '00:00:00.000000001',
  '00:00:00.000000999',
  '00:00:00.000001000',
  '00:00:00.000999999',
  '00:00:00.001000000',
  '00:00:00.999999999',
  '00:00:01',
  '00:00:59.999999999',
  '00:01:00',
  '00:59:59.999999999',
  '01:00:00',
  '23:59:59.999999999',
]
const dates = [
  '-271821-04-19',
  '-000001-12-31',
  '0000-01-01',
  '1900-02-28',
  '1900-03-01',
  '2000-02-28',
  '2000-02-29',
  '2000-03-01',
  '+275760-09-13',
]

it('compares every clock field, preserving sign and positive zero', () => {
  checkOrder(
    clocks.map(value => Temporal.PlainTime.from(value)),
    Temporal.PlainTime.compare
  )
})

it('compares ISO dates across eras, leap days and exact limits', () => {
  checkOrder(
    dates.map(value => Temporal.PlainDate.from(value)),
    Temporal.PlainDate.compare
  )
})

it('compares date before clock, retaining every subsecond digit', () => {
  checkOrder(
    [
      Temporal.PlainDateTime.from('-271821-04-19T00:00:00.000000001'),
      ...dates
        .slice(1, -1)
        .map(value =>
          Temporal.PlainDateTime.from(value + 'T23:59:59.999999999')
        ),
      ...clocks.map(value =>
        Temporal.PlainDateTime.from('2000-03-02T' + value)
      ),
      Temporal.PlainDateTime.from('+275760-09-13T23:59:59.999999999'),
    ],
    Temporal.PlainDateTime.compare
  )
})

it('ignores calendar identity when comparing private ISO dates and date-times', () => {
  const date = Temporal.PlainDate.from('2000-02-29')
  const dateTime = Temporal.PlainDateTime.from('2000-02-29T12:34:56.123456789')
  expect(Temporal.PlainDate.compare(date, date.withCalendar('hebrew'))).toBe(0)
  expect(
    Temporal.PlainDateTime.compare(dateTime, dateTime.withCalendar('hebrew'))
  ).toBe(0)
  expect(
    Temporal.PlainDate.compare(date.withCalendar('hebrew'), date.add({days: 1}))
  ).toBe(-1)
})

it('compares exact epochs across both inclusive bounds and adjacent nanoseconds', () => {
  const epochs = [
    -8640000000000000000000n,
    -8639999999999999999999n,
    -1n,
    0n,
    1n,
    8639999999999999999999n,
    8640000000000000000000n,
  ]
  checkOrder(
    epochs.map(value => new Temporal.Instant(value)),
    Temporal.Instant.compare
  )
  checkOrder(
    epochs.map(value => new Temporal.ZonedDateTime(value, 'UTC')),
    Temporal.ZonedDateTime.compare
  )
  for (const value of [-8640000000000000000001n, 8640000000000000000001n]) {
    expect(() => new Temporal.Instant(value)).toThrow(RangeError)
    expect(() => new Temporal.ZonedDateTime(value, 'UTC')).toThrow(RangeError)
  }
})

it('compares zoned epochs rather than wall clocks, zone names or calendars', () => {
  const early = new Temporal.ZonedDateTime(0n, '+23:00', 'hebrew')
  const late = new Temporal.ZonedDateTime(1n, '-23:00')
  expect(Temporal.ZonedDateTime.compare(early, late)).toBe(-1)
  expect(
    Temporal.ZonedDateTime.compare(
      early,
      new Temporal.ZonedDateTime(0n, '-23:00')
    )
  ).toBe(0)
})
