import cliMain from '../../src/cli'
const glob = require('fast-glob')
import ts from 'typescript'
jest.mock('typescript')
// Commander.js will call this.
jest.spyOn(process, 'exit').mockImplementation((() => null) as any)
jest.spyOn(glob, 'sync').mockImplementation(p => (Array.isArray(p) ? p : [p]))

jest.mock('fs-extra', () => ({
  outputJSONSync: () => Promise.resolve(),
  readFile: () => Promise.resolve(';'),
}))

// Since TS5.0 jest mock doesn't seem to work bc of readonly properties
describe.skip('unit', function () {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('it passes camelCase-converted arguments to typescript API', async () => {
    await cliMain([
      'node',
      'path/to/formatjs-cli',
      'extract',
      '--extract-source-location',
      '--remove-default-message',
      '--throws',
      '--additional-component-names',
      'Foo,Bar',
      '--ignore=file3.ts',
      'file1.js',
      'file2.tsx',
    ])

    expect((ts.transpileModule as any).mock.calls).toMatchSnapshot()
  })

  it('does not read from stdin when the glob pattern does NOT match anything', async () => {
    // Does not match anything
    jest.spyOn(glob, 'sync').mockImplementation(() => [])
    // This should not hang
    await cliMain(['node', 'path/to/formatjs-cli', 'extract', '*.doesnotexist'])
    expect(ts.transpileModule).not.toHaveBeenCalled()
  }, 500) // 500ms timeout
})
