import * as ReactIntl from '../../../src/';

export default function(buildPath) {
  describe('build', () => {
    it('evaluates', () => {
      expect(require(buildPath)).toBeDefined();
    });

    Object.keys(ReactIntl).forEach(name =>
      it(name, function() {
        const ReactIntlBuild = require(buildPath);
        expect(ReactIntlBuild[name]).toBeA(typeof ReactIntl[name]);
      })
    );
  });
}
