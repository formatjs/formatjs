import * as p from 'path';
import babel from 'rollup-plugin-babel';

const copyright = (
`/*
 * Copyright ${new Date().getFullYear()}, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
`
);

export default {
    entry: p.resolve('src/index.js'),
    targets: [
        {dest: 'lib/index.js', format: 'cjs'},
        {dest: 'lib/index.es.js', format: 'es'},
    ],
    banner: copyright,
    external: [
        'intl-format-cache',
        'intl-messageformat',
        'intl-relativeformat',
        'invariant',
        'react',
        p.resolve('locale-data/index.js'),
    ],
    plugins: [
        babel(),
    ],
};
