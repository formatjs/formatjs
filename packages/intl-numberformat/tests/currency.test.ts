import 'core-js/features/set';
import '@formatjs/intl-pluralrules/polyfill-locales';
import {NumberFormat, NumberFormatOptions} from '../src';

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
  NumberFormat.__addLocaleData(require(`./locale-data/${locale}.json`));
});

const SIGN_DISPLAYS: Array<NumberFormatOptions['signDisplay']> = [
  'auto',
  'always',
  'never',
  'exceptZero',
];
const NOTATIONS: Array<NumberFormatOptions['notation']> = [
  'engineering',
  'scientific',
  'standard',
];
const COMPACT_DISPLAYS: Array<NumberFormatOptions['compactDisplay']> = [
  'long',
  'short',
];

const CURRENCY_DISPLAYS: Array<NumberFormatOptions['currencyDisplay']> = [
  'code',
  'symbol',
  'name',
  'narrowSymbol',
];

const CURRENCY_SIGNS: Array<NumberFormatOptions['currencySign']> = [
  'accounting',
  'standard',
];

const CURRENCIES = ['USD', 'GBP', 'ZWD'];

function test() {
  LOCALES.forEach(locale => {
    describe(`'${locale}',`, function () {
      describe("style: 'currency',", function () {
        CURRENCY_DISPLAYS.forEach(currencyDisplay =>
          describe(`currencyDisplay: '${currencyDisplay}',`, function () {
            CURRENCY_SIGNS.forEach(currencySign =>
              describe(`currencySign: '${currencySign}',`, function () {
                SIGN_DISPLAYS.forEach(signDisplay =>
                  describe(`signDisplay: '${signDisplay}',`, function () {
                    NOTATIONS.forEach(notation =>
                      describe(`notation: '${notation}',`, function () {
                        COMPACT_DISPLAYS.forEach(compactDisplay =>
                          describe(`compactDisplay: '${compactDisplay}',`, function () {
                            CURRENCIES.forEach(currency =>
                              it(`currency: '${currency}',`, function () {
                                expect(
                                  new NumberFormat(locale, {
                                    style: 'currency',
                                    currency,
                                    currencySign,
                                    currencyDisplay,
                                    signDisplay,
                                    notation,
                                    compactDisplay,
                                  }).format(10000)
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
          })
        );
      });
    });
  });
}

// Node v8 does not have format and v12 has native NumberFormat.
describe('Intl.NumberFormat', test);
