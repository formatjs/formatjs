/* eslint-disable @typescript-eslint/camelcase */
import {parse} from '@formatjs/icu-messageformat-parser'
import IntlMessageFormat from 'intl-messageformat'
import {formatMessage as baseFormatMessage} from '../src/message'
import {Formatters, IntlConfig, IntlFormatters} from '../src/types'

describe('format API', () => {
  const {NODE_ENV} = process.env

  let config: IntlConfig<any>
  let state: Formatters

  beforeEach(() => {
    config = {
      locale: 'en',

      messages: {
        no_args: 'Hello, World!',
        with_arg: 'Hello, {name}!',
        with_named_format: 'It is {now, date, year_only}',
        with_html: 'Hello, <b>{name}</b>!',

        missing: undefined as any,
        empty: '',
        invalid: 'invalid {}',
        missing_value: 'missing {arg_missing}',
        missing_named_format: 'missing {now, date, format_missing}',
        richText: 'rich <b>text</b>',
        ast_simple: parse('hello world'),
        ast_var: parse('hello there, {name}'),
      } as Record<string, any>,

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

    state = {
      getDateTimeFormat: jest
        .fn()
        .mockImplementation((...args) => new Intl.DateTimeFormat(...args)),
      getNumberFormat: jest
        .fn()
        .mockImplementation((...args) => new Intl.NumberFormat(...args)),
      getMessageFormat: jest
        .fn()
        .mockImplementation(
          (msg, ...args) => new IntlMessageFormat(msg, ...args)
        ),
      getRelativeTimeFormat: jest
        .fn()
        .mockImplementation((...args) => new Intl.RelativeTimeFormat(...args)),
      getPluralRules: jest
        .fn()
        .mockImplementation((...args) => new Intl.PluralRules(...args)),
      getListFormat: jest
        .fn()
        .mockImplementation((...args) => new Intl.ListFormat(...args)),
      getDisplayNames: jest
        .fn()
        .mockImplementation(
          (...args) => new (Intl as any).DisplayNames(...args)
        ),
    }
  })

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV
  })

  describe('formatMessage()', () => {
    let formatMessage: IntlFormatters['formatMessage']

    beforeEach(() => {
      // @ts-ignore
      formatMessage = baseFormatMessage.bind(null, config, state)
    })
    it('should hot path message without values', function () {
      ;(state.getMessageFormat as jest.Mock).mockClear()
      expect(formatMessage({id: 'no_args'})).toBe('Hello, World!')
      expect(state.getMessageFormat).not.toHaveBeenCalled()
      expect(formatMessage({id: 'with_arg'}, {name: 'foo'})).toBe('Hello, foo!')
      expect(state.getMessageFormat).toHaveBeenCalled()
    })
    it('should hot path message without values', function () {
      ;(state.getMessageFormat as jest.Mock).mockClear()
      const err = jest.spyOn(console, 'error')
      expect(formatMessage({id: 'no_args'})).toBe('Hello, World!')
      expect(err).not.toHaveBeenCalled()
    })
    it('should not crash of messages does not have Object.prototype', function () {
      const messages = Object.create(null)
      messages!.no_args = 'Hello'
      // @ts-ignore
      formatMessage = baseFormatMessage.bind(
        null,
        {
          ...config,
          messages,
        },
        state
      )
      expect(() => formatMessage({id: 'no_args'})).not.toThrow()
      expect(formatMessage({id: 'no_args'})).toBe('Hello')
    })
    ;[`Hello, World!'{foo}'`, `'\ud83d'\udc04`].forEach(msg =>
      it(`should render escaped msg ${msg} properly in production`, () => {
        process.env.NODE_ENV = 'production'

        const descriptor = {
          id: 'hello',
          defaultMessage: msg,
        }

        const mf = new IntlMessageFormat(msg, 'en')

        expect(formatMessage(descriptor)).toBe(mf.format())
      })
    )

    it('throws when no Message Descriptor is provided', () => {
      // @ts-ignore
      expect(() => formatMessage()).toThrow(
        '[@formatjs/intl] An `id` must be provided to format a message.'
      )
    })

    it('throws when Message Descriptor `id` is missing or falsy', () => {
      expect(() => formatMessage({})).toThrow(
        '[@formatjs/intl] An `id` must be provided to format a message.'
      )
      ;[undefined, null, false, 0, ''].forEach(id => {
        // @ts-ignore
        expect(() => formatMessage({id})).toThrow(
          '[@formatjs/intl] An `id` must be provided to format a message.'
        )
      })
    })

    it('formats basic messages', () => {
      const {locale, messages} = config
      const mf = new IntlMessageFormat(messages!.no_args, locale)

      expect(formatMessage({id: 'no_args'})).toBe(mf.format())
    })

    it('formats basic message with preparsed defaultMessage', () => {
      const {locale, messages} = config
      const mf = new IntlMessageFormat(messages!.ast_var, locale)

      expect(
        formatMessage(
          {id: 'foo', defaultMessage: messages!.ast_var},
          {
            name: 'hey',
          }
        )
      ).toBe(
        mf.format({
          name: 'hey',
        })
      )
    })

    it('formats message with ID as a method in Object.prototype, GH issue #1885', () => {
      expect(formatMessage({id: 'toString'})).toBe('toString')
      expect(formatMessage({id: '__proto__'})).toBe('__proto__')
    })

    it('formats legacy HTML messages', () => {
      const {locale, messages} = config
      const mf = new IntlMessageFormat(messages!.richText, locale)
      const values = {
        b: (s: string) => `<foobar>${s}</foobar>`,
      }
      expect(formatMessage({id: 'richText'}, values)).toBe(
        // @ts-ignore
        mf.format<string>(values)
      )
    })

    it('formats basic AST messages', () => {
      const {locale, messages} = config
      const mf = new IntlMessageFormat(messages!.ast_simple, locale)

      expect(formatMessage({id: 'ast_simple'})).toBe(mf.format())
    })

    it('formats basic AST messages in prod', () => {
      const {locale, messages} = config
      const mf = new IntlMessageFormat(messages!.ast_simple, locale)
      process.env.NODE_ENV = 'production'
      expect(formatMessage({id: 'ast_simple'})).toBe(mf.format())
    })

    it('formats messages with placeholders', () => {
      const {locale, messages} = config
      const mf = new IntlMessageFormat(messages!.with_arg, locale)
      const values = {name: 'Eric'}

      expect(formatMessage({id: 'with_arg'}, values)).toBe(mf.format(values))
    })

    it('formats AST message with placeholders', () => {
      const {locale, messages} = config
      const mf = new IntlMessageFormat(messages!.ast_var, locale)
      const values = {name: 'Eric'}

      expect(formatMessage({id: 'ast_var'}, values)).toBe(mf.format(values))
    })

    it('formats messages with named formats', () => {
      const {locale, messages, formats} = config
      const mf = new IntlMessageFormat(
        messages!.with_named_format,
        locale,
        formats
      )
      const values = {now: Date.now()}

      expect(formatMessage({id: 'with_named_format'}, values)).toBe(
        mf.format(values)
      )
    })

    describe('fallbacks', () => {
      it('formats message with missing named formats', () => {
        const {locale, messages} = config
        const mf = new IntlMessageFormat(messages!.missing_named_format, locale)
        const values = {now: Date.now()}

        expect(formatMessage({id: 'missing_named_format'}, values)).toBe(
          mf.format(values)
        )
      })

      it('formats `defaultMessage` when message is missing', () => {
        const {locale, messages} = config
        const mf = new IntlMessageFormat(messages!.with_arg, locale)
        const id = 'missing'
        const values = {name: 'Eric'}

        expect(
          formatMessage(
            {
              id: id,
              defaultMessage: messages!.with_arg,
            },
            values
          )
        ).toBe(mf.format(values))
      })

      it('warns when `message` is missing and locales are different', () => {
        config.locale = 'fr'

        const {locale, messages, defaultLocale} = config
        const mf = new IntlMessageFormat(messages!.with_arg, locale)
        const id = 'missing'
        const values = {name: 'Eric'}

        expect(locale).not.toEqual(defaultLocale)

        expect(
          formatMessage(
            {
              id,
              defaultMessage: messages!.with_arg,
            },
            values
          )
        ).toBe(mf.format(values))

        expect((config.onError as jest.Mock).mock.calls.map(c => c[0].code))
          .toMatchInlineSnapshot(`
          [
            "MISSING_TRANSLATION",
          ]
        `)
      })

      it('warns when `message` and `defaultMessage` are missing', () => {
        const {messages} = config
        const id = 'missing'
        const values = {name: 'Eric'}

        expect(
          formatMessage(
            {
              id: id,
              defaultMessage: messages!.missing,
            },
            values
          )
        ).toBe(id)

        expect((config.onError as jest.Mock).mock.calls.map(c => c[0].code))
          .toMatchInlineSnapshot(`
          [
            "MISSING_TRANSLATION",
          ]
        `)
      })

      it('formats `defaultMessage` when message has a syntax error', () => {
        const {locale, messages} = config
        const mf = new IntlMessageFormat(messages!.with_arg, locale)
        const id = 'invalid'
        const values = {name: 'Eric'}

        expect(
          formatMessage(
            {
              id: id,
              defaultMessage: messages!.with_arg,
            },
            values
          )
        ).toBe(mf.format(values))

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('formats `defaultMessage` when message has missing values', () => {
        const {locale, messages} = config
        const mf = new IntlMessageFormat(messages!.with_arg, locale)
        const id = 'missing_value'
        const values = {name: 'Eric'}

        expect(
          formatMessage(
            {
              id: id,
              defaultMessage: messages!.with_arg,
            },
            values
          )
        ).toBe(mf.format(values))

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('returns message source when message and `defaultMessage` have formatting errors', () => {
        const {messages} = config
        const id = 'missing_value'

        expect(
          formatMessage(
            {
              id,
              defaultMessage: messages!.invalid,
            },
            {
              foo: 1,
            }
          )
        ).toBe(messages![id])
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('returns message source when formatting error and missing `defaultMessage`', () => {
        const {messages} = config
        const id = 'missing_value'

        expect(
          formatMessage(
            {
              id,
              defaultMessage: messages!.missing,
            },
            {foo: 1}
          )
        ).toBe(messages![id])
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('returns `defaultMessage` source when formatting errors and missing message', () => {
        config.locale = 'en-US'

        const {messages} = config
        const id = 'missing'

        expect(
          formatMessage({
            id,
            defaultMessage: messages!.invalid,
          })
        ).toBe(messages!.invalid)

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('returns message `id` when message and `defaultMessage` are missing', () => {
        const id = 'missing'

        expect(formatMessage({id})).toBe(id)

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('returns an empty string when `fallbackOnEmptyString` is false', () => {
        config.fallbackOnEmptyString = false
        const id = 'empty'

        expect(formatMessage({id})).toBe('')
      })

      it('does not return an empty string when `fallbackOnEmptyString` is true', () => {
        config.fallbackOnEmptyString = true
        const id = 'empty'

        expect(formatMessage({id})).toBe(id)
      })

      it('returns message `id` when message and `defaultMessage` are empty', () => {
        const {messages} = config
        const id = 'empty'

        expect(
          formatMessage({
            id: id,
            defaultMessage: messages![id],
          })
        ).toBe(id)

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot()
      })

      it('allow passing Intl.MessageFormat opts in', function () {
        const {locale, messages, formats} = config
        const opts = {
          ignoreTag: true,
        }
        const mf = new IntlMessageFormat(
          messages!.richText,
          locale,
          formats,
          opts
        )

        expect(formatMessage({id: 'richText'}, opts)).toBe(mf.format())
      })
    })
  })
})
