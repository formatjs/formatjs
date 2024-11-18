import {act, render} from '@testing-library/react'
import * as React from 'react'
import {createIntl} from '../../../src/components/createIntl'
import FormattedRelativeTime from '../../../src/components/relative'
import type {IntlConfig} from '../../../src/types'
import {IntlShape} from '../../../src/types'
import {mountFormattedComponentWithProvider} from '../testUtils'

jest.useFakeTimers()

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
  })

  it('has a `displayName`', () => {
    expect(FormattedRelativeTime.displayName).toBe('FormattedRelativeTime')
  })

  it('throws when <IntlProvider> is missing from ancestry', () => {
    // So it doesn't spam the console
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<FormattedRelativeTime />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    )
  })

  it('should re-render when props change', () => {
    const spy = jest.fn().mockImplementation(() => null)
    mountWithProvider({value: 0, children: spy}, intlConfig)
    mountWithProvider({value: 1, children: spy}, intlConfig)
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('should re-render when context changes', () => {
    const otherIntl = createIntl({
      locale: 'en-US',
    })
    const spy = jest.fn().mockImplementation(() => null)
    mountWithProvider({value: 0, children: spy}, intlConfig)
    mountWithProvider({value: 0, children: spy}, otherIntl)

    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('accepts valid IntlRelativeTimeFormat options as props', () => {
    const options = {style: 'narrow' as 'narrow'}
    const {getByTestId} = mountWithProvider({value: -60, ...options})

    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-60, 'second', options)
    )
  })

  it('can render in null textComponent', () => {
    const options = {style: 'narrow' as 'narrow'}
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
    const onError = jest.fn()
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
    const spy = jest.fn().mockImplementation(() => <b>Jest</b>)
    const {getByTestId} = mountWithProvider(
      {value: 0, children: spy},
      intlConfig
    )

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]).toEqual([intl.formatRelativeTime(0)])

    expect(getByTestId('comp')).toMatchSnapshot()
  })

  xit('updates automatically', () => {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: 2, updateIntervalInSeconds: 1},
      {...intl}
    )
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(2, 'second')
    )
    act(() => {
      jest.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(1, 'second')
    )
    act(() => {
      jest.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(0, 'second')
    )
    act(() => {
      jest.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'second')
    )
  })

  xit('updates when the `value` prop changes', () => {
    const {getByTestId, rerenderProps} = mountWithProvider(
      {value: 0, updateIntervalInSeconds: 1},
      {...intl}
    )
    rerenderProps({value: 10, updateIntervalInSeconds: 1}, {...intl})

    expect(getByTestId('comp')).toHaveTextContent('in 10 seconds')
    act(() => {
      jest.advanceTimersByTime(1010)
    })

    expect(getByTestId('comp')).toHaveTextContent('in 9 seconds')
  })

  xit('should adjust unit to min correctly', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -59, updateIntervalInSeconds: 1},
      {...intlConfig}
    )
    act(() => {
      jest.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'minute')
    )
  })
  xit('should adjust unit to min correctly even if updateIntervalInSeconds goes past that ts', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -59, updateIntervalInSeconds: 2},
      {...intlConfig}
    )
    act(() => {
      jest.advanceTimersByTime(1010)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'minute')
    )
  })
  xit('should adjust unit to hour correctly', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -59, unit: 'minute', updateIntervalInSeconds: 1},
      {...intlConfig}
    )
    // Advance 1 min
    act(() => {
      jest.advanceTimersByTime(1000 * 60)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'hour')
    )
  })
  xit('should adjust unit to day correctly and stop', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -23, unit: 'hour', updateIntervalInSeconds: 1},
      {...intlConfig}
    )
    // Advance 1 hour
    act(() => {
      jest.advanceTimersByTime(1000 * 60 * 60)
    })
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'day')
    )
    // Advance 1 day
    act(() => {
      jest.advanceTimersByTime(1000 * 60 * 60 * 24)
    })
    // shouldn't change anything
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-1, 'day')
    )
  })
  xit('should show high seconds values as days with no timer', function () {
    // span bc enzyme support for </> seems buggy
    const {getByTestId} = mountWithProvider(
      {value: -(60 * 60 * 24 * 3), unit: 'second', updateIntervalInSeconds: 1},
      {...intlConfig}
    )
    expect(getByTestId('comp')).toHaveTextContent(
      intl.formatRelativeTime(-3, 'day')
    )
  })
  xit('should throw if try to increment in day', function () {
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
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout')
    unmount()
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })
})
