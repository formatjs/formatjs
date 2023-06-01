module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  testEnvironment: 'jsdom',
  testRegex: ['/tests/(functional|unit)/.*\\.(ts|tsx)'],
  testPathIgnorePatterns: [
    'tests/functional/support',
    '/tests/unit/testUtils',
    '__snapshots__',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageReporters: ['lcov', 'text', 'text-summary', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 100,
      lines: 95,
      statements: 95,
    },
  },
}
