/* eslint-disable @typescript-eslint/camelcase */
import {formatList as formatListFn} from '../src/list'

import {IntlConfig, IntlFormatters} from '../src/types'

describe('format API', () => {
  const {NODE_ENV} = process.env

  let config: IntlConfig<any>
  let getListFormat: any
  beforeEach(() => {
    config = {
      locale: 'en',

      messages: {},

      defaultLocale: 'en',
      defaultFormats: {},

      onError: jest.fn(),
    }

    getListFormat = jest
      .fn()
      .mockImplementation((...args) => new Intl.ListFormat(...args))
  })

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV
  })

  describe('formatList()', function () {
    let formatList: IntlFormatters['formatList']

    beforeEach(() => {
      // @ts-ignore
      formatList = formatListFn.bind(null, config, getListFormat)
    })

    it('should handle regular element', function () {
      expect(formatList(['me', 'myself', 'I'])).toBe('me, myself, and I')
    })
    it('should handle regular element', function () {
      expect(formatList(['me', {foo: 'myself'}, 'I'])).toEqual([
        'me, ',
        {foo: 'myself'},
        ', and I',
      ])
    })
    it('should format [] as ""', function () {
      expect(formatList([])).toBe('')
    })
  })
})
