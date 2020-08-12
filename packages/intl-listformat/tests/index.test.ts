import '@formatjs/intl-getcanonicallocales/polyfill';
import ListFormat from '..';
import * as en from './locale-data/en.json';
import * as enUS from './locale-data/en-US.json';
import * as enAI from './locale-data/en-AI.json';
import * as zh from './locale-data/zh.json';
import * as zhHant from './locale-data/zh-Hant.json';
import * as zhHans from './locale-data/zh-Hans.json';
ListFormat.__addLocaleData(en, enUS, enAI, zh, zhHans, zhHant);

describe('Intl.ListFormat', function () {
  it('should support aliases', function () {
    expect(
      new ListFormat('zh-CN', {type: 'unit'}).format(['1', '2', '3'])
    ).toBe('123');
    expect(new ListFormat('zh-CN', {type: 'unit'}).format(['1', '2'])).toBe(
      '12'
    );
    expect(
      new ListFormat('zh-TW', {type: 'unit'}).format(['1', '2', '3'])
    ).toBe('1 2 3');
    expect(new ListFormat('zh-TW', {type: 'unit'}).format(['1', '2'])).toBe(
      '1 2'
    );
  });
  it('should resolve parent correctly', function () {
    expect(new ListFormat('en-AI').format(['1', '2'])).toBe('1 and 2');
    // Node 12 has an old version of CLDR
    if (process.version && process.version.startsWith('v10')) {
      expect(new ListFormat('en-AI').format(['1', '2', '3'])).toBe(
        '1, 2 and 3'
      );
    }
  });
  it('should normalize case correctly', function () {
    const lf = new ListFormat('en-us', {style: 'short', type: 'unit'});
    expect(lf.resolvedOptions()).toEqual({
      locale: 'en-US',
      type: 'unit',
      style: 'short',
    });
  });
});
