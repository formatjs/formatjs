import extractCurrencies from '../src/extract-currencies';

describe('extract-currencies', function() {
  it('should be able to extract en', function() {
    expect(extractCurrencies(['en'])).toMatchSnapshot();
  });
  it('should be able to extract uk', function() {
    expect(extractCurrencies(['uk'])).toMatchSnapshot();
  });
});
