import {IntlShape} from '@formatjs/intl'
import {render} from '@testing-library/react'
import * as React from 'react'
import {createIntl} from '../../../src/components/createIntl'
import FormattedPlural from '../../../src/components/plural'
import {mountFormattedComponentWithProvider} from '../testUtils'

const mountWithProvider = mountFormattedComponentWithProvider(FormattedPlural)

describe('<FormattedPlural>', () => {
  let intl: IntlShape<React.ReactNode>

  beforeEach(() => {
    intl = createIntl({
      onError: () => {},
      locale: 'en',
    })
  })

  it('has a `displayName`', () => {
    expect(typeof FormattedPlural.displayName).toBe('string')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<FormattedPlural value={1} other="" />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('renders an empty <> when no `other` prop is provided', () => {
    let {getByTestId, unmount} = mountWithProvider(
      // @ts-ignore
      {value: undefined, other: undefined},
      intl
    )

    expect(getByTestId('comp')).toHaveTextContent('')
    unmount()
    getByTestId = mountWithProvider(
      {value: 1, other: undefined},
      intl
    ).getByTestId
    expect(getByTestId('comp')).toHaveTextContent('')
  })

  it('renders `other` in a <> when no `value` prop is provided', () => {
    const other = 'Jest'

    const {getByTestId} = mountWithProvider(
      {
        // @ts-ignore
        value: undefined,
        other,
      },
      intl
    )
    expect(getByTestId('comp')).toHaveTextContent(other)
  })

  it('renders a formatted plural in a <>', () => {
    const num = 1
    const one = 'foo'
    const other = 'bar'

    const {getByTestId} = mountWithProvider({value: num, one, other}, intl)
    expect(getByTestId('comp')).toHaveTextContent(num === 1 ? one : other)
  })

  it('renders a formatted plural w/o textComponent', () => {
    const num = 1
    const one = 'foo'
    const other = 'bar'

    const {getByTestId} = mountWithProvider(
      {value: num, one, other},
      // @ts-ignore
      {...intl, textComponent: null}
    )
    expect(getByTestId('comp')).toHaveTextContent(num === 1 ? one : other)
  })

  it('accepts valid IntlPluralFormat options as props', () => {
    const num = 22
    const props = {two: 'nd'} as any
    const options = {type: 'ordinal' as 'ordinal'}

    const {getByTestId} = mountWithProvider(
      {value: num, ...props, ...options},
      intl
    )

    expect(getByTestId('comp')).toHaveTextContent(
      props[intl.formatPlural(num, options)]
    )
  })

  it('supports function-as-child pattern', () => {
    const props = {one: 'foo'} as Record<Intl.LDMLPluralRule, string>
    const num = 1

    const spy = jest.fn().mockImplementation(() => <b data-testid="b">Jest</b>)
    const {getByTestId} = mountWithProvider(
      {...props, other: undefined, value: num, children: spy},
      intl
    )

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0]).toEqual([props[intl.formatPlural(num)]])

    expect(getByTestId('b').tagName).toBe('B')
    expect(getByTestId('comp')).toHaveTextContent('Jest')
  })
})
