import {getCanonicalLocales} from '../';

describe('Intl.getCanonicalLocales', () => {
  it('regular', function () {
    expect(
      getCanonicalLocales('en-u-foo-bar-nu-thai-ca-buddhist-kk-true')
    ).toEqual(['en-u-bar-foo-ca-buddhist-kk-nu-thai']);
  });
  it('und-x-private', function () {
    expect(getCanonicalLocales('und-x-private')).toEqual(['und-x-private']);
  });
  it('should canonicalize casing for zh-hANs-sG', function () {
    expect(getCanonicalLocales('zh-hANs-sG')).toEqual(['zh-Hans-SG']);
  });
  it('should handle zh-TW', function () {
    expect(getCanonicalLocales('zh-TW')).toEqual(['zh-Hant-TW']);
  });
  it('should handle zh-CN', function () {
    expect(getCanonicalLocales('zh-CN')).toEqual(['zh-Hans-CN']);
  });
  it('should handle twi', function () {
    expect(getCanonicalLocales('twi')).toEqual(['ak']);
  });
  it('should handle ug-Arab-CN ', function () {
    expect(getCanonicalLocales('ug-Arab-CN')).toEqual(['ug-CN']);
  });
  it('canonicalizes twice', function () {
    expect(getCanonicalLocales('und-Armn-SU')).toEqual(['und-Armn-AM']);
  });
});
