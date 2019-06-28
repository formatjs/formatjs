import { uglify } from 'rollup-plugin-uglify';
import resolve from 'rollup-plugin-node-resolve';
import testRollupConfig from '../../rollup.config'

const resolveConfig = resolve({
  mainFields: ['module', 'main']
});
const uglifyConfig = uglify();
export default [
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-messageformat.js',
      format: 'umd',
      name: 'IntlMessageFormat'
    },
    plugins: [resolveConfig]
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
      file: 'dist/umd/intl-messageformat.min.js',
      format: 'umd',
      name: 'IntlMessageFormat'
    },
    plugins: [resolveConfig, uglifyConfig]
  },
  {
    input: './lib/core.js',
    output: {
      sourcemap: false,
      file: 'core.js',
      format: 'cjs'
    },
    plugins: [resolveConfig, uglifyConfig]
  },
  ...testRollupConfig
];