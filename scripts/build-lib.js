import * as p from 'path';
import * as fs from 'fs';
import {rollup} from 'rollup';
import babel from 'rollup-plugin-babel';

const copyright = (
`/*
 * Copyright ${new Date().getFullYear()}, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
`
);

let babelConfig = JSON.parse(fs.readFileSync('src/.babelrc', 'utf8'));
babelConfig.babelrc = false;
babelConfig.presets = babelConfig.presets.map((preset) => {
    return preset === 'es2015' ? 'es2015-rollup' : preset;
});

let bundle = rollup({
    entry: p.resolve('src/index.js'),
    external: [
        p.resolve('locale-data/index.js'),
    ],
    plugins: [
        babel(babelConfig),
    ],
});

bundle.then(({write}) => write({
    dest: p.resolve('lib/index.js'),
    format: 'cjs',
    banner: copyright,
}));

bundle.then(({write}) => write({
    dest: p.resolve('lib/index.es.js'),
    format: 'es6',
    banner: copyright,
}));

process.on('unhandledRejection', (reason) => {throw reason;});
