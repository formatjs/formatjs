import {resolveSupportedLocales} from '../src';
describe('locale-lookup', function() {
  it('should return empty arr if nothing is supported', function() {
    expect(resolveSupportedLocales(['zh'], {en: {locale: 'en'}})).to.deep.equal(
      []
    );
  });
  it('should filter out unsupported locale', function() {
    expect(
      resolveSupportedLocales(['zh', 'en'], {en: {locale: 'en'}})
    ).to.deep.equal(['en']);
  });
});
