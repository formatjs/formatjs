import * as React from 'react'
import {mount} from 'enzyme'
import {FormattedDisplayName} from '../../../src'
import {mountFormattedComponentWithProvider} from '../testUtils'

const mountWithProvider = mountFormattedComponentWithProvider(
  FormattedDisplayName
)

const intlConfig = {locale: 'en'}

describe('<FormattedDisplayName />', () => {
  it('has a `displayName`', () => {
    expect(FormattedDisplayName.displayName).toBe('FormattedDisplayName')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    const mockConsole = jest
      .spyOn(console, 'error')
      .mockImplementation(() => null)
    try {
      expect(() => mount(<FormattedDisplayName value="zh-Hans" />)).toThrow(
        '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
      )
    } finally {
      mockConsole.mockRestore()
    }
  })

  it('accepts Intl.DisplayNames options', () => {
    const rendered = mountWithProvider(
      {
        type: 'currency',
        value: 'CNY',
      },
      intlConfig
    )
    expect(rendered).toMatchSnapshot()
  })

  it('renders an empty <> when the underlying DisplayNames would return undefined', () => {
    // When fallback is none, it will return undefined if no display name is available.
    const displayNames = new (Intl as any).DisplayNames('en', {
      fallback: 'none',
    })
    expect(displayNames.of('xx-XX')).toBeUndefined()

    // Now let's do the same with <FormattedDisplayNames />
    const rendered = mountWithProvider(
      {
        fallback: 'none',
        value: 'xx-XX',
      },
      intlConfig
    )
    expect(rendered.text()).toBe('')
    expect(rendered).toMatchSnapshot()
  })
})
