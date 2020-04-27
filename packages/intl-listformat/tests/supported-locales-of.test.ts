import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';

describe('supportedLocalesOf', function() {
  const ListFormat = (Intl as any).ListFormat;
  function test() {
    expect(ListFormat.supportedLocalesOf(['zh', 'en-jj'])).toContain('zh');
    expect(ListFormat.supportedLocalesOf('fr')).toEqual([]);
  }
  if (ListFormat.polyfilled) {
    it('should return correct locales that we only have data for', test);
  } else {
    it.skip('should return correct locales that we only have data for', test);
  }
});
