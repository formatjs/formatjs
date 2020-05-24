import {getCanonicalLocales} from '../src';

describe('Intl.getCanonicalLocales', () => {
  it('regular', function () {
    expect(
      getCanonicalLocales('en-u-foo-bar-nu-thai-ca-buddhist-kk-true')
    ).toEqual(['en-u-bar-foo-ca-buddhist-kk-nu-thai']);
  });
  it('und-x-private', function () {
    expect(getCanonicalLocales('und-x-private')).toEqual(['und-x-private']);
  });
  // it('canonicalizes twice', function () {
  //   expect(getCanonicalLocales('und-Armn-SU')).toEqual(['ru-Armn-AM']);
  // });
});
