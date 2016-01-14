import * as p from 'path';
import * as fs from 'fs';
import {rollup} from 'rollup';
import babel from 'rollup-plugin-babel';
import npm from 'rollup-plugin-npm';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';

const isProduction = process.env.NODE_ENV === 'production';

const copyright = (
`/*
 * Copyright ${new Date().getFullYear()}, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
`
);

const entry = p.resolve('src/react-intl.js');
const dest  = p.resolve(`dist/react-intl.${isProduction ? 'min.js' : 'js'}`);

const bundleConfig = {
    dest,
    format: 'umd',
    moduleName: 'ReactIntl',
    banner: copyright,
    sourceMap: true,
    globals: {
        react: 'React',
    },
};

let babelConfig = JSON.parse(fs.readFileSync('src/.babelrc', 'utf8'));
babelConfig.babelrc = false;
babelConfig.presets = babelConfig.presets.map((preset) => {
    return preset === 'es2015' ? 'es2015-rollup' : preset;
});

let plugins = [
    babel(babelConfig),
    npm({
        jsnext: true,
        skip: [
            'react',
        ],
    }),
    commonjs({
        sourceMap: true,
    }),
    replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
];

if (isProduction) {
    plugins.push(
        uglify({
            warnings: false,
        })
    );
}

let bundle = Promise.resolve(rollup({entry, plugins}));
bundle.then(({write}) => write(bundleConfig));

process.on('unhandledRejection', (reason) => {throw reason;});
