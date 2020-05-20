import {Locale} from '../src';
import {parse} from '../src/parser';

describe('intl-locale', () => {
  it('ast', function() {
    expect(parse('en-u-foo-bar-nu-thai-ca-buddhist-kk-true')).toMatchSnapshot();
    expect(parse('da-u-ca-gregory-ca-buddhist')).toMatchSnapshot();
  });
  it('toString', function() {
    // expect(() => IntlLocale.prototype.toString.call(IntlLocale.prototype)).toThrowError(TypeError)
    expect(
      new Locale('en-u-foo-bar-nu-thai-ca-buddhist-kk-true').toString()
    ).toBe('en-u-bar-foo-ca-buddhist-kk-nu-thai');
  });
  it.skip('canonicalizes twice', function() {
    expect(new Locale('und-Armn-SU', {language: 'ru'}).toString()).toBe(
      'ru-Armn-AM'
    );
  });
});
