import {uglify} from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import testRollupConfig from '../../rollup.config';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
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
    input: './lib/polyfill.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/polyfill.js',
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
      name: 'IntlPluralRules',
    },
    plugins: [
      resolveConfig,
      commonjsConfig,
      jsonConfig,
      typescript({
        // This is meant to be import and used in sub-packages, where a tsconfig.esm.json
        // is assumed to exist.
        tsconfig: './tsconfig.es6.json',
        tsconfigDefaults: {
          compilerOptions: {
            declaration: false,
            declarationMap: false,
          },
        },
        check: false,
      }),
    ],
  },
  ...testRollupConfig,
];
