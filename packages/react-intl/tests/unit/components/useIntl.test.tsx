import {cleanup, render} from '@testing-library/react'
import {IntlProvider} from '../../..'
import useIntl from '../../../src/components/useIntl'
import {describe, expect, it, vi, beforeEach} from 'vitest'
import '@testing-library/jest-dom/vitest'

const FunctionComponent = ({spy}: {spy?: Function}) => {
  const hookReturns = useIntl()
  spy!(hookReturns.locale)
  return null
}

const FC = () => {
  const {formatNumber} = useIntl()
  return formatNumber(10000, {style: 'currency', currency: 'USD'}) as any
}

describe('useIntl() hook', () => {
  beforeEach(() => {
    cleanup()
  })
  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<FunctionComponent />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('hooks onto the intl context', () => {
    const spy = vi.fn()
    render(
      <IntlProvider locale="en">
        <FunctionComponent spy={spy} />
      </IntlProvider>
    )

    expect(spy).toHaveBeenCalledWith('en')
  })

  it('should work when switching locale on provider', () => {
    const {rerender, getByTestId} = render(
      <IntlProvider locale="en">
        <span data-testid="comp">
          <FC />
        </span>
      </IntlProvider>
    )
    expect(getByTestId('comp')).toHaveTextContent('$10,000.00')
    rerender(
      <IntlProvider locale="es">
        <span data-testid="comp">
          <FC />
        </span>
      </IntlProvider>
    )
    expect(getByTestId('comp')).toHaveTextContent('10.000,00 US$')
    rerender(
      <IntlProvider locale="en">
        <span data-testid="comp">
          <FC />
        </span>
      </IntlProvider>
    )
    expect(getByTestId('comp')).toHaveTextContent('$10,000.00')
  })
})
