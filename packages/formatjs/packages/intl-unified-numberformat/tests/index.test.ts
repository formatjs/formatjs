import '@formatjs/intl-pluralrules/polyfill-locales';
import {UnifiedNumberFormat, UnifiedNumberFormatOptions} from '../src/core';
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/zh.json'));
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/en.json'));
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/en-US.json'));
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/en-BS.json'));
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/de.json'));

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
  it('should lookup locale correctly', function() {
    expect(
      new UnifiedNumberFormat('en-BS', {
        style: 'unit',
        unit: 'bit',
      }).format(1000)
    ).toBe('1,000 bit');
    expect(
      new UnifiedNumberFormat('en-BS', {
        style: 'unit',
        unit: 'celsius',
      }).format(1000)
    ).toBe('1,000°C');
    expect(
      new UnifiedNumberFormat('en-BS', {
        style: 'unit',
        unit: 'gallon',
      }).format(1000)
    ).toBe('1,000 gal US');
  });

  it('supportedLocalesOf should return correct result based on data loaded', function() {
    expect(
      UnifiedNumberFormat.supportedLocalesOf(['zh', 'en-US', 'af'])
    ).toEqual(['zh', 'en-US']);
    expect(UnifiedNumberFormat.supportedLocalesOf(['af'])).toEqual([]);
  });
  it('should not crash if unit is not specified', function() {
    expect(new UnifiedNumberFormat().resolvedOptions().unit).toBeUndefined();
  });

  // Some test262
  describe('test262 examples', function() {
    const tests = [
      ['0.000345', '345E-6', '3,45E-4'],
      ['0.345', '345E-3', '3,45E-1'],
      ['3.45', '3,45E0', '3,45E0'],
      ['34.5', '34,5E0', '3,45E1'],
      ['543', '543E0', '5,43E2'],
      ['5430', '5,43E3', '5,43E3'],
      ['543000', '543E3', '5,43E5'],
      ['543211.1', '543,211E3', '5,432E5'],
    ];

    for (const [number, engineering, scientific] of tests) {
      it(`number ${number}`, function() {
        const nfEngineering = new UnifiedNumberFormat('de-DE', {
          notation: 'engineering',
        });
        expect(nfEngineering.format(+number)).toBe(engineering);
        const nfScientific = new UnifiedNumberFormat('de-DE', {
          notation: 'scientific',
        });
        expect(nfScientific.format(+number)).toBe(scientific);
      });
    }
  });

  describe('decimal', function() {
    SIGN_DISPLAYS.forEach(signDisplay =>
      describe(`signDisplay/${signDisplay}`, function() {
        NOTATIONS.forEach(notation =>
          describe(`notation/${notation}`, function() {
            COMPACT_DISPLAYS.forEach(compactDisplay =>
              it(`compactDisplay/${compactDisplay}`, function() {
                expect(
                  new UnifiedNumberFormat('en', {
                    style: 'decimal',
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
  });

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
                      new UnifiedNumberFormat('en', {
                        style: 'unit',
                        unit: 'bit',
                        unitDisplay,
                        signDisplay,
                        notation,
                        compactDisplay,
                      }).formatToParts(10000)
                    ).toMatchSnapshot();
                    expect(
                      new UnifiedNumberFormat('en', {
                        style: 'unit',
                        unit: 'celsius',
                        unitDisplay,
                        signDisplay,
                        notation,
                        compactDisplay,
                      }).formatToParts(10000)
                    ).toMatchSnapshot();
                    expect(
                      new UnifiedNumberFormat('en', {
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
                          new UnifiedNumberFormat('en', {
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
                          new UnifiedNumberFormat('en', {
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
                          new UnifiedNumberFormat('en', {
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
}

// Node v8 does not have formatToParts and v12 has native NumberFormat.
describe('UnifiedNumberFormat', test);
