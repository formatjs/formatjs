import {interpolateName} from '../src/interpolate-name';
import {createHash} from 'crypto';
describe('interpolateName', function () {
  it('should match native', function () {
    const hasher = createHash('sha1');
    const content = 'foo#bar';
    hasher.update(content);
    expect(
      interpolateName({}, '[sha1:contenthash:base64:6]', {
        content,
      })
    ).toBe(hasher.digest('base64').slice(0, 6));
  });
});
