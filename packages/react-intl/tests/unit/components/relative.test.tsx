import {act, cleanup, render} from '@testing-library/react'
import {createIntl} from '../../../src/components/createIntl'
import FormattedRelativeTime from '../../../src/components/relative'
import type {IntlConfig} from '../../../src/types'
import {IntlShape} from '../../../src/types'
import {mountFormattedComponentWithProvider} from '../testUtils'
import {describe, expect, it, beforeEach, vi} from 'vitest'
import '@testing-library/jest-dom/vitest'

const mountWithProvider = mountFormattedComponentWithProvider(
  FormattedRelativeTime
)

describe('<FormattedRelativeTime>', () => {
  let intl: IntlShape
  const intlConfig: IntlConfig = {
    locale: 'en',
    onError: () => {},
  }

  beforeEach(() => {
    intl = createIntl(intlConfig)
    cleanup()
  })

  it('has a `displayName`', () => {
    expect(FormattedRelativeTime.displayName).toBe('FormattedRelativeTime')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<FormattedRelativeTime />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('should re-render when props change', () => {
    const spy = vi.fn().mockImplementation(() => null)
    mountWithProvider({value: 0, children: spy}, intlConfig)
    mountWithProvider({value: 1, children: spy}, intlConfig)
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('should re-render when context changes', () => {
    const otherIntl = createIntl({
      locale: 'en-US',
    })
    const spy = vi.fn().mockImplementation(() => null)
    mountWithProvider({value: 0, children: spy}, intlConfig)
    mountWithProvider({value: 0, children: spy}, otherIntl)

    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('accepts valid IntlRelativeTimeFormat options as props', () => {
    const options = {style: 'narrow' as const}
    const {getByTestId} = mountWithProvider({value: -60, ...options})

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-60, 'second', options)
    )
  })

  it('can render in null textComponent', () => {
    const options = {style: 'narrow' as const}
    const {getByTestId} = mountWithProvider(
      {value: -60, ...options},
      {
        ...intlConfig,
        // @ts-ignore
        textComponent: null,
      }
    )

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-60, 'second', options)
    )
  })

  it('throws an error for invalid unit', () => {
    const onError = vi.fn()
    const {getByTestId} = mountWithProvider(
      {value: 0, unit: 'invalid' as any},
      {onError, locale: 'en'}
    )
    expect(getByTestId('comp')).toHaveTextContent('0')
    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError.mock.calls[0][0].code).toBe('FORMAT_ERROR')
  })

  it('accepts `format` prop', () => {
    const format = 'seconds'
    const config: IntlConfig = {
      onError: () => {},
      locale: 'en',
      formats: {
        relative: {
          [format]: {
            style: 'narrow',
          },
        },
      },
    }
    intl = createIntl(config)

    const {getByTestId} = mountWithProvider({value: -60, format}, config)

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-60, 'second', {format})
    )
  })

  it('supports function-as-child pattern', () => {
    const spy = vi.fn().mockImplementation(() => <b>Jest</b>)
    const {getByTestId} = mountWithProvider(
      {value: 0, children: spy},
      intlConfig
    )

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]).toEqual([intl.formatRelativeTime(0)])

    expect(getByTestId('comp')).toHaveTextContent('Jest')
  })

  it.skip('updates automatically', () => {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: 2, updateIntervalInSeconds: 1},
      {...intl}
    )
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(2, 'second')
    )
    act(() => {
      vi.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(1, 'second')
    )
    act(() => {
      vi.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(0, 'second')
    )
    act(() => {
      vi.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'second')
    )
  })

  it.skip('updates when the `value` prop changes', () => {
    const {getByTestId, rerenderProps} = mountWithProvider(
      {value: 0, updateIntervalInSeconds: 1},
      {...intl}
    )
    rerenderProps({value: 10, updateIntervalInSeconds: 1}, {...intl})

    expect(getByTestId('comp')).toHaveTextContent('in 10 seconds')
    act(() => {
      vi.advanceTimersByTime(1010)
    })

    expect(getByTestId('comp')).toHaveTextContent('in 9 seconds')
  })

  it.skip('should adjust unit to min correctly', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -59, updateIntervalInSeconds: 1},
      {...intlConfig}
    )
    act(() => {
      vi.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'minute')
    )
  })
  it.skip('should adjust unit to min correctly even if updateIntervalInSeconds goes past that ts', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -59, updateIntervalInSeconds: 2},
      {...intlConfig}
    )
    act(() => {
      vi.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'minute')
    )
  })
  it.skip('should adjust unit to hour correctly', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -59, unit: 'minute', updateIntervalInSeconds: 1},
      {...intlConfig}
    )
    // Advance 1 min
    act(() => {
      vi.advanceTimersByTime(1000 * 60)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'hour')
    )
  })
  it.skip('should adjust unit to day correctly and stop', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -23, unit: 'hour', updateIntervalInSeconds: 1},
      {...intlConfig}
    )
    // Advance 1 hour
    act(() => {
      vi.advanceTimersByTime(1000 * 60 * 60)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'day')
    )
    // Advance 1 day
    act(() => {
      vi.advanceTimersByTime(1000 * 60 * 60 * 24)
    })
    // shouldn't change anything
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'day')
    )
  })
  it.skip('should show high seconds values as days with no timer', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -(60 * 60 * 24 * 3), unit: 'second', updateIntervalInSeconds: 1},
      {...intlConfig}
    )
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-3, 'day')
    )
  })
  it.skip('should throw if try to increment in day', function () {
    // span bc enzyme support for </> seems buggy
    expect(() =>
      mountWithProvider(
        {value: 5, unit: 'day', updateIntervalInSeconds: 1},
        {...intlConfig}
      )
    ).toThrow('Cannot schedule update with unit longer than hour')
  })
  it('should clear timer on unmount', function () {
    const {unmount, rerenderProps} = mountWithProvider(
      {value: 0, updateIntervalInSeconds: 1},
      {...intlConfig}
    )
    rerenderProps()
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    unmount()
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })
})
