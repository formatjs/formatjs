const config = {
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
      dynamicImport: true,
      topLevelAwait: true,
      importMeta: true,
    },
    target: 'es2022',
  },
}
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.m?(t|j)sx?$': ['@swc/jest', config],
    '^.+\\.m(t|j)s$': ['@swc/jest', config],
  },
  verbose: true,
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'ts', 'tsx', 'mts'],
  extensionsToTreatAsEsm: ['.mts'],
}
