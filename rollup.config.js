import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';

const resolveConfig = resolve({
  customResolveOptions: {
    '@formatjs/intl-pluralrules': './packages/intl-pluralrules',
    '@formatjs/intl-relativetimeformat': './packages/intl-relativetimeformat',
    '@formatjs/intl-utils': './packages/intl-utils',
    'intl-messageformat': './packages/intl-messageformat',
  },
});

export default [
  {
    input: './tests/index.test.ts',
    output: {
      sourcemap: true,
      file: 'tests/browser.js',
      format: 'umd',
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify('test'),
        'process.version': JSON.stringify(''),
      }),
      resolveConfig,
      typescript({
        // This is meant to be import and used in sub-packages, where a tsconfig.esm.json
        // is assumed to exist.
        tsconfig: './tsconfig.esm.json',
        tsconfigDefaults: {
          compilerOptions: {
            declaration: false,
            declarationMap: false,
          },
        },
      }),
      commonjs(),
    ],
  },
];
