import {
  getLocaleHierarchy,
  getAliasesByLang,
  getParentLocalesByLang,
  unpackData,
} from '../';

describe('resolve-locale', function () {
  it('should handle zh-TW', function () {
    expect(
      getLocaleHierarchy(
        'zh-TW',
        getAliasesByLang('zh'),
        getParentLocalesByLang('zh')
      )
    ).toEqual(['zh-TW', 'zh-Hant-TW', 'zh-Hant', 'zh']);
  });
  it('should handle zh-CN', function () {
    expect(
      getLocaleHierarchy(
        'zh-CN',
        getAliasesByLang('zh'),
        getParentLocalesByLang('zh')
      )
    ).toEqual(['zh-CN', 'zh-Hans-CN', 'zh-Hans', 'zh']);
  });
  it('should handle zh-MO', function () {
    expect(
      getLocaleHierarchy(
        'zh-MO',
        getAliasesByLang('zh'),
        getParentLocalesByLang('zh')
      )
    ).toEqual(['zh-MO', 'zh-Hant-MO', 'zh-Hant-HK', 'zh-Hant', 'zh']);
  });
  it('unpackData', function () {
    expect(
      unpackData('en-US', {
        data: {
          en: {
            units: {
              degree: 1,
            },
            currencies: {
              USD: 'dollar',
            },
            numbers: {
              nu: ['foo'],
              patterns: {
                foo: 1,
              },
            },
          },
          'en-US': {
            numbers: {
              patterns: {
                foo: 1,
              },
            },
          },
        },
        aliases: {},
        availableLocales: ['en-US', 'en-AI', 'en'],
        parentLocales: {
          'en-US': 'en',
        },
      })
    ).toEqual({
      currencies: {
        USD: 'dollar',
      },
      numbers: {
        patterns: {
          foo: 1,
        },
      },
      units: {
        degree: 1,
      },
    });
  });
});
