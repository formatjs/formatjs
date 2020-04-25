import extractDisplayNames from '../src/extract-displaynames';

describe('extract-units', function() {
  it('should be able to extract en', function() {
    expect(extractDisplayNames(['en'])).toMatchSnapshot();
  });
  it('should be able to extract vi', function() {
    expect(extractDisplayNames(['vi'])).toMatchSnapshot();
  });
  it('should be able to extract ja', function() {
    expect(extractDisplayNames(['ja'])).toMatchSnapshot();
  });
});
