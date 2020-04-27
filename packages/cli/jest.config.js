module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      // TODO: figure out editor tsconfig
      tsConfig: 'tsconfig.jest.json',
    },
  },
};
