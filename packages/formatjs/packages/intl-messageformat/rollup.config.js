import { uglify } from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';

const resolveConfig = resolve({
  mainFields: ['jsnext:main', 'module', 'main']
});
const uglifyConfig = uglify();
export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-messageformat.js',
      format: 'umd',
      name: 'IntlMessageFormat'
    },
    plugins: [resolveConfig]
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/intl-messageformat.min.js',
      format: 'umd',
      name: 'IntlMessageFormat'
    },
    plugins: [resolveConfig, uglifyConfig]
  },
  {
    input: './tests/index.ts',
    output: {
      sourcemap: true,
      file: 'tests/browser.js',
      format: 'umd'
    },
    plugins: [typescript(), resolveConfig, commonjs()]
  }
];
