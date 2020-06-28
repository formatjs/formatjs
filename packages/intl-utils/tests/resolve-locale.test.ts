import {getLocaleHierarchy, unpackData} from '../';

describe('resolve-locale', function () {
  it('should handle zh-TW', function () {
    expect(getLocaleHierarchy('zh-Hant-TW')).toEqual([
      'zh-Hant-TW',
      'zh-Hant',
      'zh',
    ]);
  });
  it('should handle zh-CN', function () {
    expect(getLocaleHierarchy('zh-Hans-CN')).toEqual([
      'zh-Hans-CN',
      'zh-Hans',
      'zh',
    ]);
  });
  it('should handle zh-MO', function () {
    expect(getLocaleHierarchy('zh-Hant-MO')).toEqual([
      'zh-Hant-MO',
      'zh-Hant',
      'zh',
    ]);
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
        availableLocales: ['en-US', 'en-AI', 'en'],
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
