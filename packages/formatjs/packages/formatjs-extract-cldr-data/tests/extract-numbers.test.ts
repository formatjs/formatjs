import extractNumbers from '../src/extract-raw-numbers';

describe('extract-numbers', function() {
  it('should be able to extract en', function() {
    expect(extractNumbers(['en'])).toMatchSnapshot();
  });
  it('should be able to extract vi', function() {
    expect(extractNumbers(['vi'])).toMatchSnapshot();
  });
});
