module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      module: {
        type: 'commonjs',
      }
    }],
  },
  testMatch: ['**/spec/?(*.)+(spec).[jt]s?(x)'],
}