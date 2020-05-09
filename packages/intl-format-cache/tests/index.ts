import '@formatjs/intl-pluralrules/polyfill-locales';
import '@formatjs/intl-relativetimeformat/polyfill-locales';
import memoizeFormatConstructor from '..';

describe('intl-format-cache', function () {
  it('has a function as the default export', function () {
    expect(typeof memoizeFormatConstructor).toBe('function');
  });

  describe('Intl built-ins', function () {
    describe('Intl.DateTimeFormat', function () {
      const getDateTimeFormat = memoizeFormatConstructor(Intl.DateTimeFormat);

      it('memoizes Intl.DateTimeFormat', function () {
        const df = getDateTimeFormat('en');

        expect(df.resolvedOptions().locale).toEqual('en');
        // Lack of tz support, so just check that it returns a string.
        expect(typeof df.format(0)).toBe('string');

        expect(getDateTimeFormat('en')).toEqual(df);
        expect(getDateTimeFormat('en', {year: 'numeric'})).not.toEqual(df);
      });
    });

    describe('Intl.NumberFormat', function () {
      const getNumberFormat = memoizeFormatConstructor(Intl.NumberFormat);

      it('memoizes Intl.NumberFormat', function () {
        const nf = getNumberFormat('en');

        expect(nf.resolvedOptions().locale).toEqual('en');
        expect(nf.format(1000)).toEqual('1,000');

        expect(getNumberFormat('en')).toEqual(nf);
        expect(getNumberFormat('en', {style: 'percent'})).not.toEqual(nf);
      });
    });
  });
});
