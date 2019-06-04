import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';

const resolveConfig = resolve({
  customResolveOptions: {
    'intl-messageformat': './packages/intl-messageformat',
    'intl-messageformat-parser': './packages/intl-messageformat-parser',
    'intl-relativeformat': './packages/intl-relativeformat',
    'intl-relativetimeformat': './packages/intl-relativetimeformat'
  }
})
export default [
  {
    input: './tests/index.ts',
    output: {
      sourcemap: true,
      file: 'tests/browser.js',
      format: 'umd'
    },
    plugins: [resolveConfig, typescript({rootDir: __dirname, module: 'esnext'}) , commonjs()]
  }
];