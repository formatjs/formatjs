/* eslint-disable @typescript-eslint/camelcase */
import '@formatjs/intl-displaynames/polyfill-locales';
import {formatDisplayName as formatDisplayNameFn} from '../src/displayName';
import {OptionalIntlConfig, IntlFormatters} from '../src/types';

describe('format API', () => {
  const {NODE_ENV} = process.env;

  let config: OptionalIntlConfig<any>;
  let getDisplayNames: any;
  beforeEach(() => {
    config = {
      locale: 'en',

      messages: {},

      defaultLocale: 'en',
      defaultFormats: {},

      onError: jest.fn(),
    };

    getDisplayNames = jest
      .fn()
      .mockImplementation((...args) => new (Intl as any).DisplayNames(...args));
  });

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV;
  });

  describe('formatDisplayNames()', function () {
    let formatDisplayName!: IntlFormatters['formatDisplayName'];

    beforeEach(() => {
      // @ts-ignore
      formatDisplayName = formatDisplayNameFn.bind(
        null,
        config,
        getDisplayNames
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
