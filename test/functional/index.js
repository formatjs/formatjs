import buildTests from './build';
import formatTests from './format';

const builds = {
    'ES'      : '../../lib/index.es.js',
    'CJS'     : '../../lib/index.js',
    'UMD-dev' : '../../dist/react-intl.js',
    'UMD-prod': '../../dist/react-intl.min.js',
};

Object.keys(builds).forEach((name) => {
    describe(name, () => {
        buildTests(builds[name]);
        formatTests(require(builds[name]));
    });
});
