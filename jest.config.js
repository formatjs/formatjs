module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  testRegex: ['/test/functional/.*\\.(js|ts)', '/test/unit/.*\\.(js|ts)'],
  testPathIgnorePatterns: ['test/functional/support', '/test/unit/testUtils'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
  coverageReporters: ['lcov', 'text', 'text-summary', 'html'],
  transformIgnorePatterns: [
    // Change MODULE_NAME_HERE to your module that isn't being compiled
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
};
