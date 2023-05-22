module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      astTransformers: {
        before: [
          {
            path: require.resolve(
              '@formatjs/ts-transformer/ts-jest-integration'
            ),
            options: {
              // options
              overrideIdFn: '[sha512:contenthash:base64:6]',
              ast: true,
            },
          },
        ],
      },
    },
  },
  verbose: true,
}
