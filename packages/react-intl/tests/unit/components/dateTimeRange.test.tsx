import {cleanup, render} from '@testing-library/react'
import * as React from 'react'
import {FormattedDateTimeRange, IntlShape} from '../../..'
import {createIntl} from '../../../src/components/createIntl'
import {mountFormattedComponentWithProvider} from '../testUtils'
import {describe, expect, it, beforeEach, vi} from 'vitest'
import '@testing-library/jest-dom/vitest'
const mountWithProvider = mountFormattedComponentWithProvider(
  FormattedDateTimeRange
)

describe('<FormattedDateTimeRange>', () => {
  let intl: IntlShape
  beforeEach(() => {
    intl = createIntl({
      onError: () => {},
      locale: 'en',
      formats: {
        dateTimeRange: {
          custom: {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          },
        },
      },
    })
    cleanup()
  })

  it('has a `displayName`', () => {
    expect(typeof FormattedDateTimeRange.displayName).toBe('string')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<FormattedDateTimeRange from={Date.now()} to={Date.now()} />)
    ).toThrow(Error)
  })

  it('renders a formatted date in a <>', () => {
    const from = new Date(2020, 0, 1)
    const to = new Date(2020, 0, 15)

    const {getByTestId} = mountWithProvider({from, to}, intl)

    expect(getByTestId('comp')).toHaveTextContent('1/1/2020 – 1/15/2020')
  })
  it('renders a formatted date w/o textComponent', () => {
    const from = new Date('2020-1-1')
    const to = new Date('2020-1-15')
    const {getByTestId} = mountWithProvider(
      {from, to},
      {...intl, textComponent: '' as any}
    )

    expect(getByTestId('comp')).toHaveTextContent('1/1/2020 – 1/15/2020')
  })

  it('accepts valid Intl.DateTimeFormat options as props', () => {
    const from = new Date('2020-1-1')
    const to = new Date('2020-1-15')
    const options: Intl.DateTimeFormatOptions = {year: 'numeric'}

    const {getByTestId} = mountWithProvider({from, to, ...options}, intl)

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatDateTimeRange(from, to, options)
    )
  })

  it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
    const from = new Date()
    const onError = vi.fn()
    const {getByTestId} = mountWithProvider(
      // @ts-expect-error invalid for testing
      {from, to: undefined, year: 'invalid'},
      {...intl, onError}
    )

    expect(getByTestId('comp')).toHaveTextContent(String(from))
    expect(onError).toHaveBeenCalled()
    expect(onError.mock.calls[0][0].code).toBe('FORMAT_ERROR')
  })

  it('supports function-as-child pattern', () => {
    const from = new Date('2020-1-1')
    const to = new Date('2020-1-15')
    const spyChildren = vi
      .fn()
      .mockImplementation(() => <b data-testid="b">Jest</b>)
    const {getByTestId} = mountWithProvider(
      {
        from,
        to,
        children: spyChildren,
      },
      intl
    )

    expect(spyChildren).toHaveBeenCalledTimes(2)
    expect(spyChildren.mock.calls[0]).toEqual([
      intl.formatDateTimeRange(from, to),
    ])

    const rendered = getByTestId('b')
    expect(rendered.tagName).toBe('B')
    expect(rendered).toHaveTextContent('Jest')
  })

  it('#4792 formats', function () {
    const from = new Date(2020, 0, 1)
    const to = new Date(2020, 0, 15)

    const {getByTestId} = mountWithProvider({from, to, format: 'custom'}, intl)

    expect(getByTestId('comp')).toHaveTextContent('January 1 – 15, 2020')
  })
})
