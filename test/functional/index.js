import * as p from 'path';
import buildTests from './support/build';
import formatTests from './support/format';

const builds = {
    'ES'      : p.resolve('lib/index.es.js'),
    'CJS'     : p.resolve('lib/index.js'),
    'UMD-dev' : p.resolve('dist/react-intl.js'),
    'UMD-prod': p.resolve('dist/react-intl.min.js'),
};

Object.keys(builds).forEach((name) => {
    describe(name, () => {
        buildTests(builds[name]);
        formatTests(require(builds[name]));
    });
});
