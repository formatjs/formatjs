import * as p from 'path';
import buildTests from './support/build';
import formatTests from './support/format';

import {main} from '../../package.json';
const Main = p.resolve(__dirname, '../../', main);
const builds = {
  Main,
  'UMD-dev': p.join(p.dirname(Main), 'react-intl.umd.js'),
  'UMD-prod': p.join(p.dirname(Main), 'react-intl.umd.min.js'),
  'UMD-no-parser-dev': p.join(p.dirname(Main), 'react-intl-no-parser.umd.js'),
  'UMD-no-parser-prod': p.join(
    p.dirname(Main),
    'react-intl-no-parser.umd.min.js'
  ),
};

Object.keys(builds).forEach(name => {
  describe(name, () => {
    buildTests(builds[name]);
    formatTests(require(builds[name]), name.includes('no-parser'));
  });
});
