import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import {uglify} from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';

const uglifyConfig = uglify();

const copyright = `/*
 * Copyright ${new Date().getFullYear()}, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
`;

const plugins = [
  replace({
    'process.env.NODE_ENV': '"production"',
  }),
  resolve({
    mainFields: ['module', 'main'],
  }),
  commonjs({
    sourcemap: true,
  }),
];
export default [
  {
    input: './lib/index.js',
    output: {
      file: 'dist/react-intl.js',
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
    input: './lib/index.js',
    output: {
      file: 'dist/react-intl.min.js',
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
    plugins: [
      ...plugins,
      uglifyConfig,
    ],
  },
];
