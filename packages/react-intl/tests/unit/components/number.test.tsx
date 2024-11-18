import {IntlShape} from '@formatjs/intl'
import {render} from '@testing-library/react'
import * as React from 'react'
import {FormattedNumber, FormattedNumberParts} from '../../..'
import {createIntl} from '../../../src/components/createIntl'
import {mountFormattedComponentWithProvider} from '../testUtils'

const mountWithProvider = mountFormattedComponentWithProvider(FormattedNumber)
const mountPartsWithProvider =
  mountFormattedComponentWithProvider(FormattedNumberParts)

describe('<FormattedNumber>', () => {
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
    expect(typeof FormattedNumber.displayName).toBe('string')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<FormattedNumber value={0} />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('renders "NaN" in a <span> when no `value` prop is provided', () => {
    const {getByTestId} = mountWithProvider(
      {
        // @ts-ignore
        value: undefined,
      },
      intl
    )

    expect(getByTestId('comp')).toHaveTextContent('NaN')
  })

  it('renders a formatted number in a <>', () => {
    const num = 1000

    const {getByTestId} = mountWithProvider({value: num}, intl)

    expect(getByTestId('comp')).toHaveTextContent(intl.formatNumber(num))
  })

  it('renders a formatted number w/o textComponent', () => {
    const num = 1000

    const {getByTestId} = mountWithProvider(
      {value: num},
      // @ts-ignore
      {...intl, textComponent: null}
    )

    expect(getByTestId('comp')).toHaveTextContent(intl.formatNumber(num))
  })

  it('accepts valid Intl.NumberFormat options as props', () => {
    const num = 0.5
    const options = {style: 'percent' as Intl.NumberFormatOptions['style']}

    const {getByTestId} = mountWithProvider({value: num, ...options}, intl)

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatNumber(num, options)
    )
  })

  it('falls back and warns on invalid Intl.NumberFormat options', () => {
    const {getByTestId} = mountWithProvider(
      {value: 0, style: 'invalid' as any},
      intl
    )

    expect(getByTestId('comp')).toHaveTextContent('0')
    expect(onError.mock.calls[0][0].code).toBe('FORMAT_ERROR')
    expect(onError).toHaveBeenCalledTimes(2)
  })

  it('accepts `format` prop', () => {
    intl = createIntl({
      onError: () => {},
      locale: 'en',
      formats: {
        number: {
          percent: {
            style: 'percent',
            minimumFractionDigits: 2,
          },
        },
      },
    })

    const num = 0.505
    const format = 'percent'

    const {getByTestId} = mountWithProvider({value: num, format}, intl)

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatNumber(num, {format})
    )
  })

  it('supports function-as-child pattern', () => {
    const num = Date.now()

    const spy = jest
      .fn()
      .mockImplementation(() => <span data-testid="spy">Jest</span>)
    const {getByTestId} = mountWithProvider({value: num, children: spy}, intl)

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]).toEqual([intl.formatNumber(num)])

    expect(getByTestId('spy').tagName).toBe('SPAN')
    expect(getByTestId('comp')).toHaveTextContent('Jest')
  })
})

function NOOP(_: Intl.NumberFormatPart[]) {
  return null
}

describe('<FormattedNumberParts>', function () {
  let intl: IntlShape<React.ReactNode>
  const children = jest.fn(
    parts => (Array.isArray(parts) && parts[0] && parts[0].value) || null
  )

  beforeEach(() => {
    intl = createIntl({
      locale: 'en',
      onError: () => {},
    })
    children.mockClear()
  })

  it('has a `displayName`', () => {
    expect(typeof FormattedNumberParts.displayName).toBe('string')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<FormattedNumberParts value={0} children={NOOP} />)
    ).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('accepts valid Intl.NumberFormat options as props', () => {
    const num = 0.5
    const options = {
      style: 'percent' as Intl.NumberFormatOptions['style'],
      children,
    }

    mountPartsWithProvider({value: num, ...options}, intl)

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatNumberToParts(num, options)
    )
  })

  it('accepts `format` prop', () => {
    intl = createIntl({
      onError: () => {},
      locale: 'en',
      formats: {
        number: {
          percent: {
            style: 'percent',
            minimumFractionDigits: 2,
          },
        },
      },
    })

    const num = 0.505
    const format = 'percent'

    mountPartsWithProvider({value: num, format, children}, intl)
    expect(children.mock.calls[0][0]).toEqual(
      intl.formatNumberToParts(num, {format})
    )
  })
})
