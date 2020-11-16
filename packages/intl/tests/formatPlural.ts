/* eslint-disable @typescript-eslint/camelcase */

import {formatPlural as formatPluralFn} from '../src/plural';

import {IntlFormatters, OptionalIntlConfig} from '../src/types';

describe('format API', () => {
  const {NODE_ENV} = process.env;

  let config: OptionalIntlConfig<any>;

  let getPluralRules: any;
  beforeEach(() => {
    config = {
      locale: 'en',

      messages: {},

      defaultLocale: 'en',
      defaultFormats: {},

      onError: jest.fn(),
    };

    getPluralRules = jest
      .fn()
      .mockImplementation((...args) => new Intl.PluralRules(...args));
  });

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV;
  });

  describe('formatPlural()', () => {
    let pf: Intl.PluralRules;
    let formatPlural: IntlFormatters['formatPlural'];

    beforeEach(() => {
      pf = new Intl.PluralRules(config.locale);
      // @ts-ignore
      formatPlural = formatPluralFn.bind(null, config, getPluralRules);
    });

    it('should warn for invalid opt', function () {
      // @ts-ignore
      expect(formatPlural(0, {type: 'invalid'})).toBe('other');
      expect(config.onError as jest.Mock).toHaveBeenCalledTimes(1);
    });

    it('formats falsy values', () => {
      // @ts-ignore
      expect(formatPlural(undefined)).toBe(pf.select(undefined));

      // @ts-ignore
      expect(formatPlural(false)).toBe(pf.select(false));

      // @ts-ignore
      expect(formatPlural(null)).toBe(pf.select(null));

      // @ts-ignore
      expect(formatPlural(NaN)).toBe(pf.select(NaN));

      // @ts-ignore
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

      // @ts-ignore
      expect(formatPlural('0')).toBe(pf.select('0'));
      expect(Number('1')).toBe(1);

      // @ts-ignore
      expect(formatPlural('1')).toBe(pf.select('1'));

      expect(Number('0.1')).toBe(0.1);

      // @ts-ignore
      expect(formatPlural('0.1')).toBe(pf.select('0.1'));
      expect(Number('1.0')).toBe(1.0);

      // @ts-ignore
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
});
