import {cleanup, render} from '@testing-library/react'
import {
  FormattedList,
  FormattedListParts,
  type IntlShape,
} from '#packages/react-intl'
import {createIntl} from '#packages/react-intl/components/createIntl'
import {mountFormattedComponentWithProvider} from '#packages/react-intl/tests/unit/testUtils'
import {describe, expect, it, beforeEach, afterEach, vi} from 'vitest'
import '@testing-library/jest-dom/vitest'

const mountWithProvider = mountFormattedComponentWithProvider(FormattedList)
const mountPartsWithProvider =
  mountFormattedComponentWithProvider(FormattedListParts)

describe('<FormattedList>', () => {
  let intl: IntlShape

  beforeEach(() => {
    intl = createIntl({
      locale: 'en',
      onError: () => {},
    })
    cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('has a `displayName`', () => {
    expect(FormattedList.displayName).toBe('FormattedList')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<FormattedList value={['Alice', 'Bob']} />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('renders a formatted list in a <>', () => {
    const value = ['Alice', 'Bob', 'Carol']
    const {getByTestId} = mountWithProvider({value}, intl)

    expect(getByTestId('comp')).toHaveTextContent(intl.formatList(value))
  })

  it('accepts valid Intl.ListFormat options as props', () => {
    const value = ['1', '2', '3']
    const options: Intl.ListFormatOptions = {type: 'unit', style: 'narrow'}
    const {getByTestId} = mountWithProvider({value, ...options}, intl)

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatList(value, options)
    )
  })
})

describe('<FormattedListParts>', () => {
  let intl: IntlShape
  const children = vi.fn(_parts => null)

  beforeEach(() => {
    intl = createIntl({
      locale: 'en',
      onError: () => {},
    })
    children.mockClear()
    cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('has a `displayName`', () => {
    expect(FormattedListParts.displayName).toBe('FormattedListParts')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <FormattedListParts value={['Alice', 'Bob']}>
          {children}
        </FormattedListParts>
      )
    ).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('accepts valid Intl.ListFormat options as props', () => {
    const value = ['1', '2', '3']
    const options: Intl.ListFormatOptions = {type: 'unit', style: 'narrow'}

    mountPartsWithProvider({value, ...options, children}, intl)

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatListToParts(value, options)
    )
  })
})
