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
  'compact',
  'standard',
];
const UNIT_DISPLAYS: Array<NumberFormatOptions['unitDisplay']> = [
  'long',
  'short',
  'narrow',
];
const COMPACT_DISPLAYS: Array<NumberFormatOptions['compactDisplay']> = [
  'long',
  'short',
];

function test() {
  LOCALES.forEach(locale => {
    describe(locale, function () {
      describe('unit', function () {
        UNIT_DISPLAYS.forEach(unitDisplay =>
          describe(`unitDisplay/${unitDisplay}`, function () {
            SIGN_DISPLAYS.forEach(signDisplay =>
              describe(`signDisplay/${signDisplay}`, function () {
                NOTATIONS.forEach(notation =>
                  describe(`notation/${notation}`, function () {
                    COMPACT_DISPLAYS.forEach(compactDisplay =>
                      it(`compactDisplay/${compactDisplay}`, function () {
                        expect(
                          new NumberFormat(locale, {
                            style: 'unit',
                            unit: 'bit',
                            unitDisplay,
                            signDisplay,
                            notation,
                            compactDisplay,
                          }).formatToParts(10000)
                        ).toMatchSnapshot();
                        expect(
                          new NumberFormat(locale, {
                            style: 'unit',
                            unit: 'celsius',
                            unitDisplay,
                            signDisplay,
                            notation,
                            compactDisplay,
                          }).formatToParts(10000)
                        ).toMatchSnapshot();
                        expect(
                          new NumberFormat(locale, {
                            style: 'unit',
                            unit: 'gallon',
                            unitDisplay,
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
      });
    });
  });
}

// Node v8 does not have formatToParts and v12 has native NumberFormat.
describe('NumberFormat', test);
