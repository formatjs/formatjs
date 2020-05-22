import {getCanonicalLocales} from '../src';

describe('Intl.getCanonicalLocales', () => {
  it('toString', function() {
    expect(
      getCanonicalLocales('en-u-foo-bar-nu-thai-ca-buddhist-kk-true')
    ).toEqual(['en-u-bar-foo-ca-buddhist-kk-nu-thai']);
  });
  it.skip('canonicalizes twice', function() {
    expect(getCanonicalLocales('und-Armn-SU')).toEqual(['ru-Armn-AM']);
  });
});
