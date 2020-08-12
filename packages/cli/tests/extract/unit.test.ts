import cliMain from '../../src/cli';
const glob = require('fast-glob');
const ts = require('typescript');
const transpileModule = jest.spyOn(ts, 'transpileModule');
// Commander.js will call this.
jest.spyOn(process, 'exit').mockImplementation((() => null) as any);
jest.spyOn(glob, 'sync').mockImplementation(p => [p]);

jest.mock('fs-extra', () => ({
  outputJSONSync: () => Promise.resolve(),
  readFile: () => Promise.resolve(';'),
}));

describe('unit', function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('it passes camelCase-converted arguments to typescript API', async () => {
    await cliMain([
      'node',
      'path/to/formatjs-cli',
      'extract',
      '--extract-source-location',
      '--remove-default-message',
      '--extract-from-format-message-call',
      '--throws',
      '--additional-component-names',
      'Foo,Bar',
      '--ignore=file3.ts',
      'file1.js',
      'file2.tsx',
    ]);

    expect(transpileModule.mock.calls).toMatchSnapshot();
  });

  it('does not read from stdin when the glob pattern does NOT match anything', async () => {
    // Does not match anything
    jest.spyOn(glob, 'sync').mockImplementation(() => []);
    // This should not hang
    await cliMain([
      'node',
      'path/to/formatjs-cli',
      'extract',
      '*.doesnotexist',
    ]);
    expect(transpileModule).not.toHaveBeenCalled();
  }, 500); // 500ms timeout
});
