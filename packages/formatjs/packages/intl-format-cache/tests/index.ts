import '@formatjs/intl-pluralrules/polyfill-locales';
import '@formatjs/intl-relativetimeformat/polyfill-locales';
import memoizeFormatConstructor from '../src';
import {expect as chaiExpect} from 'chai';

declare var expect: typeof chaiExpect;

describe('intl-format-cache', function() {
  it('has a function as the default export', function() {
    expect(memoizeFormatConstructor).to.be.a('function');
  });

  describe('Intl built-ins', function() {
    describe('Intl.DateTimeFormat', function() {
      var getDateTimeFormat = memoizeFormatConstructor(Intl.DateTimeFormat);

      it('memoizes Intl.DateTimeFormat', function() {
        var df = getDateTimeFormat('en');

        expect(df.resolvedOptions().locale).to.equal('en');
        // Lack of tz support, so just check that it returns a string.
        expect(df.format(0)).to.be.a('string');

        expect(getDateTimeFormat('en')).to.equal(df);
        expect(getDateTimeFormat('en', {year: 'numeric'})).not.to.equal(df);
      });
    });

    describe('Intl.NumberFormat', function() {
      var getNumberFormat = memoizeFormatConstructor(Intl.NumberFormat);

      it('memoizes Intl.NumberFormat', function() {
        var nf = getNumberFormat('en');

        expect(nf.resolvedOptions().locale).to.equal('en');
        expect(nf.format(1000)).to.equal('1,000');

        expect(getNumberFormat('en')).to.equal(nf);
        expect(getNumberFormat('en', {style: 'percent'})).not.to.equal(nf);
      });
    });
  });
});
