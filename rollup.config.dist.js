import * as p from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import {uglify} from 'rollup-plugin-uglify';
import typescript from 'rollup-plugin-typescript';

const isProduction = process.env.NODE_ENV === 'production';

const copyright = `/*
 * Copyright ${new Date().getFullYear()}, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
`;

const plugins = [
  replace({
    replaces: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  }),
  nodeResolve(),
  typescript({
    target: 'es5',
    module: 'es6',
    include: ['*.js+(|x)', '**/*.js+(|x)'],
  }),
  commonjs({
    sourcemap: true,
  }),
  isProduction &&
    uglify({
      warnings: false,
    }),
].filter(Boolean);

export default [
  {
    input: p.resolve('lib/index.js'),
    output: {
      file: p.resolve(`dist/react-intl.${isProduction ? 'min.js' : 'js'}`),
      format: 'umd',
      name: 'ReactIntl',
      banner: copyright,
      exports: 'named',
      sourcemap: true,
      globals: {
        react: 'React',
      },
    },
    external: ['react'],
    plugins,
  },
  {
    input: p.resolve('lib/core.js'),
    output: {
      file: p.resolve(`dist/react-intl-core.${isProduction ? 'min.js' : 'js'}`),
      format: 'umd',
      name: 'ReactIntl',
      banner: copyright,
      exports: 'named',
      sourcemap: true,
      globals: {
        react: 'React',
      },
    },
    external: ['react'],
    plugins,
  },
];
