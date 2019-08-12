import areIntlLocalesSupported from '../src';
import {expect as chaiExpect} from 'chai';

declare var expect: typeof chaiExpect;

describe('exports', function() {
  it('should have a default export function', function() {
    expect(areIntlLocalesSupported).to.be.a('function');
  });
});

describe('areIntlLocalesSupported()', function() {
  const Intl = global.Intl;

  describe('missing Intl', function() {
    beforeEach(function() {
      global.Intl = undefined as any;
    });

    afterEach(function() {
      global.Intl = Intl;
    });

    it('should return `false` for "en"', function() {
      expect(areIntlLocalesSupported('en')).to.be.false;
    });
  });

  it('should return `true` for "en"', function() {
    expect(areIntlLocalesSupported('en')).to.be.true;
  });

  it('should return `true` for "fr"', function() {
    expect(areIntlLocalesSupported('fr')).to.be.true;
  });
});
