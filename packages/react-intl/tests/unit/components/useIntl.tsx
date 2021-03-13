import * as React from 'react'
import {render} from '@testing-library/react'
import {IntlProvider} from '../../../'
import useIntl from '../../../src/components/useIntl'

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
  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<FunctionComponent />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('hooks onto the intl context', () => {
    const spy = jest.fn()
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
    expect(getByTestId('comp')).toMatchSnapshot()
    rerender(
      <IntlProvider locale="es">
        <span data-testid="comp">
          <FC />
        </span>
      </IntlProvider>
    )
    expect(getByTestId('comp')).toMatchSnapshot()
    rerender(
      <IntlProvider locale="en">
        <span data-testid="comp">
          <FC />
        </span>
      </IntlProvider>
    )

    expect(getByTestId('comp')).toMatchSnapshot()
  })
})
