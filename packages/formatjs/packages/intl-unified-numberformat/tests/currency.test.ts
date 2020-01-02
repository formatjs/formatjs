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
  'en-US',
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
const NOTATIONS: Array<UnifiedNumberFormatOptions['notation']> = [
  'engineering',
  'scientific',
  'compact',
  'standard',
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

function test() {
  LOCALES.forEach(locale => {
    describe(locale, function() {
      describe('currency', function() {
        CURRENCY_DISPLAYS.forEach(currencyDisplay =>
          describe(`currencyDisplay/${currencyDisplay}`, function() {
            CURRENCY_SIGNS.forEach(currencySign =>
              describe(`currencySign/${currencySign}`, function() {
                SIGN_DISPLAYS.forEach(signDisplay =>
                  describe(`signDisplay/${signDisplay}`, function() {
                    NOTATIONS.forEach(notation =>
                      describe(`notation/${notation}`, function() {
                        COMPACT_DISPLAYS.forEach(compactDisplay =>
                          it(`compactDisplay/${compactDisplay}`, function() {
                            expect(
                              new UnifiedNumberFormat(locale, {
                                style: 'currency',
                                currency: 'USD',
                                currencySign,
                                currencyDisplay,
                                signDisplay,
                                notation,
                                compactDisplay,
                              }).formatToParts(10000)
                            ).toMatchSnapshot();
                            expect(
                              new UnifiedNumberFormat(locale, {
                                style: 'currency',
                                currency: 'GBP',
                                currencySign,
                                currencyDisplay,
                                signDisplay,
                                notation,
                                compactDisplay,
                              }).formatToParts(-10000)
                            ).toMatchSnapshot();
                            // Fallback to ISO currency code if narrowSymbol is not available.
                            expect(
                              new UnifiedNumberFormat(locale, {
                                style: 'currency',
                                currency: 'ZWD',
                                currencySign,
                                currencyDisplay,
                                signDisplay,
                                notation,
                                compactDisplay,
                              }).formatToParts(10000)
                            ).toMatchSnapshot();
                          })
                        );
                      })
                    );
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

// Node v8 does not have formatToParts and v12 has native NumberFormat.
describe('UnifiedNumberFormat', test);
