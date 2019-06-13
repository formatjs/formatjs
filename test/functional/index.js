import * as p from 'path';
import buildTests from './support/build';
import formatTests from './support/format';

const builds = {
  ES: p.resolve(require('../../package.json').module),
  CJS: p.resolve(require('../../package.json').main),
  'UMD-dev': p.resolve('dist/react-intl.js'),
  'UMD-prod': p.resolve('dist/react-intl.min.js'),
};

Object.keys(builds).forEach(name => {
  describe(name, () => {
    buildTests(builds[name]);
    formatTests(require(builds[name]));
  });
});
