/* eslint-disable @typescript-eslint/camelcase */
import {formatTime as formatTimeFn} from '../src/dateTime'
import {Formatters, IntlConfig, IntlFormatters} from '../src/types'

describe('format API', () => {
  const {NODE_ENV} = process.env

  let config: IntlConfig<any>

  let getDateTimeFormat: Formatters['getDateTimeFormat'] = (
    ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
  ) => new Intl.DateTimeFormat(...args)
  beforeEach(() => {
    config = {
      locale: 'en',

      messages: {},

      formats: {
        time: {
          'hour-only': {
            hour: '2-digit',
            hour12: false,
          },
          missing: undefined,
        },
      } as any,

      defaultLocale: 'en',
      defaultFormats: {},

      onError: jest.fn(),
    }
  })

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV
  })

  describe('formatTime()', () => {
    let df: Intl.DateTimeFormat
    let formatTime: IntlFormatters['formatTime']

    beforeEach(() => {
      df = new Intl.DateTimeFormat(config.locale, {
        hour: 'numeric',
        minute: 'numeric',
      })
      // @ts-ignore
      formatTime = formatTimeFn.bind(null, config, getDateTimeFormat)
      ;(config.onError as jest.Mock).mockClear()
    })

    it('render now if no value is provided', () => {
      // @ts-ignore
      expect(formatTime()).toBe(df.format())
    })

    it('should not inject additional hour/minute when dateStyle are used', function () {
      expect(config.onError).not.toHaveBeenCalled()
      formatTimeFn(config as any, getDateTimeFormat, new Date(), {
        dateStyle: 'short',
      })

      expect(config.onError).not.toHaveBeenCalled()
    })

    it('should not inject additional hour/minute when timeStyle are used', function () {
      expect(config.onError).not.toHaveBeenCalled()
      formatTimeFn(config as any, getDateTimeFormat, new Date(), {
        timeStyle: 'short',
      })

      expect(config.onError).not.toHaveBeenCalled()
    })

    it('falls back and warns when a non-finite value is provided', () => {
      expect(formatTime(NaN)).toBe('NaN')
      // @ts-ignore
      expect(formatTime('')).toBe(df.format(''))
      expect(config.onError as jest.Mock).toHaveBeenCalledTimes(1)
    })

    it('formats falsy finite values', () => {
      // @ts-ignore
      expect(formatTime(false)).toBe(df.format(false))
      // @ts-ignore
      expect(formatTime(null)).toBe(df.format(null))
      expect(formatTime(0)).toBe(df.format(0))
    })

    it('formats date instance values', () => {
      expect(formatTime(new Date(0))).toBe(df.format(new Date(0)))
    })

    it('formats date string values', () => {
      expect(formatTime(new Date(0).toString())).toBe(df.format(0))
    })

    it('formats date ms timestamp values', () => {
      const timestamp = Date.now()
      expect(formatTime(timestamp)).toBe(df.format(timestamp))
    })

    it('uses the time zone specified by the provider', () => {
      const timestamp = Date.now()
      config.timeZone = 'Africa/Johannesburg'
      // @ts-ignore
      formatTime = formatTimeFn.bind(null, config, getDateTimeFormat)
      const johannesburgDf = new Intl.DateTimeFormat(config.locale, {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Africa/Johannesburg',
      })
      expect(formatTime(timestamp)).toBe(johannesburgDf.format(timestamp))
      config.timeZone = 'America/Chicago'
      // @ts-ignore
      formatTime = formatTimeFn.bind(null, config, getDateTimeFormat)
      const chicagoDf = new Intl.DateTimeFormat(config.locale, {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'America/Chicago',
      })
      expect(formatTime(timestamp)).toBe(chicagoDf.format(timestamp))
    })

    describe('options', () => {
      it('accepts empty options', () => {
        expect(formatTime(0, {})).toBe(df.format(0))
      })

      it('accepts valid Intl.DateTimeFormat options', () => {
        expect(() => formatTime(0, {hour: '2-digit'})).not.toThrow()
      })

      it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
        // @ts-expect-error just for test
        expect(formatTime(0, {hour: 'invalid'})).toBe('0')
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('uses configured named formats', () => {
        const date = new Date()
        const format = 'hour-only'

        const {locale, formats} = config
        df = new Intl.DateTimeFormat(locale, formats!.time![format])

        expect(formatTime(date, {format})).toBe(df.format(date))
      })

      it('uses named formats as defaults', () => {
        const date = new Date()
        const opts: Intl.DateTimeFormatOptions = {minute: '2-digit'}
        const format = 'hour-only'

        const {locale, formats} = config
        df = new Intl.DateTimeFormat(locale, {
          ...opts,
          ...formats!.time![format],
        })

        expect(formatTime(date, {...opts, format})).toBe(df.format(date))
      })

      it('handles missing named formats and warns', () => {
        const date = new Date()
        const format = 'missing'

        expect(formatTime(date, {format})).toBe(df.format(date))
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('should set default values', () => {
        const date = new Date()
        const {locale} = config
        const day = 'numeric'
        df = new Intl.DateTimeFormat(locale, {
          hour: 'numeric',
          minute: 'numeric',
          day,
        })
        expect(formatTime(date, {day})).toBe(df.format(date))
      })

      it('should not set default values when second is provided', () => {
        const date = new Date()
        const {locale} = config
        const second = 'numeric'
        df = new Intl.DateTimeFormat(locale, {second})
        expect(formatTime(date, {second})).toBe(df.format(date))
      })

      it('should not set default values when minute is provided', () => {
        const date = new Date()
        const {locale} = config
        const minute = 'numeric'
        df = new Intl.DateTimeFormat(locale, {minute})
        expect(formatTime(date, {minute})).toBe(df.format(date))
      })

      it('should not set default values when hour is provided', () => {
        const date = new Date()
        const {locale} = config
        const hour = 'numeric'
        df = new Intl.DateTimeFormat(locale, {hour})
        expect(formatTime(date, {hour})).toBe(df.format(date))
      })

      it('uses time zone specified in options over the one passed through by the provider', () => {
        const timestamp = Date.now()
        config.timeZone = 'Africa/Johannesburg'
        // @ts-ignore
        formatTime = formatTimeFn.bind(null, config, getDateTimeFormat)
        const chicagoDf = new Intl.DateTimeFormat(config.locale, {
          hour: 'numeric',
          minute: 'numeric',
          timeZone: 'America/Chicago',
        })
        expect(formatTime(timestamp, {timeZone: 'America/Chicago'})).toBe(
          chicagoDf.format(timestamp)
        )
      })
    })
  })
})
