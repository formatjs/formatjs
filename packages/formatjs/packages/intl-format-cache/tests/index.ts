
import 'intl-pluralrules';
import '@formatjs/intl-relativetimeformat/polyfill-locales';
import memoizeFormatConstructor from '../src';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import { expect as chaiExpect } from 'chai';

// Bug where this polyfill doesn't handle negative number correctly
const pluralRulesPolyfilledWithAbsBug = new Intl.PluralRules().select(-1) === 'other'

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
        expect(getDateTimeFormat('en', { year: 'numeric' })).not.to.equal(df);
      });
    });

    describe('Intl.NumberFormat', function() {
      var getNumberFormat = memoizeFormatConstructor(Intl.NumberFormat);

      it('memoizes Intl.NumberFormat', function() {
        var nf = getNumberFormat('en');

        expect(nf.resolvedOptions().locale).to.equal('en');
        expect(nf.format(1000)).to.equal('1,000');

        expect(getNumberFormat('en')).to.equal(nf);
        expect(getNumberFormat('en', { style: 'percent' })).not.to.equal(nf);
      });
    });
  });

  describe('IntlMessageFormat', function() {
    var getMessageFormat = memoizeFormatConstructor(IntlMessageFormat);

    it('memoizes IntlMessageFormat', function() {
      var mf = getMessageFormat('foo', 'en');

      expect(mf.resolvedOptions().locale).to.equal('en');
      expect(mf.format()).to.equal('foo');

      expect(getMessageFormat('foo', 'en')).to.equal(mf);
      expect(getMessageFormat('bar', 'en')).not.to.equal(mf);
    });
  });

  describe('IntlRelativeFormat', function() {
    var getRelativeFormat = memoizeFormatConstructor(IntlRelativeFormat);

    it('memoizes IntlRelativeFormat', function() {
      var rf = getRelativeFormat('en');

      expect(rf.resolvedOptions().locale).to.equal('en');
      expect(rf.format(0, { now: 1000 })).to.equal(
        pluralRulesPolyfilledWithAbsBug ? '1 seconds ago' : '1 second ago'
      );

      expect(getRelativeFormat('en')).to.equal(rf);
      expect(getRelativeFormat('en', { units: 'hour' as any })).not.to.equal(
        rf
      );
    });
  });
});
