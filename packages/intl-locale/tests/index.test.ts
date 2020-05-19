import {IntlLocale} from '../src';
import {pegParse} from '../src/unicode-locale-id';

describe('intl-locale', () => {
  it('ast', function() {
    expect(
      pegParse('en-u-foo-bar-nu-thai-ca-buddhist-kk-true')
    ).toMatchSnapshot();
  });
  it('toString', function() {
    // expect(() => IntlLocale.prototype.toString.call(IntlLocale.prototype)).toThrowError(TypeError)
    expect(
      new IntlLocale('en-u-foo-bar-nu-thai-ca-buddhist-kk-true').toString()
    ).toBe('en-u-bar-foo-ca-buddhist-kk-nu-thai');
  });
  it.skip('canonicalizes twice', function() {
    expect(new IntlLocale('und-Armn-SU', {language: 'ru'}).toString()).toBe(
      'ru-Armn-AM'
    );
  });
});
