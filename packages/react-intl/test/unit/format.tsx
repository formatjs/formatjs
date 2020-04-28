/* eslint-disable @typescript-eslint/camelcase */
import * as React from 'react';
import IntlMessageFormat from 'intl-messageformat';
import {parse} from 'intl-messageformat-parser';
import {
  formatDate as formatDateFn,
  formatTime as formatTimeFn,
} from '../../src/formatters/dateTime';
import {formatRelativeTime as formatRelativeTimeFn} from '../../src/formatters/relativeTime';
import {formatNumber as formatNumberFn} from '../../src/formatters/number';
import {formatPlural as formatPluralFn} from '../../src/formatters/plural';
import {formatList as formatListFn} from '../../src/formatters/list';
import {formatDisplayName as formatDisplayNameFn} from '../../src/formatters/displayName';
import {formatMessage as baseFormatMessage} from '../../src/formatters/message';
import {
  IntlFormatters,
  defineMessages,
  defineMessage,
  Formatters,
} from '../../src';
import IntlRelativeFormat from '@formatjs/intl-relativetimeformat';
import IntlListFormat from '@formatjs/intl-listformat';
import {OptionalIntlConfig} from '../../src/components/provider';
declare global {
  namespace Intl {
    const RelativeTimeFormat: typeof IntlRelativeFormat;
    const ListFormat: typeof IntlListFormat;
  }
}

