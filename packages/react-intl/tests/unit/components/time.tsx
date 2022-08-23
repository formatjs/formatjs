import * as React from 'react'
import {FormattedTime, FormattedTimeParts} from '../../../'
import {mountFormattedComponentWithProvider} from '../testUtils'
import {createIntl} from '../../../src/components/provider'
import {IntlShape} from '@formatjs/intl'
import {render} from '@testing-library/react'

const mountWithProvider = mountFormattedComponentWithProvider(FormattedTime)
const mountPartsWithProvider =
  mountFormattedComponentWithProvider(FormattedTimeParts)

describe('<FormattedTime>', () => {
  let intl: IntlShape<React.ReactNode>
  const onError = jest.fn()
  beforeEach(() => {
    onError.mockClear()
    intl = createIntl({
      locale: 'en',
      onError,
    })
  })

  it('has a `displayName`', () => {
    expect(typeof FormattedTime.displayName).toBe('string')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<FormattedTime value={0} />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('requires a finite `value` prop', () => {
    const {rerenderProps} = mountWithProvider({value: 0}, intl)
    expect(onError).not.toHaveBeenCalled()

    rerenderProps(
      {
        value: NaN,
      },
      intl
    )
    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError.mock.calls[0][0].code).toBe('FORMAT_ERROR')
  })

  it('renders a formatted time in a <>', () => {
    const date = new Date()

    const {getByTestId} = mountWithProvider({value: date}, intl)

    expect(getByTestId('comp')).toHaveTextContent(intl.formatTime(date))
  })

  it('renders a formatted time w/o textComponent', () => {
    const date = new Date()

    const {getByTestId} = mountWithProvider(
      {value: date},
      {
        ...intl,
        // @ts-ignore
        textComponent: null,
      }
    )

    expect(getByTestId('comp')).toHaveTextContent(intl.formatTime(date))
  })

  it('accepts valid Intl.DateTimeFormat options as props', () => {
    const date = Date.now()
    const options: Intl.DateTimeFormatOptions = {hour: '2-digit'}

    const {getByTestId} = mountWithProvider({value: date, ...options}, intl)

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatTime(date, options)
    )
  })

  it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
    const date = new Date()

    const {getByTestId} = mountWithProvider(
      // @ts-expect-error invalid for testing
      {value: date, hour: 'invalid'},
      intl
    )

    expect(getByTestId('comp')).toHaveTextContent(String(date))
    expect(onError.mock.calls[0][0].code).toBe('FORMAT_ERROR')
    expect(onError).toHaveBeenCalledTimes(2)
  })

  it('accepts `format` prop', () => {
    intl = createIntl({
      onError: () => {},
      locale: 'en',
      formats: {
        time: {
          'hour-only': {
            hour: '2-digit',
            hour12: false,
          },
        },
      },
    })

    const date = Date.now()
    const format = 'hour-only'

    const {getByTestId} = mountWithProvider({value: date, format}, intl)

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatTime(date, {format})
    )
  })

  it('supports function-as-child pattern', () => {
    const date = Date.now()

    const spy = jest.fn().mockImplementation(() => <b data-testid="b">Jest</b>)
    const {getByTestId} = mountWithProvider({value: date, children: spy}, intl)

    expect(getByTestId('b').tagName).toBe('B')
    expect(getByTestId('comp')).toHaveTextContent('Jest')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]).toEqual([intl.formatTime(date)])
  })
})

describe('<FormattedTimeParts>', () => {
  let intl: IntlShape<React.ReactNode>
  const children = jest.fn(
    parts => (Array.isArray(parts) && parts[0] && parts[0].value) || null
  )
  const onError = jest.fn()
  beforeEach(() => {
    onError.mockClear()
    intl = createIntl({
      locale: 'en',
      onError,
    })
    children.mockClear()
  })

  it('has a `displayName`', () => {
    expect(FormattedTimeParts.displayName).toBe('FormattedTimeParts')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<FormattedTimeParts value={0} children={children} />)
    ).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('requires a finite `value` prop', () => {
    const {rerenderProps} = mountPartsWithProvider({value: 0, children}, intl)
    expect(onError).not.toHaveBeenCalled()

    rerenderProps(
      {
        children,
        value: NaN,
      },
      intl
    )
    expect(onError.mock.calls[0][0].code).toBe('FORMAT_ERROR')
    expect(onError).toHaveBeenCalledTimes(2)
  })

  it('accepts valid Intl.DateTimeFormat options as props', () => {
    const date = new Date(1567130870626)
    const options: Intl.DateTimeFormatOptions = {hour: '2-digit'}

    mountPartsWithProvider({value: date, children, ...options}, intl)

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatTimeToParts(date, options)
    )
  })

  it('renders a string date', () => {
    const date = new Date()

    mountPartsWithProvider({value: date.toISOString(), children}, intl)

    expect(children.mock.calls[0][0]).toEqual(intl.formatTimeToParts(date))
  })

  it('renders date 0 if value is ""', () => {
    const date = new Date(0)

    mountPartsWithProvider({value: '', children}, intl)

    expect(children.mock.calls[0][0]).toEqual(intl.formatTimeToParts(date))
  })

  it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
    const date = new Date(1567130870626)

    // @ts-expect-error invalid for testing
    mountPartsWithProvider({value: date, hour: 'invalid', children}, intl)
    expect(children.mock.calls[0][0]).toEqual(
      // @ts-expect-error invalid for testing
      intl.formatTimeToParts(date, {hour: 'invalid'})
    )
    expect(onError.mock.calls[0][0].code).toBe('FORMAT_ERROR')
    expect(onError).toHaveBeenCalledTimes(3)
  })

  it('accepts `format` prop', () => {
    intl = createIntl({
      onError: () => {},
      locale: 'en',
      formats: {
        time: {
          'hour-only': {
            hour: '2-digit',
            hour12: false,
          },
        },
      },
    })

    const date = new Date(1567130870626)
    const format = 'hour-only'

    mountPartsWithProvider({value: date, format, children}, intl)

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatTimeToParts(date, {format})
    )
  })
})
