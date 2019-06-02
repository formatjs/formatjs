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
  ...testRollupConfig
];