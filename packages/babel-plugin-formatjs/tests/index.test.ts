import * as path from 'path';

import {transformFileSync} from '@babel/core';
import plugin, {OptionsSchema} from '../';

function transformAndCheck(fn: string, opts: OptionsSchema = {}) {
  const filePath = path.join(__dirname, 'fixtures', `${fn}.js`);
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
}

test('additionalComponentNames', function () {
  transformAndCheck('additionalComponentNames', {
    additionalComponentNames: ['CustomMessage'],
  });
});

test('additionalFunctionNames', function () {
  transformAndCheck('additionalFunctionNames', {
    additionalFunctionNames: ['t'],
  });
});

test('ast', function () {
  transformAndCheck('ast', {
    ast: true,
  });
});

test('defineMessage', function () {
  transformAndCheck('defineMessage');
});

test('descriptionsAsObjects', function () {
  transformAndCheck('descriptionsAsObjects');
});

test('defineMessages', function () {
  transformAndCheck('defineMessages');
});
test('empty', function () {
  transformAndCheck('empty');
});
test('extractFromFormatMessageCall', function () {
  transformAndCheck('extractFromFormatMessageCall');
});
test('extractFromFormatMessageCallStateless', function () {
  transformAndCheck('extractFromFormatMessageCallStateless');
});
test('formatMessageCall', function () {
  transformAndCheck('formatMessageCall');
});
test('FormattedMessage', function () {
  transformAndCheck('FormattedMessage');
});
test('inline', function () {
  transformAndCheck('inline');
});
test('templateLiteral', function () {
  transformAndCheck('templateLiteral');
});

test('idInterpolationPattern', function () {
  transformAndCheck('idInterpolationPattern', {
    idInterpolationPattern: '[folder].[name].[sha512:contenthash:hex:6]',
  });
});

test('2663', function () {
  transformAndCheck('2663');
});

test('overrideIdFn', function () {
  transformAndCheck('overrideIdFn', {
    overrideIdFn: (
      id?: string,
      defaultMessage?: string,
      description?: string,
      filePath?: string
    ) => {
      const filename = path.basename(filePath!);
      return `${filename}.${id}.${
        defaultMessage!.length
      }.${typeof description}`;
    },
  });
});
test('removeDefaultMessage', function () {
  transformAndCheck('removeDefaultMessage', {
    removeDefaultMessage: true,
  });
});
test('preserveWhitespace', function () {
  transformAndCheck('preserveWhitespace', {
    preserveWhitespace: true,
  });
});

test('extractSourceLocation', function () {
  const filePath = path.join(__dirname, 'fixtures', 'extractSourceLocation.js');
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

test('Properly throws parse errors', () => {
  expect(() =>
    transform(path.join(__dirname, 'fixtures', 'icuSyntax.js'))
  ).toThrow(/Expected .* but "\." found/);
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
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: '14',
            esmodules: true,
          },
          modules: false,
          useBuiltIns: false,
          ignoreBrowserslistConfig: true,
        },
      ],
      '@babel/preset-react',
    ],
    plugins: multiplePasses
      ? [getPluginConfig(), getPluginConfig()]
      : [getPluginConfig()],
  })!;
}
