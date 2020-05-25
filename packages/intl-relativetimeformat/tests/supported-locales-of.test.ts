import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-pluralrules/polyfill-locales';
import '../src/polyfill';
import '../polyfill';
import '../dist/locale-data/zh';

describe('supportedLocalesOf', function () {
  const RelativeTimeFormat = (Intl as any).RelativeTimeFormat;
  function test() {
    expect(RelativeTimeFormat.supportedLocalesOf(['zh', 'en-jj'])).toContain(
      'zh'
    );
  }
  if (RelativeTimeFormat.polyfilled) {
    it('should return correct locales that we only have data for', test);
  } else {
    xit('should return correct locales that we only have data for', test);
  }
});
