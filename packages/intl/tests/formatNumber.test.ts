/* eslint-disable @typescript-eslint/camelcase */
import {formatNumber as formatNumberFn} from '../src/number'
import {IntlConfig} from '../src/types'

describe('format API', () => {
  const {NODE_ENV} = process.env

  let config: IntlConfig<any>

  let getNumberFormat: any
  beforeEach(() => {
    config = {
      locale: 'en',

      messages: {},

      formats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
          missing: undefined,
        },

        time: {
          'hour-only': {
            hour: '2-digit',
            hour12: false,
          },
          missing: undefined,
        },

        relative: {
          seconds: {
            style: 'narrow',
          },
          missing: undefined,
        },

        number: {
          percent: {
            style: 'percent',
            minimumFractionDigits: 2,
          },
          missing: undefined,
        },
      } as any,

      defaultLocale: 'en',
      defaultFormats: {},

      onError: jest.fn(),
    }

    getNumberFormat = jest
      .fn()
      .mockImplementation((...args) => new Intl.NumberFormat(...args))
  })

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV
  })

  describe('formatNumber()', () => {
    let nf: any
    let formatNumber: any

    beforeEach(() => {
      nf = new Intl.NumberFormat(config.locale)
      // @ts-ignore
      formatNumber = formatNumberFn.bind(null, config, getNumberFormat)
    })

    it('returns "NaN" when no value is provided', () => {
      expect(nf.format()).toBe('NaN')
      expect(formatNumber()).toBe('NaN')
    })

    it('returns "NaN" when a non-number value is provided', () => {
      expect(nf.format(NaN)).toBe('NaN')
      expect(formatNumber(NaN)).toBe('NaN')
    })

    it('formats falsy values', () => {
      expect(formatNumber(false)).toBe(nf.format(false))
      expect(formatNumber(null)).toBe(nf.format(null))
      expect(formatNumber('')).toBe(nf.format(''))
      expect(formatNumber(0)).toBe(nf.format(0))
    })

    it('formats number values', () => {
      expect(formatNumber(1000)).toBe(nf.format(1000))
      expect(formatNumber(1.1)).toBe(nf.format(1.1))
    })

    it('formats string values parsed as numbers', () => {
      expect(Number('1000')).toBe(1000)
      expect(formatNumber('1000')).toBe(nf.format('1000'))
      expect(Number('1.10')).toBe(1.1)
      expect(formatNumber('1.10')).toBe(nf.format('1.10'))
    })

    describe('options', () => {
      it('accepts empty options', () => {
        expect(formatNumber(1000, {})).toBe(nf.format(1000))
      })

      it('accepts valid Intl.NumberFormat options', () => {
        expect(() => formatNumber(0, {style: 'percent'})).not.toThrow()
      })

      it('falls back and warns on invalid Intl.NumberFormat options', () => {
        expect(formatNumber(0, {style: 'invalid'})).toBe(String(0))
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('uses configured named formats', () => {
        const num = 0.505
        const format = 'percent'

        const {locale, formats} = config
        nf = new Intl.NumberFormat(
          locale,
          formats!.number![format] as Intl.NumberFormatOptions
        )

        expect(formatNumber(num, {format})).toBe(nf.format(num))
      })

      it('uses named formats as defaults', () => {
        const num = 0.500059
        const opts = {maximumFractionDigits: 3}
        const format = 'percent'

        const {locale, formats} = config
        nf = new Intl.NumberFormat(locale, {
          ...opts,
          ...formats!.number![format],
        } as Intl.NumberFormatOptions)

        expect(formatNumber(num, {...opts, format})).toBe(nf.format(num))
      })

      it('handles missing named formats and warns', () => {
        const num = 1000
        const format = 'missing'

        nf = new Intl.NumberFormat(config.locale)

        expect(formatNumber(num, {format})).toBe(nf.format(num))
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('uses provided numberingSystem', () => {
        const num = 0.1
        const numberingSystem = 'arab'
        const style = 'percent'
        // @ts-ignore
        nf = new Intl.NumberFormat(config.locale, {numberingSystem, style})

        expect(formatNumber(num, {numberingSystem, style})).toBe(nf.format(num))
      })
    })
  })
})
