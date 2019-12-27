import cliMain from '../../src/cli';
import {OptionsSchema} from 'babel-plugin-react-intl/dist/options';

jest.mock('@babel/core', () => {
  const mockBabelResult = {
    metadata: {
      'react-intl': [],
    },
  };
  return {
    __esModule: true,
    transformSync: jest.fn().mockReturnValue(mockBabelResult),
    transformFileSync: jest.fn().mockReturnValue(mockBabelResult),
  };
});
const babel = require('@babel/core');

// Commander.js will call this.
jest.spyOn(process, 'exit').mockImplementation((() => null) as any);

jest.mock('glob', () => ({
  sync: (p: string) => [p],
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('it passes camelCase-converted arguments to babel API', () => {
  cliMain([
    'node',
    'path/to/formatjs-cli',
    'extract',
    '--module-source-name=my-react-intl',
    '--extract-source-location',
    '--messages-dir=path/to/messages/dir',
    '--remove-default-message',
    '--extract-from-format-message-call',
    '--additional-component-names',
    'Foo,Bar',
    'file1.js',
    'file2.tsx',
  ]);
  const pluginOptions: OptionsSchema = {
    moduleSourceName: 'my-react-intl',
    extractSourceLocation: true,
    messagesDir: 'path/to/messages/dir',
    removeDefaultMessage: true,
    extractFromFormatMessageCall: true,
    additionalComponentNames: ['Foo', 'Bar'],
  };

  expect(babel.transformFileSync).toHaveBeenCalledTimes(2);
  expect(babel.transformFileSync).toHaveBeenNthCalledWith(
    1,
    'file1.js',
    expect.objectContaining({
      filename: 'file1.js',
      plugins: [
        [
          require.resolve('babel-plugin-react-intl'),
          {
            ...pluginOptions,
            overrideIdFn: expect.any(Function),
          },
        ],
      ],
    })
  );
  expect(babel.transformFileSync).toHaveBeenNthCalledWith(
    2,
    'file2.tsx',
    expect.objectContaining({
      filename: 'file2.tsx',
      plugins: [
        [
          require.resolve('babel-plugin-react-intl'),
          {...pluginOptions, overrideIdFn: expect.any(Function)},
        ],
      ],
    })
  );
});
