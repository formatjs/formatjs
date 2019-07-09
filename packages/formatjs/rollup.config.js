import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';

const resolveConfig = resolve({
  customResolveOptions: {
    'intl-messageformat': './packages/intl-messageformat',
    '@formatjs/intl-utils': './packages/intl-utils',
    '@formatjs/intl-relativetimeformat': './packages/intl-relativetimeformat'
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
    plugins: [resolveConfig, typescript({
      tsconfigDefaults: {
        compilerOptions: {
          declaration: false
        }
      }
    }) , commonjs()]
  }
];