import { uglify } from "rollup-plugin-uglify";


export default [{
  input: './lib/index.js',
  output: {
    sourcemap: true,
      file: 'dist/intl-messageformat.js',
      format: 'umd',
      name: 'IntlMessageFormat'
  },
},
{
    input: './lib/locales.js',
    output: {
      sourcemap: true,
        file: 'dist/intl-messageformat-with-locales.js',
        format: 'umd',
        name: 'IntlMessageFormat'
    },
  },
  {
    input: './lib/index.js',
    output: {
      sourcemap: true,
        file: 'dist/intl-messageformat.min.js',
        format: 'umd',
        name: 'IntlMessageFormat'
    },
    plugins: [
      uglify()
    ]
  },
  {
    input: './lib/locales.js',
    output: {
      sourcemap: true,
        file: 'dist/intl-messageformat-with-locales.min.js',
        format: 'umd',
        name: 'IntlMessageFormat'
    },
    plugins: [
      uglify()
    ]
  }]