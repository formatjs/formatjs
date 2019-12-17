import extractUnits from '../src/extract-units';

describe('extract-units', function() {
  it('should be able to extract en', function() {
    expect(extractUnits(['en'])).toMatchSnapshot();
  });
  it('should be able to extract vi', function() {
    expect(extractUnits(['vi'])).toMatchSnapshot();
  });
});
