module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 100,
      lines: 95,
      statements: 95,
    },
  },
}
