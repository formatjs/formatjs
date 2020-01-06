import '@formatjs/intl-pluralrules/polyfill-locales';
import {UnifiedNumberFormat} from '../src/core';

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
    ).toEqual(['zh', 'en']);
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

    it('10000', function() {
      expect(
        new UnifiedNumberFormat('th', {
          notation: 'compact',
          signDisplay: 'exceptZero',
          compactDisplay: 'short',
        }).format(10000)
      ).toBe('+10K');
    });

    it('10000 currency', function() {
      expect(
        new UnifiedNumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          currencySign: 'standard',
          signDisplay: 'exceptZero',
          currencyDisplay: 'narrowSymbol',
          notation: 'standard',
          compactDisplay: 'short',
        }).format(10000)
      ).toBe('+$10,000.00');
      expect(
        new UnifiedNumberFormat('en-US', {
          style: 'currency',
          currency: 'ZWD',
          currencySign: 'standard',
          signDisplay: 'exceptZero',
          currencyDisplay: 'narrowSymbol',
          notation: 'compact',
          compactDisplay: 'short',
        }).format(10000)
      ).toBe('+ZWD 10K');
      expect(
        new UnifiedNumberFormat('en-US', {
          style: 'currency',
          currency: 'ZWD',
          currencySign: 'standard',
          signDisplay: 'exceptZero',
          currencyDisplay: 'narrowSymbol',
          notation: 'compact',
          compactDisplay: 'long',
        }).format(10000)
      ).toBe('+ZWD 10K');
      expect(
        new UnifiedNumberFormat('en-US', {
          style: 'currency',
          currency: 'ZWD',
          currencySign: 'standard',
          signDisplay: 'exceptZero',
          currencyDisplay: 'name',
          notation: 'compact',
          compactDisplay: 'long',
        }).format(10000)
      ).toBe('+10 thousand Zimbabwean dollars (1980–2008)');
      expect(
        new UnifiedNumberFormat('uk', {
          style: 'currency',
          currency: 'GBP',
          currencySign: 'standard',
          signDisplay: 'exceptZero',
          currencyDisplay: 'name',
          notation: 'compact',
          compactDisplay: 'short',
        }).format(10000)
      ).toBe('+10 тис. англійських фунтів');
      expect(
        new UnifiedNumberFormat('uk', {
          style: 'currency',
          currency: 'GBP',
          currencySign: 'accounting',
          signDisplay: 'exceptZero',
          currencyDisplay: 'name',
          notation: 'scientific',
          compactDisplay: 'short',
        }).format(10000)
      ).toBe('+1,00Е4 англійського фунта');
    });

    it('10000 currency de compactLong', function() {
      expect(
        new UnifiedNumberFormat('de', {
          style: 'currency',
          currency: 'USD',
          currencySign: 'accounting',
          signDisplay: 'auto',
          currencyDisplay: 'name',
          notation: 'compact',
          compactDisplay: 'long',
        }).format(10000)
      ).toBe('10 Tausend US-Dollar');
    });

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
}

// Node v8 does not have formatToParts and v12 has native NumberFormat.
describe('UnifiedNumberFormat', test);
