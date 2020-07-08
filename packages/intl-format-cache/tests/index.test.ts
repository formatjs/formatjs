import memoizeFormatConstructor from '../';

describe('intl-format-cache', function () {
  it('has a function as the default export', function () {
    expect(typeof memoizeFormatConstructor).toBe('function');
  });

  describe('Intl built-ins', function () {
    describe('Intl.DateTimeFormat', function () {
      const getDateTimeFormat = memoizeFormatConstructor(Intl.DateTimeFormat);

      it('memoizes Intl.DateTimeFormat', function () {
        const df = getDateTimeFormat('en');

        expect(df.resolvedOptions().locale).toBe('en');
        // Lack of tz support, so just check that it returns a string.
        expect(typeof df.format(0)).toBe('string');

        expect(getDateTimeFormat('en')).toBe(df);
        expect(getDateTimeFormat('en', {year: 'numeric'})).not.toBe(df);
      });
    });

    describe('Intl.NumberFormat', function () {
      const getNumberFormat = memoizeFormatConstructor(Intl.NumberFormat);

      it('memoizes Intl.NumberFormat', function () {
        const nf = getNumberFormat('en');

        expect(nf.resolvedOptions().locale).toBe('en');
        expect(nf.format(1000)).toBe('1,000');

        expect(getNumberFormat('en')).toBe(nf);
        expect(getNumberFormat('en', {style: 'percent'})).not.toBe(nf);
      });
    });
  });
});
