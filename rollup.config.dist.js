import * as p from 'path';
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
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

const reactCheck = (
`if (typeof React === 'undefined') {
    throw new ReferenceError('React must be loaded before ReactIntl.');
}
`
);

export default {
    entry: p.resolve('src/react-intl.js'),
    dest: p.resolve(`dist/react-intl.${isProduction ? 'min.js' : 'js'}`),
    format: 'umd',
    moduleName: 'ReactIntl',
    banner: copyright,
    intro: reactCheck,
    sourceMap: true,
    globals: {
        react: 'React',
    },
    external: [
        'react',
    ],
    plugins: [
        babel(),
        nodeResolve({
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
        isProduction && uglify({
            warnings: false,
        }),
    ].filter(Boolean),
};
