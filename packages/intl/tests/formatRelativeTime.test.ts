/* eslint-disable @typescript-eslint/camelcase */
import {formatRelativeTime as formatRelativeTimeFn} from '../src/relativeTime';
import {OptionalIntlConfig, IntlFormatters} from '../src/types';
import IntlRelativeTimeFormat from '@formatjs/intl-relativetimeformat';

declare global {
  namespace Intl {
    const RelativeTimeFormat: typeof IntlRelativeTimeFormat;
  }
}

describe('format API', () => {
  const {NODE_ENV} = process.env;

  let config: OptionalIntlConfig<any>;

  let getRelativeTimeFormat: any;
  beforeEach(() => {
    config = {
      locale: 'en',

      messages: {},
      formats: {
        relative: {
          seconds: {
            style: 'narrow',
          },
          // @ts-ignore
          missing: undefined,
        },
      },
      defaultLocale: 'en',
      defaultFormats: {},

      onError: jest.fn(),
    };

    getRelativeTimeFormat = jest
      .fn()
      .mockImplementation((...args) => new Intl.RelativeTimeFormat(...args));
  });

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV;
  });

  describe('formatRelativeTime()', () => {
    let rf: any;
    let formatRelativeTime: IntlFormatters['formatRelativeTime'];

    beforeEach(() => {
      rf = new Intl.RelativeTimeFormat(config.locale, undefined);
      // @ts-ignore
      formatRelativeTime = formatRelativeTimeFn.bind(
        null,
        config,
        getRelativeTimeFormat
      );
    });

    it('falls back and warns when no value is provided', () => {
      // @ts-ignore
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
      // @ts-ignore
      expect(formatRelativeTime(false)).toBe('in 0 seconds');

      // @ts-ignore
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
        // @ts-ignore
        expect(formatRelativeTime(0, 'invalid')).toBe('0');
        expect(
          (config.onError as jest.Mock).mock.calls.map(c => c[0].code)
        ).toMatchSnapshot();
      });

      it('uses configured named formats', () => {
        const format = 'seconds';

        const {locale, formats} = config;

        rf = new Intl.RelativeTimeFormat(locale, formats!.relative![format]);

        expect(formatRelativeTime(-120, 'second', {format})).toBe(
          rf.format(-120, 'second', {style: 'narrow'})
        );
      });

      it('uses named formats as defaults', () => {
        const opts = {numeric: 'auto' as const};
        const format = 'seconds';

        const {locale, formats} = config;
        rf = new Intl.RelativeTimeFormat(locale, {
          ...opts,
          ...formats!.relative![format],
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
});
