import {uglify} from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import testRollupConfig from '../../rollup.config';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
const jsonConfig = json();
const commonjsConfig = commonjs({
  namedExports: {
    lodash: ['pickBy', 'isEmpty', 'isEqual', 'fromPairs'],
  },
});
const resolveConfig = resolve({
  mainFields: ['module', 'main'],
});
const uglifyConfig = uglify();

export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-listformat.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlListFormat',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-listformat.min.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlListFormat',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig, uglifyConfig],
  },
  {
    input: './lib/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill-intl-listformat.js',
      format: 'umd',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  {
    input: './tests/test262-main.js',
    output: {
      sourcemap: true,
      file: 'tests/test262-polyfill.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlListFormat',
    },
    plugins: [resolveConfig, commonjsConfig, jsonConfig],
  },
  ...testRollupConfig,
];
