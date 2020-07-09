import * as ReactIntl from '../../../';

export default function (buildPath) {
  describe('build', () => {
    it('evaluates', () => {
      expect(require(buildPath)).toBeDefined();
    });

    Object.keys(ReactIntl).forEach(name =>
      it(name, function () {
        const ReactIntlBuild = require(buildPath);
        expect(typeof ReactIntlBuild[name]).toBe(typeof ReactIntl[name]);
      })
    );
  });
}
