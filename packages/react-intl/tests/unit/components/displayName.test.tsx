import * as React from 'react'
import {describe, expect, it, vi, beforeEach} from 'vitest'
import {cleanup, render} from '@testing-library/react'
import {FormattedDisplayName} from '../../..'
import {mountFormattedComponentWithProvider} from '../testUtils'
import '@testing-library/jest-dom/vitest'
const mountWithProvider =
  mountFormattedComponentWithProvider(FormattedDisplayName)

const intlConfig = {locale: 'en'}

describe('<FormattedDisplayName />', () => {
  beforeEach(() => {
    cleanup()
  })
  it('has a `displayName`', () => {
    expect(FormattedDisplayName.displayName).toBe('FormattedDisplayName')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    vi.spyOn(console, 'error').mockImplementation(() => {})
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
    expect(container.querySelector('span')?.textContent).toBe('Chinese Yuan')
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

    expect(container.querySelector('span')?.textContent).toBe('')
  })
})
