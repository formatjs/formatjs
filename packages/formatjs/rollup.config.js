import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';

const resolveConfig = resolve({
  mainFields: ['module', 'main']
});
export default [
  {
    input: './tests/index.ts',
    output: {
      sourcemap: true,
      file: 'tests/browser.js',
      format: 'umd'
    },
    plugins: [typescript({rootDir: __dirname}), resolveConfig, commonjs()]
  }
];