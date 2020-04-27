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
const NOTATIONS: Array<UnifiedNumberFormatOptions['notation']> = [
  'engineering',
  'scientific',
  'compact',
  'standard',
];
const UNIT_DISPLAYS: Array<UnifiedNumberFormatOptions['unitDisplay']> = [
  'long',
  'short',
  'narrow',
];
const COMPACT_DISPLAYS: Array<UnifiedNumberFormatOptions['compactDisplay']> = [
  'long',
  'short',
];

function test() {
  LOCALES.forEach(locale => {
    describe(locale, function() {
      describe('unit', function() {
        UNIT_DISPLAYS.forEach(unitDisplay =>
          describe(`unitDisplay/${unitDisplay}`, function() {
            SIGN_DISPLAYS.forEach(signDisplay =>
              describe(`signDisplay/${signDisplay}`, function() {
                NOTATIONS.forEach(notation =>
                  describe(`notation/${notation}`, function() {
                    COMPACT_DISPLAYS.forEach(compactDisplay =>
                      it(`compactDisplay/${compactDisplay}`, function() {
                        expect(
                          new UnifiedNumberFormat(locale, {
                            style: 'unit',
                            unit: 'bit',
                            unitDisplay,
                            signDisplay,
                            notation,
                            compactDisplay,
                          }).formatToParts(10000)
                        ).toMatchSnapshot();
                        expect(
                          new UnifiedNumberFormat(locale, {
                            style: 'unit',
                            unit: 'celsius',
                            unitDisplay,
                            signDisplay,
                            notation,
                            compactDisplay,
                          }).formatToParts(10000)
                        ).toMatchSnapshot();
                        expect(
                          new UnifiedNumberFormat(locale, {
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
describe('UnifiedNumberFormat', test);
