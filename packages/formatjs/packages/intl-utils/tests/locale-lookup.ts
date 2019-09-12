import {
  findSupportedLocale,
  getParentLocaleHierarchy,
  supportedLocalesOf,
} from '../src';
describe('locale-lookup', function() {
  it('should return empty arr if nothing is supported', function() {
    expect(findSupportedLocale(['zh'], {en: {locale: 'en'}})).to.equal(
      undefined
    );
  });
  it('should filter out unsupported locale', function() {
    expect(findSupportedLocale(['zh', 'en'], {en: {locale: 'en'}})).to.equal(
      'en'
    );
  });
  it('should keep the default locale passed in', function() {
    expect(
      supportedLocalesOf(['en-US'], {en: {foo: 'en'} as any})
    ).to.deep.equal(['en-US']);
  });
  describe('getParentLocaleHierarchy', function() {
    it('should produce the correct hierarchy', function() {
      expect(getParentLocaleHierarchy('pt-GW')).to.deep.equal(['pt-PT', 'pt']);
      expect(getParentLocaleHierarchy('zh-CN')).to.deep.equal([
        'zh-Hans',
        'zh',
      ]);
    });
  });
});
