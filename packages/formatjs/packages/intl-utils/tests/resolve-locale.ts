import {
  getLocaleHierarchy,
  getAliasesByLang,
  getParentLocalesByLang,
} from '../src';
describe('resolve-locale', function() {
  it('should handle zh-TW', function() {
    expect(
      getLocaleHierarchy(
        'zh-TW',
        getAliasesByLang('zh'),
        getParentLocalesByLang('zh')
      )
    ).to.deep.equal(['zh-TW', 'zh-Hant-TW', 'zh-Hant', 'zh']);
  });
  it('should handle zh-CN', function() {
    expect(
      getLocaleHierarchy(
        'zh-CN',
        getAliasesByLang('zh'),
        getParentLocalesByLang('zh')
      )
    ).to.deep.equal(['zh-CN', 'zh-Hans-CN', 'zh-Hans', 'zh']);
  });
  it('should handle zh-MO', function() {
    expect(
      getLocaleHierarchy(
        'zh-MO',
        getAliasesByLang('zh'),
        getParentLocalesByLang('zh')
      )
    ).to.deep.equal(['zh-MO', 'zh-Hant-MO', 'zh-Hant-HK', 'zh-Hant', 'zh']);
  });
});
