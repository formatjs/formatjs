import {join, basename} from 'path';

import {transformFileSync} from '@babel/core';
import plugin, {OptionsSchema} from '../';

const TESTS: Record<string, OptionsSchema> = {
  additionalComponentNames: {
    additionalComponentNames: ['CustomMessage'],
  },
  additionalFunctionNames: {
    additionalFunctionNames: [],
  },
  ast: {
    ast: true,
  },
  defineMessage: {},
  defineMessages: {},
  descriptionsAsObjects: {},
  empty: {},
  enforceDefaultMessage: {},
  enforceDescriptions: {},
  extractFromFormatMessageCall: {},
  extractFromFormatMessageCallStateless: {},
  formatMessageCall: {},
  FormattedMessage: {},
  idInterpolationPattern: {
    idInterpolationPattern: '[folder].[name].[sha512:contenthash:hex:6]',
  },
  inline: {},
  templateLiteral: {},
  overrideIdFn: {
    overrideIdFn: (
      id?: string,
      defaultMessage?: string,
      description?: string,
      filePath?: string
    ) => {
      const filename = basename(filePath!);
      return `${filename}.${id}.${
        defaultMessage!.length
      }.${typeof description}`;
    },
  },
  removeDefaultMessage: {
    removeDefaultMessage: true,
  },
  defineMessagesPreserveWhitespace: {
    preserveWhitespace: true,
  },
  2663: {},
};

describe('emit asserts for: ', () => {
  for (const [caseName, opts] of Object.entries(TESTS)) {
    it(caseName, function () {
      const filePath = join(__dirname, 'fixtures', `${caseName}.js`);
      const {
        code,
        // @ts-ignore
        metadata: {formatjs: data},
      } = transform(filePath, {
        pragma: '@react-intl',
        ...opts,
      });
      expect({
        data,
        code: code?.trim(),
      }).toMatchSnapshot();
    });
  }
});

test('extractSourceLocation', function () {
  const filePath = join(__dirname, 'fixtures', 'extractSourceLocation.js');
  const {
    code,
    // @ts-ignore
    metadata: {formatjs: data},
  } = transform(filePath, {
    pragma: '@react-intl',
    extractSourceLocation: true,
  });
  expect(code?.trim()).toMatchSnapshot();
  expect(data).toMatchSnapshot({
    messages: [
      {
        file: expect.any(String),
        start: expect.any(Object),
        end: expect.any(Object),
      },
    ],
  });
});

describe('errors', () => {
  it('Properly throws parse errors', () => {
    expect(() =>
      transform(join(__dirname, 'fixtures', 'icuSyntax.js'))
    ).toThrow(/Expected .* but "\." found/);
  });
});

let cacheBust = 1;

function transform(
  filePath: string,
  options = {},
  {multiplePasses = false} = {}
) {
  function getPluginConfig() {
    return [plugin, options, Date.now() + '' + ++cacheBust];
  }

  return transformFileSync(filePath, {
    plugins: multiplePasses
      ? [
          'module:@babel/plugin-syntax-jsx',
          getPluginConfig(),
          getPluginConfig(),
        ]
      : ['module:@babel/plugin-syntax-jsx', getPluginConfig()],
  })!;
}
