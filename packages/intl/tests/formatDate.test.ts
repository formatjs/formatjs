/* eslint-disable @typescript-eslint/camelcase */
import {formatDate as formatDateFn} from '../src/dateTime';
import {OptionalIntlConfig, IntlFormatters} from '../src/types';

describe('format API', () => {
  const {NODE_ENV} = process.env;

  let config: OptionalIntlConfig<any>;

  let getDateTimeFormat: any;
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
      } as any,

      defaultLocale: 'en',
      defaultFormats: {},

      onError: jest.fn(),
    };

    getDateTimeFormat = jest
      .fn()
      .mockImplementation((...args) => new Intl.DateTimeFormat(...args));
  });

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV;
  });

  describe('formatDate()', () => {
    let df: Intl.DateTimeFormat;
    let formatDate: IntlFormatters['formatDate'];

    beforeEach(() => {
      df = new Intl.DateTimeFormat(config.locale);

      // @ts-ignore
      formatDate = formatDateFn.bind(null, config, getDateTimeFormat);
    });

    it('no value should render today', () => {
      // @ts-ignore
      expect(formatDate()).toBe(df.format());
    });

    it('falls back and warns when a non-finite value is provided', () => {
      expect(formatDate(NaN)).toBe('NaN');
      expect(config.onError as jest.Mock).toHaveBeenCalledTimes(1);
    });

    it('formats falsy finite values', () => {
      // @ts-ignore
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
      // @ts-ignore
      formatDate = formatDateFn.bind(null, config, getDateTimeFormat);
      const wakeDf = new Intl.DateTimeFormat(config.locale, {
        timeZone: 'Pacific/Wake',
      });
      expect(formatDate(timestamp)).toBe(wakeDf.format(timestamp));
      config.timeZone = 'Asia/Shanghai';

      // @ts-ignore
      formatDate = formatDateFn.bind(null, config, getDateTimeFormat);
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
        df = new Intl.DateTimeFormat(locale, formats!.date![format]);

        expect(formatDate(date, {format})).toBe(df.format(date));
      });

      it('uses named formats as defaults', () => {
        const date = new Date();
        const opts = {month: 'numeric'};
        const format = 'year-only';

        const {locale, formats} = config;
        df = new Intl.DateTimeFormat(locale, {
          ...opts,
          ...formats!.date![format],
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
        // @ts-ignore
        formatDate = formatDateFn.bind(null, config, getDateTimeFormat);
        const shanghaiDf = new Intl.DateTimeFormat(config.locale, {
          timeZone: 'Asia/Shanghai',
        });
        expect(formatDate(timestamp, {timeZone: 'Asia/Shanghai'})).toBe(
          shanghaiDf.format(timestamp)
        );
      });
    });
  });
});
