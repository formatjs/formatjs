import {
  createIntl,
  createIntlCache,
  IntlErrorCode,
} from '#packages/intl/index.js'
import {afterEach, describe, expect, it, vi} from 'vitest'

const DURATION = {hours: 1, minutes: 2, seconds: 3}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('formatDuration', () => {
  it.each(['en', 'fr', 'de'])(
    'uses the configured %s locale for strings and parts',
    locale => {
      const intl = createIntl({locale})
      const options = {style: 'long'} as const
      const formatter = new Intl.DurationFormat(locale, options)
      expect(intl.formatDuration(DURATION, options)).toBe(
        formatter.format(DURATION)
      )
      expect(intl.formatDurationToParts(DURATION, options)).toEqual(
        formatter.formatToParts(DURATION)
      )
    }
  )

  it('merges named formats with explicit options and shares the formatter cache', () => {
    const cache = createIntlCache()
    const intl = createIntl(
      {
        locale: 'en',
        formats: {
          duration: {clock: {style: 'digital', secondsDisplay: 'always'}},
        },
      },
      cache
    )
    const options = {format: 'clock', fractionalDigits: 3} as const
    const value = {...DURATION, milliseconds: 456}
    const expected = new Intl.DurationFormat('en', {
      style: 'digital',
      secondsDisplay: 'always',
      fractionalDigits: 3,
    })
    expect(intl.formatDuration(value, options)).toBe(expected.format(value))
    expect(intl.formatDurationToParts(value, options)).toEqual(
      expected.formatToParts(value)
    )
    const [formatter] = Object.values(cache.duration)
    expect(Object.values(cache.duration)).toHaveLength(1)
    const other = createIntl({locale: 'en'}, cache)
    expect(
      other.formatters.getDurationFormat('en', {
        style: 'digital',
        secondsDisplay: 'always',
        fractionalDigits: 3,
      })
    ).toBe(formatter)
    expect(
      intl.formatDuration(DURATION, {format: 'clock', style: 'long'})
    ).toBe(
      new Intl.DurationFormat('en', {
        style: 'long',
        secondsDisplay: 'always',
      }).format(DURATION)
    )
  })

  it('reports unknown named formats and still formats with explicit options', () => {
    const onError = vi.fn()
    const intl = createIntl({locale: 'en', onError})
    expect(
      intl.formatDuration(DURATION, {format: 'missing', style: 'long'})
    ).toBe('1 hour, 2 minutes, 3 seconds')
    expect(onError).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({code: IntlErrorCode.UNSUPPORTED_FORMATTER})
    )
  })

  it.each(['formatDuration', 'formatDurationToParts'] as const)(
    '%s reports invalid input and returns an empty result',
    method => {
      const onError = vi.fn()
      const intl = createIntl({locale: 'en', onError})
      expect(intl[method]({hours: 1, minutes: -2})).toEqual(
        method === 'formatDuration' ? '' : []
      )
      expect(onError).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({code: IntlErrorCode.FORMAT_ERROR})
      )
    }
  )

  it('does not require DurationFormat until duration formatting is used', () => {
    const DurationFormat = Intl.DurationFormat
    const onError = vi.fn()
    const intlWithoutDuration = Object.create(Intl)
    Object.defineProperty(intlWithoutDuration, 'DurationFormat', {
      value: undefined,
      configurable: true,
    })
    vi.stubGlobal('Intl', intlWithoutDuration)
    const intl = createIntl({locale: 'en', onError})
    expect(intl.formatNumber(42)).toBe('42')
    expect(onError).not.toHaveBeenCalled()
    expect(intl.formatDuration(DURATION)).toBe('')
    expect(intl.formatDurationToParts(DURATION)).toEqual([])
    expect(onError.mock.calls).toEqual([
      [expect.objectContaining({code: 'MISSING_INTL_API'})],
      [expect.objectContaining({code: 'MISSING_INTL_API'})],
    ])
    // A polyfill loaded after createIntl must also be usable.
    Object.defineProperty(intlWithoutDuration, 'DurationFormat', {
      value: DurationFormat,
    })
    expect(intl.formatDuration(DURATION, {style: 'long'})).toBe(
      '1 hour, 2 minutes, 3 seconds'
    )
  })
})
