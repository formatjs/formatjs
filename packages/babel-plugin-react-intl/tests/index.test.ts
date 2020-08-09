import {join, basename} from 'path';

import {transformFileSync} from '@babel/core';
import plugin, {OptionsSchema} from '../';

const TESTS: Record<string, OptionsSchema> = {
  additionalComponentNames: {
    additionalComponentNames: ['CustomMessage'],
  },
  defineMessage: {},
  defineMessages: {},
  descriptionsAsObjects: {},
  empty: {},
  enforceDefaultMessage: {},
  enforceDescriptions: {},
  extractFromFormatMessageCall: {
    extractFromFormatMessageCall: true,
  },
  extractFromFormatMessageCallStateless: {
    extractFromFormatMessageCall: true,
  },
  formatMessageCall: {},
  FormattedMessage: {},
  idInterpolationPattern: {
    idInterpolationPattern: '[sha512:contenthash:hex:6]',
  },
  inline: {},
  moduleSourceName: {
    moduleSourceName: 'react-i18n',
  },
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
};

describe('emit asserts for: ', () => {
  for (const [caseName, opts] of Object.entries(TESTS)) {
    it(caseName, function () {
      const filePath = join(__dirname, 'fixtures', caseName, 'actual.js');
      const {
        code,
        // @ts-ignore
        metadata: {'react-intl': data},
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
  const filePath = join(
    __dirname,
    'fixtures',
    'extractSourceLocation',
    'actual.js'
  );
  const {
    code,
    // @ts-ignore
    metadata: {'react-intl': data},
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
      transform(join(__dirname, 'fixtures', 'icuSyntax', 'actual.js'))
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
