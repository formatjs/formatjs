module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  testRegex: ['/test/(functional|unit)/.*\\.(ts|tsx)'],
  testPathIgnorePatterns: [
    'test/functional/support',
    '/test/unit/testUtils',
    '__snapshots__',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageReporters: ['lcov', 'text', 'text-summary', 'html'],
  transformIgnorePatterns: [
    '/node_modules/(?!intl-messageformat|intl-messageformat-parser).+\\.js$',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 100,
      lines: 95,
      statements: 95,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  globals: {
    'ts-jest': {
      tsConfig: {
        module: 'commonjs',
        allowJs: true,
        sourceMap: true,
        outDir: './tmp',
      },
      diagnostics: false,
    },
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
};
