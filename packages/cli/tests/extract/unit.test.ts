import cliMain from '../../src/cli';
const glob = require('glob');
const ts = require('typescript');
const transpileModule = jest.spyOn(ts, 'transpileModule');
// Commander.js will call this.
jest.spyOn(process, 'exit').mockImplementation((() => null) as any);

jest.mock('glob', () => ({
  sync: jest.fn((p: string) => [p]),
}));

jest.mock('fs-extra', () => ({
  outputJSONSync: () => Promise.resolve(),
  readFile: () => Promise.resolve(';'),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('it passes camelCase-converted arguments to typescript API', async () => {
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

test('it passes ignore argument to glob sync', () => {
  cliMain([
    'node',
    'path/to/formatjs-cli',
    'extract',
    '--ignore=ignore-1.ts',
    'include-1.js',
  ]);

  expect(glob.sync).toHaveBeenCalled();
  expect(glob.sync).toHaveBeenNthCalledWith(
    1,
    'include-1.js',
    expect.objectContaining({ignore: 'ignore-1.ts'})
  );
});

test('does not read from stdin when the glob pattern does NOT match anything', async () => {
  // Does not match anything
  jest.spyOn(glob, 'sync').mockImplementation(() => []);
  // This should not hang
  await cliMain(['node', 'path/to/formatjs-cli', 'extract', '*.doesnotexist']);
  expect(transpileModule).not.toHaveBeenCalled();
}, 500); // 500ms timeout
