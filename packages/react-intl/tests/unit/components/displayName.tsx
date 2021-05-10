import * as React from 'react'

import {FormattedDisplayName} from '../../../'
import {mountFormattedComponentWithProvider} from '../testUtils'
import {render} from '@testing-library/react'
const mountWithProvider =
  mountFormattedComponentWithProvider(FormattedDisplayName)

const intlConfig = {locale: 'en'}

describe('<FormattedDisplayName />', () => {
  it('has a `displayName`', () => {
    expect(FormattedDisplayName.displayName).toBe('FormattedDisplayName')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<FormattedDisplayName type="language" value="zh-Hans" />)
    ).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('accepts Intl.DisplayNames options', () => {
    const {container} = mountWithProvider(
      {
        type: 'currency',
        value: 'CNY',
      },
      intlConfig
    )
    expect(container).toMatchSnapshot()
  })

  it('renders an empty <> when the underlying DisplayNames would return undefined', () => {
    // When fallback is none, it will return undefined if no display name is available.
    const displayNames = new (Intl as any).DisplayNames('en', {
      type: 'language',
      fallback: 'none',
    })
    expect(displayNames.of('xx-XX')).toBeUndefined()

    // Now let's do the same with <FormattedDisplayNames />
    const {container} = mountWithProvider(
      {
        type: 'language',
        fallback: 'none',
        value: 'xx-XX',
      },
      intlConfig
    )

    expect(container).toMatchSnapshot()
  })
})
