module.exports = 
  {
    input: './index.js',
    output: {
      sourcemap: true,
      file: 'intl-unified-numberformat.js',
      format: 'umd',
      exports: 'named',
      name: 'IntlNumberFormat',
    },
  }