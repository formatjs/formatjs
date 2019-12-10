import extractNumbers from '../src/extract-numbers';

describe('extract-numbers', function() {
  it('should be able to extract en', function() {
    expect(extractNumbers(['en'])).toMatchSnapshot();
  });
});
