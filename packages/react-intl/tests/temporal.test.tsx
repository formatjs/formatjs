import {cleanup, render} from '@testing-library/react'
import {afterEach, expect, expectTypeOf, it, vi} from 'vitest'
import {
  createIntl,
  FormattedDate,
  FormattedDateParts,
  FormattedDateTimeRange,
  FormattedDuration,
  FormattedTime,
  FormattedTimeParts,
  IntlProvider,
  type IntlShape,
  useIntl,
} from '#packages/react-intl/index.js'
import {createIntl as createServerIntl} from '#packages/react-intl/server.js'

const cases = [
  {
    name: 'PlainDate',
    start: new Temporal.PlainDate(2020, 2, 3),
    end: new Temporal.PlainDate(2020, 2, 5),
  },
  {
    name: 'PlainDateTime',
    start: new Temporal.PlainDateTime(2020, 2, 3, 12, 30),
    end: new Temporal.PlainDateTime(2020, 2, 5, 13, 45),
  },
  {
    name: 'PlainTime',
    start: new Temporal.PlainTime(12, 30),
    end: new Temporal.PlainTime(13, 45),
  },
  {
    name: 'PlainYearMonth',
    start: new Temporal.PlainYearMonth(2020, 2),
    end: new Temporal.PlainYearMonth(2020, 3),
  },
  {
    name: 'PlainMonthDay',
    start: new Temporal.PlainMonthDay(2, 3),
    end: new Temporal.PlainMonthDay(2, 5),
  },
  {
    name: 'Instant',
    start: Temporal.Instant.from('2020-02-03T12:30Z'),
    end: Temporal.Instant.from('2020-02-05T13:45Z'),
  },
]
const options = {calendar: 'iso8601', timeZone: 'UTC'}
const reference = new Intl.DateTimeFormat('en', options)
const text = (parts: {value: string}[]) =>
  parts.map(part => part.value).join('')

afterEach(cleanup)

it.each(cases)(
  'formats $name through client/server APIs and components',
  ({start, end}) => {
    const onError = vi.fn()
    const expected = reference.format(start)
    const range = reference.formatRange(start, end)
    for (const create of [createIntl, createServerIntl]) {
      const intl = create({locale: 'en', timeZone: 'UTC', onError})
      expect(intl.formatDate(start, options)).toBe(expected)
      expect(text(intl.formatDateToParts(start, options))).toBe(expected)
      expect(intl.formatDateTimeRange(start, end, options)).toBe(range)
    }
    function DateFromHook() {
      return <>{useIntl().formatDate(start, options)}</>
    }
    const {container} = render(
      <IntlProvider locale="en" timeZone="UTC" onError={onError}>
        <FormattedDate value={start} {...options} />
        <FormattedDateParts value={start} {...options}>
          {parts => <>{text(parts)}</>}
        </FormattedDateParts>
        <FormattedDateTimeRange from={start} to={end} {...options} />
        <DateFromHook />
      </IntlProvider>
    )
    expect(container.textContent).toBe(expected + expected + range + expected)
    expect(onError).not.toHaveBeenCalled()
  }
)

it.each(
  cases.filter(({name}) =>
    ['PlainTime', 'PlainDateTime', 'Instant'].includes(name)
  )
)('formats $name through time APIs and components', ({start}) => {
  const onError = vi.fn()
  const intl = createIntl({locale: 'en', timeZone: 'UTC', onError})
  const expected = new Intl.DateTimeFormat('en', {
    ...options,
    hour: 'numeric',
    minute: 'numeric',
  }).format(start)
  expect(intl.formatTime(start, options)).toBe(expected)
  expect(text(intl.formatTimeToParts(start, options))).toBe(expected)
  const {container} = render(
    <IntlProvider locale="en" timeZone="UTC" onError={onError}>
      <FormattedTime value={start} {...options} />
      <FormattedTimeParts value={start} {...options}>
        {parts => <>{text(parts)}</>}
      </FormattedTimeParts>
    </IntlProvider>
  )
  expect(container.textContent).toBe(expected + expected)
  expect(onError).not.toHaveBeenCalled()
})

it('accepts Temporal durations and ISO duration strings', () => {
  const value = Temporal.Duration.from('PT1H2M3S')
  const onError = vi.fn()
  for (const create of [createIntl, createServerIntl]) {
    const intl = create({locale: 'en', onError})
    for (const input of [value, 'PT1H2M3S']) {
      expect(intl.formatDuration(input, {style: 'digital'})).toBe('1:02:03')
      expect(text(intl.formatDurationToParts(input, {style: 'digital'}))).toBe(
        '1:02:03'
      )
    }
  }
  const {container} = render(
    <IntlProvider locale="en" onError={onError}>
      <FormattedDuration value={value} style="digital" />
      <FormattedDuration value="PT1H2M3S" style="digital" />
    </IntlProvider>
  )
  expect(container.textContent).toBe('1:02:031:02:03')
  expect(onError).not.toHaveBeenCalled()
})

it('excludes ZonedDateTime and Duration from date/time input types', () => {
  type Input = Parameters<IntlShape['formatDate']>[0]
  expectTypeOf<Temporal.ZonedDateTime>().not.toExtend<Input>()
  expectTypeOf<Temporal.Duration>().not.toExtend<Input>()
})
