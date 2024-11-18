/* eslint-disable @typescript-eslint/camelcase */
import {formatDisplayName as formatDisplayNameFn} from '../src/displayName'
import {IntlConfig, IntlFormatters} from '../src/types'

describe('format API', () => {
  const {NODE_ENV} = process.env

  let config: IntlConfig<any>
  let getDisplayNames: any
  beforeEach(() => {
    config = {
      locale: 'en',

      messages: {},

      defaultLocale: 'en',
      defaultFormats: {},

      onError: jest.fn(),
    }

    getDisplayNames = jest
      .fn()
      .mockImplementation((...args) => new (Intl as any).DisplayNames(...args))
  })

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV
  })

  describe('formatDisplayNames()', function () {
    let formatDisplayName!: IntlFormatters['formatDisplayName']

    beforeEach(() => {
      // @ts-ignore
      formatDisplayName = formatDisplayNameFn.bind(
        null,
        config,
        getDisplayNames
      )
    })

    it('should return locale display name as string', function () {
      expect(formatDisplayName('zh-Hans-SG', {type: 'language'})).toBe(
        'Chinese (Simplified, Singapore)'
      )
    })

    it('should return dialect locale display name as string', function () {
      expect(
        formatDisplayName('en-GB', {
          type: 'language',
          languageDisplay: 'dialect',
        })
      ).toBe('British English')
    })

    it('should return standard locale display name as string', function () {
      expect(
        formatDisplayName('en-GB', {
          type: 'language',
          languageDisplay: 'standard',
        })
      ).toBe('English (United Kingdom)')
    })

    it('will return undefined if Intl.DisplayName would return undefined', function () {
      const displayName = new (Intl as any).DisplayNames('en', {
        type: 'language',
        fallback: 'none',
      })
      expect(displayName.of('xx-XX')).toBeUndefined()
      expect(
        formatDisplayName('xx-XX', {type: 'language', fallback: 'none'})
      ).toBeUndefined()
    })
  })
})
