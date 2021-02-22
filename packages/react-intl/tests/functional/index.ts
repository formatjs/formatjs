import * as p from 'path';
import buildTests from './support/build';
import formatTests from './support/format';

import {main} from '../../package.json';
const Main = p.resolve(__dirname, '../../', main);
const builds = {
  Main,
  // 'IIFE-dev': p.join(p.dirname(Main), 'react-intl.iife.js'),
  // 'IIFE-no-parser-dev': p.join(p.dirname(Main), 'react-intl-no-parser.iife.js'),
};

Object.keys(builds).forEach(name => {
  describe(name, () => {
    buildTests(builds[name]);
    formatTests(require(builds[name]), name.includes('no-parser'));
  });
});
