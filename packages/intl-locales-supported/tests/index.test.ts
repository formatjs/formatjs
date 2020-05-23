import areIntlLocalesSupported from '../src';

describe('exports', function () {
  it('should have a default export function', function () {
    expect(typeof areIntlLocalesSupported).toBe('function');
  });
});

describe('areIntlLocalesSupported()', function () {
  const Intl = global.Intl;

  describe('missing Intl', function () {
    beforeEach(function () {
      global.Intl = undefined as any;
    });

    afterEach(function () {
      global.Intl = Intl;
    });

    it('should return `false` for "en"', function () {
      expect(areIntlLocalesSupported('en')).toBeFalsy();
    });
  });

  describe('polyfill', function () {
    const NumberFormat = global.Intl.NumberFormat;
    beforeEach(function () {
      global.Intl.NumberFormat = {
        supportedLocalesOf() {
          return [];
        },
      } as any;
    });

    afterEach(function () {
      global.Intl.NumberFormat = NumberFormat;
    });

    it('should return `true` for "en" after polyfill', function () {
      expect(areIntlLocalesSupported('en')).toBeFalsy();
      global.Intl.NumberFormat = NumberFormat;
      expect(areIntlLocalesSupported('en')).toBeTruthy();
    });
  });

  it('should return `true` for "en"', function () {
    expect(areIntlLocalesSupported('en')).toBeTruthy();
  });

  it('should return `true` for "fr"', function () {
    expect(areIntlLocalesSupported('fr')).toBeTruthy();
  });
});
