module.exports = 
  {
    input: './index.js',
    output: {
      sourcemap: true,
      file: 'intl-messageformat.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlMessageFormat',
    },
  }