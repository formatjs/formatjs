import * as React from 'react'
import IntlProvider from '../../../src/components/provider'
import injectIntl, {
  WrappedComponentProps,
} from '../../../src/components/injectIntl'
import {render} from '@testing-library/react'
import {IntlShape} from '@formatjs/intl'

const mountWithProvider = (el: JSX.Element) =>
  render(<IntlProvider locale="en">{el}</IntlProvider>)

describe('injectIntl()', () => {
  let Wrapped: React.FC<WrappedComponentProps>

  beforeEach(() => {
    Wrapped = ({intl}: {intl: IntlShape<React.ReactNode>}) => (
      <div data-testid="comp">{JSON.stringify(intl)}</div>
    )
    Wrapped.displayName = 'Wrapped'
    // @ts-ignore
    Wrapped.someNonReactStatic = {
      foo: true,
    }
  })

  it('allows introspection access to the wrapped component', () => {
    expect(injectIntl(Wrapped).WrappedComponent).toBe(Wrapped)
  })

  it('hoists non-react statics', () => {
    expect((injectIntl(Wrapped) as any).someNonReactStatic.foo).toBe(true)
  })

  describe('displayName', () => {
    it('is descriptive by default', () => {
      expect(injectIntl(() => null).displayName).toBe('injectIntl(Component)')
    })

    it("includes `WrappedComponent`'s `displayName`", () => {
      Wrapped.displayName = 'Foo'
      expect(injectIntl(Wrapped).displayName).toBe('injectIntl(Foo)')
    })
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const Injected = injectIntl(Wrapped)

    expect(() => render(<Injected />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('propagates all props to <WrappedComponent>', () => {
    const Injected = injectIntl(Wrapped) as any
    const props = {
      foo: 'bar',
    }

    const {getByTestId} = mountWithProvider(<Injected {...props} />)
    expect(getByTestId('comp')).toHaveTextContent(
      '{"formats":{},"messages":{},"defaultLocale":"en","defaultFormats":{},"fallbackOnEmptyString":true,"locale":"en","formatters":{}}'
    )
  })
})