describe('format API', () => {
  const {NODE_ENV} = process.env;

  let config: OptionalIntlConfig;
  let state: Formatters;

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
    };

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
    };
  });

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV;
  });

  it('defineMessages', function () {
    expect(defineMessages({})).toEqual({});
    expect(defineMessages({foo: {}})).toEqual({foo: {}});
  });

  it('defineMessage', function () {
    expect(defineMessage({})).toEqual({});
    expect(defineMessage({foo: {}})).toEqual({foo: {}});
  });

  describe('formatDate()', () => {
    let df: Intl.DateTimeFormat;
    let formatDate: any;

    beforeEach(() => {
      df = new Intl.DateTimeFormat(config.locale);
      formatDate = formatDateFn.bind(null, config, state.getDateTimeFormat);
    });

    it('no value should render today', () => {
      expect(formatDate()).toBe(df.format());
    });

    it('falls back and warns when a non-finite value is provided', () => {
      expect(formatDate(NaN)).toBe('NaN');
      expect(config.onError as jest.Mock).toHaveBeenCalledTimes(1);
    });

    it('formats falsy finite values', () => {
      expect(formatDate(null)).toBe(df.format(null));
      expect(formatDate(0)).toBe(df.format(0));
    });

    it('formats date instance values', () => {
      expect(formatDate(new Date(0))).toBe(df.format(new Date(0)));
    });

    it('formats date string values', () => {
      expect(formatDate(new Date(0).toString())).toBe(df.format(0));
    });

    it('formats date ms timestamp values', () => {
      const timestamp = Date.now();
      expect(formatDate(timestamp)).toBe(df.format(timestamp));
    });

    it('uses the time zone specified by the provider', () => {
      const timestamp = Date.now();
      config.timeZone = 'Pacific/Wake';
      formatDate = formatDateFn.bind(null, config, state.getDateTimeFormat);
      const wakeDf = new Intl.DateTimeFormat(config.locale, {
        timeZone: 'Pacific/Wake',
      });
      expect(formatDate(timestamp)).toBe(wakeDf.format(timestamp));
      config.timeZone = 'Asia/Shanghai';
      formatDate = formatDateFn.bind(null, config, state.getDateTimeFormat);
      const shanghaiDf = new Intl.DateTimeFormat(config.locale, {
        timeZone: 'Asia/Shanghai',
      });
      expect(formatDate(timestamp)).toBe(shanghaiDf.format(timestamp));
    });

    describe('options', () => {
      it('accepts empty options', () => {
        expect(formatDate(0, {})).toBe(df.format(0));
      });

      it('accepts valid Intl.DateTimeFormat options', () => {
        expect(() => formatDate(0, {year: 'numeric'})).not.toThrow();
      });

      it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
        expect(formatDate(0, {year: 'invalid'})).toBe('0');
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('uses configured named formats', () => {
        const date = new Date();
        const format = 'year-only';

        const {locale, formats} = config;
        df = new Intl.DateTimeFormat(locale, formats.date[format]);

        expect(formatDate(date, {format})).toBe(df.format(date));
      });

      it('uses named formats as defaults', () => {
        const date = new Date();
        const opts = {month: 'numeric'};
        const format = 'year-only';

        const {locale, formats} = config;
        df = new Intl.DateTimeFormat(locale, {
          ...opts,
          ...formats.date[format],
        });

        expect(formatDate(date, {...opts, format})).toBe(df.format(date));
      });

      it('handles missing named formats and warns', () => {
        const date = new Date();
        const format = 'missing';

        df = new Intl.DateTimeFormat(config.locale);

        expect(formatDate(date, {format})).toBe(df.format(date));
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('uses time zone specified in options over the one passed through by the provider', () => {
        const timestamp = Date.now();
        config.timeZone = 'Pacific/Wake';
        formatDate = formatDateFn.bind(null, config, state.getDateTimeFormat);
        const shanghaiDf = new Intl.DateTimeFormat(config.locale, {
          timeZone: 'Asia/Shanghai',
        });
        expect(formatDate(timestamp, {timeZone: 'Asia/Shanghai'})).toBe(
          shanghaiDf.format(timestamp)
        );
      });
    });
  });

  describe('formatTime()', () => {
    let df;
    let formatTime;

    beforeEach(() => {
      df = new Intl.DateTimeFormat(config.locale, {
        hour: 'numeric',
        minute: 'numeric',
      });

      formatTime = formatTimeFn.bind(null, config, state.getDateTimeFormat);
    });

    it('render now if no value is provided', () => {
      expect(formatTime()).toBe(df.format());
    });

    it('falls back and warns when a non-finite value is provided', () => {
      expect(formatTime(NaN)).toBe('NaN');
      expect(formatTime('')).toBe(df.format(''));
      expect(config.onError as jest.Mock).toHaveBeenCalledTimes(1);
    });

    it('formats falsy finite values', () => {
      expect(formatTime(false)).toBe(df.format(false));
      expect(formatTime(null)).toBe(df.format(null));
      expect(formatTime(0)).toBe(df.format(0));
    });

    it('formats date instance values', () => {
      expect(formatTime(new Date(0))).toBe(df.format(new Date(0)));
    });

    it('formats date string values', () => {
      expect(formatTime(new Date(0).toString())).toBe(df.format(0));
    });

    it('formats date ms timestamp values', () => {
      const timestamp = Date.now();
      expect(formatTime(timestamp)).toBe(df.format(timestamp));
    });

    it('uses the time zone specified by the provider', () => {
      const timestamp = Date.now();
      config.timeZone = 'Africa/Johannesburg';
      formatTime = formatTimeFn.bind(null, config, state.getDateTimeFormat);
      const johannesburgDf = new Intl.DateTimeFormat(config.locale, {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Africa/Johannesburg',
      });
      expect(formatTime(timestamp)).toBe(johannesburgDf.format(timestamp));
      config.timeZone = 'America/Chicago';
      formatTime = formatTimeFn.bind(null, config, state.getDateTimeFormat);
      const chicagoDf = new Intl.DateTimeFormat(config.locale, {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'America/Chicago',
      });
      expect(formatTime(timestamp)).toBe(chicagoDf.format(timestamp));
    });

    describe('options', () => {
      it('accepts empty options', () => {
        expect(formatTime(0, {})).toBe(df.format(0));
      });

      it('accepts valid Intl.DateTimeFormat options', () => {
        expect(() => formatTime(0, {hour: '2-digit'})).not.toThrow();
      });

      it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
        expect(formatTime(0, {hour: 'invalid'})).toBe('0');
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('uses configured named formats', () => {
        const date = new Date();
        const format = 'hour-only';

        const {locale, formats} = config;
        df = new Intl.DateTimeFormat(locale, formats.time[format]);

        expect(formatTime(date, {format})).toBe(df.format(date));
      });

      it('uses named formats as defaults', () => {
        const date = new Date();
        const opts = {minute: '2-digit'};
        const format = 'hour-only';

        const {locale, formats} = config;
        df = new Intl.DateTimeFormat(locale, {
          ...opts,
          ...formats.time[format],
        });

        expect(formatTime(date, {...opts, format})).toBe(df.format(date));
      });

      it('handles missing named formats and warns', () => {
        const date = new Date();
        const format = 'missing';

        expect(formatTime(date, {format})).toBe(df.format(date));
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('should set default values', () => {
        const date = new Date();
        const {locale} = config;
        const day = 'numeric';
        df = new Intl.DateTimeFormat(locale, {
          hour: 'numeric',
          minute: 'numeric',
          day,
        });
        expect(formatTime(date, {day})).toBe(df.format(date));
      });

      it('should not set default values when second is provided', () => {
        const date = new Date();
        const {locale} = config;
        const second = 'numeric';
        df = new Intl.DateTimeFormat(locale, {second});
        expect(formatTime(date, {second})).toBe(df.format(date));
      });

      it('should not set default values when minute is provided', () => {
        const date = new Date();
        const {locale} = config;
        const minute = 'numeric';
        df = new Intl.DateTimeFormat(locale, {minute});
        expect(formatTime(date, {minute})).toBe(df.format(date));
      });

      it('should not set default values when hour is provided', () => {
        const date = new Date();
        const {locale} = config;
        const hour = 'numeric';
        df = new Intl.DateTimeFormat(locale, {hour});
        expect(formatTime(date, {hour})).toBe(df.format(date));
      });

      it('uses time zone specified in options over the one passed through by the provider', () => {
        const timestamp = Date.now();
        config.timeZone = 'Africa/Johannesburg';
        formatTime = formatTimeFn.bind(null, config, state.getDateTimeFormat);
        const chicagoDf = new Intl.DateTimeFormat(config.locale, {
          hour: 'numeric',
          minute: 'numeric',
          timeZone: 'America/Chicago',
        });
        expect(formatTime(timestamp, {timeZone: 'America/Chicago'})).toBe(
          chicagoDf.format(timestamp)
        );
      });
    });
  });

  describe('formatRelativeTime()', () => {
    let rf;
    let formatRelativeTime;

    beforeEach(() => {
      rf = new Intl.RelativeTimeFormat(config.locale, undefined);
      formatRelativeTime = formatRelativeTimeFn.bind(
        null,
        config,
        state.getRelativeTimeFormat
      );
    });

    it('falls back and warns when no value is provided', () => {
      expect(formatRelativeTime()).toBe('undefined');
      expect(
        (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
      ).toMatchSnapshot();
    });

    it('falls back and warns when a non-finite value is provided', () => {
      expect(formatRelativeTime(NaN)).toBe('NaN');
      expect(config.onError as jest.Mock).toHaveBeenCalledTimes(1);
    });

    it('formats falsy finite values', () => {
      expect(formatRelativeTime(false)).toBe('in 0 seconds');
      expect(formatRelativeTime(null)).toBe('in 0 seconds');
      expect(formatRelativeTime(0)).toBe(rf.format(0, 'second'));
    });

    it('formats with short format', () => {
      expect(formatRelativeTime(-59, 'second', {style: 'short'})).toBe(
        '59 sec. ago'
      );
    });

    describe('options', () => {
      it('accepts empty options', () => {
        expect(formatRelativeTime(0, 'second', {})).toBe(
          rf.format(0, 'second')
        );
      });

      it('accepts valid IntlRelativeFormat options', () => {
        expect(() =>
          formatRelativeTime(0, 'second', {numeric: 'auto'})
        ).not.toThrow();
        expect(() =>
          formatRelativeTime(0, 'second', {style: 'short'})
        ).not.toThrow();
      });

      it('falls back and warns on invalid IntlRelativeFormat options', () => {
        expect(formatRelativeTime(0, 'invalid')).toBe('0');
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('uses configured named formats', () => {
        const format = 'seconds';

        const {locale, formats} = config;
        rf = new Intl.RelativeTimeFormat(locale, formats.relative[format]);

        expect(formatRelativeTime(-120, 'second', {format})).toBe(
          rf.format(-120, 'second', {style: 'narrow'})
        );
      });

      it('uses named formats as defaults', () => {
        const opts = {numeric: 'auto' as 'auto'};
        const format = 'seconds';

        const {locale, formats} = config;
        rf = new Intl.RelativeTimeFormat(locale, {
          ...opts,
          ...formats.relative[format],
        });

        expect(formatRelativeTime(0, 'minute', {...opts, format})).toBe(
          rf.format(0, 'minute', {numeric: 'auto'})
        );
      });

      it('handles missing named formats and warns', () => {
        const format = 'missing';

        rf = new Intl.RelativeTimeFormat(config.locale, undefined);

        expect(formatRelativeTime(-1, 'second', {format})).toBe(
          rf.format(-1, 'second')
        );
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });
    });
  });

  describe('formatNumber()', () => {
    let nf;
    let formatNumber;

    beforeEach(() => {
      nf = new Intl.NumberFormat(config.locale);
      formatNumber = formatNumberFn.bind(null, config, state.getNumberFormat);
    });

    it('returns "NaN" when no value is provided', () => {
      expect(nf.format()).toBe('NaN');
      expect(formatNumber()).toBe('NaN');
    });

    it('returns "NaN" when a non-number value is provided', () => {
      expect(nf.format(NaN)).toBe('NaN');
      expect(formatNumber(NaN)).toBe('NaN');
    });

    it('formats falsy values', () => {
      expect(formatNumber(false)).toBe(nf.format(false));
      expect(formatNumber(null)).toBe(nf.format(null));
      expect(formatNumber('')).toBe(nf.format(''));
      expect(formatNumber(0)).toBe(nf.format(0));
    });

    it('formats number values', () => {
      expect(formatNumber(1000)).toBe(nf.format(1000));
      expect(formatNumber(1.1)).toBe(nf.format(1.1));
    });

    it('formats string values parsed as numbers', () => {
      expect(Number('1000')).toBe(1000);
      expect(formatNumber('1000')).toBe(nf.format('1000'));
      expect(Number('1.10')).toBe(1.1);
      expect(formatNumber('1.10')).toBe(nf.format('1.10'));
    });

    describe('options', () => {
      it('accepts empty options', () => {
        expect(formatNumber(1000, {})).toBe(nf.format(1000));
      });

      it('accepts valid Intl.NumberFormat options', () => {
        expect(() => formatNumber(0, {style: 'percent'})).not.toThrow();
      });

      it('falls back and warns on invalid Intl.NumberFormat options', () => {
        expect(formatNumber(0, {style: 'invalid'})).toBe(String(0));
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('uses configured named formats', () => {
        const num = 0.505;
        const format = 'percent';

        const {locale, formats} = config;
        nf = new Intl.NumberFormat(locale, formats.number[format]);

        expect(formatNumber(num, {format})).toBe(nf.format(num));
      });

      it('uses named formats as defaults', () => {
        const num = 0.500059;
        const opts = {maximumFractionDigits: 3};
        const format = 'percent';

        const {locale, formats} = config;
        nf = new Intl.NumberFormat(locale, {
          ...opts,
          ...formats.number[format],
        });

        expect(formatNumber(num, {...opts, format})).toBe(nf.format(num));
      });

      it('handles missing named formats and warns', () => {
        const num = 1000;
        const format = 'missing';

        nf = new Intl.NumberFormat(config.locale);

        expect(formatNumber(num, {format})).toBe(nf.format(num));
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });
    });
  });

  describe('formatPlural()', () => {
    let pf;
    let formatPlural;

    beforeEach(() => {
      pf = new Intl.PluralRules(config.locale);
      formatPlural = formatPluralFn.bind(null, config, state.getPluralRules);
    });

    it('should warn for invalid opt', function () {
      expect(formatPlural(0, {type: 'invalid'})).toBe('other');
      expect(config.onError as jest.Mock).toHaveBeenCalledTimes(1);
    });

    it('formats falsy values', () => {
      expect(formatPlural(undefined)).toBe(pf.select(undefined));
      expect(formatPlural(false)).toBe(pf.select(false));
      expect(formatPlural(null)).toBe(pf.select(null));
      expect(formatPlural(NaN)).toBe(pf.select(NaN));
      expect(formatPlural('')).toBe(pf.select(''));
      expect(formatPlural(0)).toBe(pf.select(0));
    });

    it('formats integer values', () => {
      expect(formatPlural(0)).toBe(pf.select(0));
      expect(formatPlural(1)).toBe(pf.select(1));
      expect(formatPlural(2)).toBe(pf.select(2));
    });

    it('formats decimal values', () => {
      expect(formatPlural(0.1)).toBe(pf.select(0.1));
      expect(formatPlural(1.0)).toBe(pf.select(1.0));
      expect(formatPlural(1.1)).toBe(pf.select(1.1));
    });

    it('formats string values parsed as numbers', () => {
      expect(Number('0')).toBe(0);
      expect(formatPlural('0')).toBe(pf.select('0'));
      expect(Number('1')).toBe(1);
      expect(formatPlural('1')).toBe(pf.select('1'));

      expect(Number('0.1')).toBe(0.1);
      expect(formatPlural('0.1')).toBe(pf.select('0.1'));
      expect(Number('1.0')).toBe(1.0);
      expect(formatPlural('1.0')).toBe(pf.select('1.0'));
    });

    describe('options', () => {
      it('accepts empty options', () => {
        expect(formatPlural(0, {})).toBe(pf.select(0));
      });

      it('accepts valid IntlPluralFormat options', () => {
        expect(() => formatPlural(22, {type: 'ordinal'})).not.toThrow();
      });

      describe('ordinals', () => {
        it('formats using ordinal plural rules', () => {
          const opts = {type: 'ordinal'} as Intl.PluralRulesOptions;
          pf = new Intl.PluralRules(config.locale, opts);

          expect(formatPlural(22, opts)).toBe(pf.select(22));
        });
      });
    });
  });

  describe('formatMessage()', () => {
    let formatMessage;

    beforeEach(() => {
      formatMessage = baseFormatMessage.bind(null, config, state);
    });
    [`Hello, World!'{foo}'`, `'\ud83d'\udc04`].forEach(msg =>
      it(`should render escaped msg ${msg} properly in production`, () => {
        process.env.NODE_ENV = 'production';

        const descriptor = {
          id: 'hello',
          defaultMessage: msg,
        };

        const mf = new IntlMessageFormat(msg, 'en');

        expect(formatMessage(descriptor)).toBe(mf.format());
      })
    );

    it('throws when no Message Descriptor is provided', () => {
      expect(() => formatMessage()).toThrow(
        '[React Intl] An `id` must be provided to format a message.'
      );
    });

    it('throws when Message Descriptor `id` is missing or falsy', () => {
      expect(() => formatMessage({})).toThrow(
        '[React Intl] An `id` must be provided to format a message.'
      );
      [undefined, null, false, 0, ''].forEach(id => {
        expect(() => formatMessage({id})).toThrow(
          '[React Intl] An `id` must be provided to format a message.'
        );
      });
    });

    it('formats basic messages', () => {
      const {locale, messages} = config;
      const mf = new IntlMessageFormat(messages.no_args, locale);

      expect(formatMessage({id: 'no_args'})).toBe(mf.format());
    });

    it('formats rich text messages w/ wrapRichTextChunksInFragment', () => {
      formatMessage = baseFormatMessage.bind(
        null,
        {...config, wrapRichTextChunksInFragment: true},
        state
      );
      const {locale, messages} = config;
      const values = {b: (...chunks) => <b>{chunks}</b>};
      expect(formatMessage({id: 'richText'}, values)).toMatchSnapshot();
    });

    it('formats rich text messages w/o wrapRichTextChunksInFragment', () => {
      const {locale, messages} = config;
      const mf = new IntlMessageFormat(messages.richText, locale);
      const values = {b: (...chunks) => <b>{chunks}</b>};
      expect(formatMessage({id: 'richText'}, values)).toMatchSnapshot();
    });

    it('formats basic AST messages', () => {
      const {locale, messages} = config;
      const mf = new IntlMessageFormat(messages.ast_simple, locale);

      expect(formatMessage({id: 'ast_simple'})).toBe(mf.format());
    });

    it('formats basic AST messages in prod', () => {
      const {locale, messages} = config;
      const mf = new IntlMessageFormat(messages.ast_simple, locale);
      process.env.NODE_ENV = 'production';
      expect(formatMessage({id: 'ast_simple'})).toBe(mf.format());
    });

    it('formats messages with placeholders', () => {
      const {locale, messages} = config;
      const mf = new IntlMessageFormat(messages.with_arg, locale);
      const values = {name: 'Eric'};

      expect(formatMessage({id: 'with_arg'}, values)).toBe(mf.format(values));
    });

    it('formats AST message with placeholders', () => {
      const {locale, messages} = config;
      const mf = new IntlMessageFormat(messages.ast_var, locale);
      const values = {name: 'Eric'};

      expect(formatMessage({id: 'ast_var'}, values)).toBe(mf.format(values));
    });

    it('formats messages with named formats', () => {
      const {locale, messages, formats} = config;
      const mf = new IntlMessageFormat(
        messages.with_named_format,
        locale,
        formats
      );
      const values = {now: Date.now()};

      expect(formatMessage({id: 'with_named_format'}, values)).toBe(
        mf.format(values)
      );
    });

    describe('fallbacks', () => {
      it('formats message with missing named formats', () => {
        const {locale, messages} = config;
        const mf = new IntlMessageFormat(messages.missing_named_format, locale);
        const values = {now: Date.now()};

        expect(formatMessage({id: 'missing_named_format'}, values)).toBe(
          mf.format(values)
        );
      });

      it('formats `defaultMessage` when message is missing', () => {
        const {locale, messages} = config;
        const mf = new IntlMessageFormat(messages.with_arg, locale);
        const id = 'missing';
        const values = {name: 'Eric'};

        expect(
          formatMessage(
            {
              id: id,
              defaultMessage: messages.with_arg,
            },
            values
          )
        ).toBe(mf.format(values));
      });

      it('warns when `message` is missing and locales are different', () => {
        config.locale = 'fr';

        const {locale, messages, defaultLocale} = config;
        const mf = new IntlMessageFormat(messages.with_arg, locale);
        const id = 'missing';
        const values = {name: 'Eric'};

        expect(locale).not.toEqual(defaultLocale);

        expect(
          formatMessage(
            {
              id,
              defaultMessage: messages.with_arg,
            },
            values
          )
        ).toBe(mf.format(values));

        expect((config.onError as jest.Mock).mock.calls.map(c => c[0].code))
          .toMatchInlineSnapshot(`
          Array [
            "MISSING_TRANSLATION",
          ]
        `);
      });

      it('warns when `message` and `defaultMessage` are missing', () => {
        const {messages} = config;
        const id = 'missing';
        const values = {name: 'Eric'};

        expect(
          formatMessage(
            {
              id: id,
              defaultMessage: messages.missing,
            },
            values
          )
        ).toBe(id);

        expect((config.onError as jest.Mock).mock.calls.map(c => c[0].code))
          .toMatchInlineSnapshot(`
Array [
  "MISSING_TRANSLATION",
  "FORMAT_ERROR",
]
`);
      });

      it('formats `defaultMessage` when message has a syntax error', () => {
        const {locale, messages} = config;
        const mf = new IntlMessageFormat(messages.with_arg, locale);
        const id = 'invalid';
        const values = {name: 'Eric'};

        expect(
          formatMessage(
            {
              id: id,
              defaultMessage: messages.with_arg,
            },
            values
          )
        ).toBe(mf.format(values));

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('formats `defaultMessage` when message has missing values', () => {
        const {locale, messages} = config;
        const mf = new IntlMessageFormat(messages.with_arg, locale);
        const id = 'missing_value';
        const values = {name: 'Eric'};

        expect(
          formatMessage(
            {
              id: id,
              defaultMessage: messages.with_arg,
            },
            values
          )
        ).toBe(mf.format(values));

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('returns message source when message and `defaultMessage` have formatting errors', () => {
        const {locale, messages} = config;
        const id = 'missing_value';

        expect(
          formatMessage({
            id: id,
            defaultMessage: messages.invalid,
          })
        ).toBe(messages[id]);
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('returns message source when formatting error and missing `defaultMessage`', () => {
        const {locale, messages} = config;
        const id = 'missing_value';

        expect(
          formatMessage({
            id: id,
            defaultMessage: messages.missing,
          })
        ).toBe(messages[id]);
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('returns `defaultMessage` source when formatting errors and missing message', () => {
        config.locale = 'en-US';

        const {locale, messages} = config;
        const id = 'missing';

        expect(
          formatMessage({
            id: id,
            defaultMessage: messages.invalid,
          })
        ).toBe(messages.invalid);

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('returns message `id` when message and `defaultMessage` are missing', () => {
        const id = 'missing';

        expect(formatMessage({id: id})).toBe(id);

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('returns message `id` when message and `defaultMessage` are empty', () => {
        const {messages} = config;
        const id = 'empty';

        expect(
          formatMessage({
            id: id,
            defaultMessage: messages[id],
          })
        ).toBe(id);

        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });
    });
  });

  describe('formatList()', function () {
    let formatList;

    beforeEach(() => {
      formatList = formatListFn.bind(null, config, state.getListFormat);
    });

    it('should handle regular element', function () {
      expect(formatList(['me', 'myself', 'I'])).toBe('me, myself, and I');
    });
    it('should handle regular element', function () {
      expect(formatList(['me', <b>myself</b>, 'I'])).toEqual([
        'me, ',
        <b>myself</b>,
        ', and I',
      ]);
    });
  });

  describe('formatDisplayName()', function () {
    let formatDisplayName!: IntlFormatters['formatDisplayName'];

    beforeEach(() => {
      formatDisplayName = formatDisplayNameFn.bind(
        null,
        config,
        state.getDisplayNames
      );
    });

    it('should return locale display name as string', function () {
      expect(formatDisplayName('zh-Hans-SG')).toBe(
        'Simplified Chinese (Singapore)'
      );
    });

    it('will return undefined if Intl.DisplayName would return undefined', function () {
      const displayName = new (Intl as any).DisplayNames('en', {
        fallback: 'none',
      });
      expect(displayName.of('xx-XX')).toBeUndefined();
      expect(formatDisplayName('xx-XX', {fallback: 'none'})).toBeUndefined();
    });
  });
});
