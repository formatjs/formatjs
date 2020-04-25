import '@formatjs/intl-pluralrules/polyfill-locales';
import {UnifiedNumberFormat, UnifiedNumberFormatOptions} from '../src/core';

const LOCALES = [
  'en',
  'en-GB',
  'da',
  'de',
  'es',
  'fr',
  'id',
  'it',
  'ja',
  'ko',
  'ms',
  'nb',
  'nl',
  'pl',
  'pt',
  'ru',
  'sv',
  'th',
  'tr',
  'uk',
  'zh',
  'en-BS',
];

LOCALES.forEach(locale => {
  UnifiedNumberFormat.__addLocaleData(
    require(`../dist/locale-data/${locale}.json`)
  );
});

const SIGN_DISPLAYS: Array<UnifiedNumberFormatOptions['signDisplay']> = [
  'auto',
  'always',
  'never',
  'exceptZero',
];

const COMPACT_DISPLAYS: Array<UnifiedNumberFormatOptions['compactDisplay']> = [
  'long',
  'short',
];

const CURRENCY_DISPLAYS: Array<UnifiedNumberFormatOptions['currencyDisplay']> = [
  'code',
  'symbol',
  'name',
  'narrowSymbol',
];

const CURRENCY_SIGNS: Array<UnifiedNumberFormatOptions['currencySign']> = [
  'accounting',
  'standard',
];

const CURRENCIES = ['USD', 'GBP', 'ZWD'];

function test() {
  LOCALES.forEach(locale => {
    describe(`'${locale}',`, function() {
      describe("style: 'currency',", function() {
        CURRENCY_DISPLAYS.forEach(currencyDisplay =>
          describe(`currencyDisplay: '${currencyDisplay}',`, function() {
            CURRENCY_SIGNS.forEach(currencySign =>
              describe(`currencySign: '${currencySign}',`, function() {
                SIGN_DISPLAYS.forEach(signDisplay =>
                  describe(`signDisplay: '${signDisplay}',`, function() {
                    describe(`notation: 'compact',`, function() {
                      COMPACT_DISPLAYS.forEach(compactDisplay =>
                        describe(`compactDisplay: '${compactDisplay}',`, function() {
                          CURRENCIES.forEach(currency =>
                            it(`currency: '${currency}',`, function() {
                              expect(
                                new UnifiedNumberFormat(locale, {
                                  style: 'currency',
                                  currency,
                                  currencySign,
                                  currencyDisplay,
                                  signDisplay,
                                  notation: 'compact',
                                  compactDisplay,
                                }).format(10000)
                              ).toMatchSnapshot();
                            })
                          );
                        })
                      );
                    });
                  })
                );
              })
            );
          })
        );
      });
    });
  });
}

// Node v8 does not have format and v12 has native NumberFormat.
describe('Intl.NumberFormat', test);
