module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  testRegex: '/test/(unit|functional)/.*\\.js',
  testPathIgnorePatterns: ['test/functional/support', '/test/unit/testUtils'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}'
  ],
  coverageReporters: ['lcov', 'text', 'text-summary', 'html'],
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
