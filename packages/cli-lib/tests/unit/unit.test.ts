import {describe, it, expect, beforeEach, vi} from 'vitest'
import cliMain from '../../src/cli'
const glob = require('fast-glob')
import ts from 'typescript'
vi.mock('typescript')
// Commander.js will call this.
vi.spyOn(process, 'exit').mockImplementation((() => null) as any)
vi.spyOn(glob, 'sync').mockImplementation(p => (Array.isArray(p) ? p : [p]))

vi.mock('fs-extra', () => ({
  outputJSONSync: () => Promise.resolve(),
  readFile: () => Promise.resolve(';'),
}))

// Since TS5.0 vi mock doesn't seem to work bc of readonly properties
describe.skip('unit', function () {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('it passes camelCase-converted arguments to typescript API', async () => {
    await cliMain([
      'node',
      'path/to/formatjs-cli',
      'extract',
      '--extract-source-location',
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
    vi.spyOn(glob, 'sync').mockImplementation(() => [])
    // This should not hang
    await cliMain(['node', 'path/to/formatjs-cli', 'extract', '*.doesnotexist'])
    expect(ts.transpileModule).not.toHaveBeenCalled()
  }, 500) // 500ms timeout
})
