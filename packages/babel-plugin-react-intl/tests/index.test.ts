import {join, basename} from 'path';
import * as fs from 'fs';
import {transformFileSync} from '@babel/core';
import plugin, {resolveOutputPath} from '../';

function trim(str?: string | null) {
  return String(str).replace(/^\s+|\s+$/, '');
}

const skipOutputTests = [
  '.babelrc',
  '.DS_Store',
  'extractSourceLocation',
  'extractFromFormatMessageCall',
  'extractFromFormatMessageCallStateless',
  'moduleSourceName',
  'inline',
  'icuSyntax',
  'removeDescriptions',
  'overrideIdFn',
  'idInterpolationPattern',
  'removeDefaultMessage',
  'additionalComponentNames',
  'outputEmptyJson',
  'empty',
  'workspaceRoot',
];

describe('emit asserts for: ', () => {
  fs.readdirSync(join(__dirname, 'fixtures')).map(caseName => {
    if (skipOutputTests.indexOf(caseName) >= 0) return;

    it(`output match: ${caseName}`, () => {
      const fixtureDir = join(__dirname, 'fixtures', caseName);
      const filePath = join(fixtureDir, 'actual.js');

      const {code: actual, metadata} = transform(filePath, {
        pragma: '@react-intl',
      })!;
      expect((metadata as any)['react-intl']).toMatchSnapshot();
      // Check code output
      expect(trim(actual)).toMatchSnapshot();

      // Check message output
      expect(
        require(resolveOutputPath(process.cwd(), __dirname, filePath))
      ).toMatchSnapshot();
    });
  });
});

describe('options', () => {
  it('removeDefaultMessage should remove default message', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'removeDefaultMessage');
    const filePath = join(fixtureDir, 'actual.js');
    const actual = transform(filePath, {
      removeDefaultMessage: true,
    })!.code;

    // Check code output
    expect(trim(actual)).toMatchSnapshot();

    // Check message output
    expect(
      require(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toMatchSnapshot();
  });
  it('outputEmptyJson should output empty files', function () {
    const fixtureDir = join(__dirname, 'fixtures', 'outputEmptyJson');
    const filePath = join(fixtureDir, 'actual.js');
    const actual = transform(filePath, {
      outputEmptyJson: true,
    })!.code;

    // Check code output
    expect(trim(actual)).toMatchSnapshot();

    // Check message output
    expect(
      require(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toMatchSnapshot();
  });
  it('without outputEmptyJson should output empty files', function () {
    const fixtureDir = join(__dirname, 'fixtures', 'empty');
    const filePath = join(fixtureDir, 'actual.js');
    const actual = transform(filePath, {})!.code;

    // Check code output
    expect(trim(actual)).toMatchSnapshot();

    // Check message output
    expect(
      fs.existsSync(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toBeFalsy();
  });
  it('correctly overrides the id when overrideIdFn is provided', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'overrideIdFn');
    const filePath = join(fixtureDir, 'actual.js');
    const actual = transform(filePath, {
      overrideIdFn: (
        id: string,
        defaultMessage: string,
        description: string,
        filePath: string
      ) => {
        const filename = basename(filePath);
        return `${filename}.${id}.${
          defaultMessage.length
        }.${typeof description}`;
      },
    })!.code;

    // Check code output
    expect(trim(actual)).toMatchSnapshot();

    // Check message output
    expect(
      require(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toMatchSnapshot();
  });
  it('correctly overrides the id when idInterpolationPattern is provided', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'idInterpolationPattern');
    const filePath = join(fixtureDir, 'actual.js');
    const actual = transform(filePath, {
      idInterpolationPattern: '[sha512:contenthash:hex:6]',
    })!.code;

    // Check code output
    expect(trim(actual)).toMatchSnapshot();

    // Check message output
    expect(
      require(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toMatchSnapshot();
  });

  it('removes descriptions when plugin is applied more than once', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'removeDescriptions');
    expect(() =>
      transform(
        join(fixtureDir, 'actual.js'),
        {},
        {
          multiplePasses: true,
        }
      )
    ).not.toThrow();
  });

  it('respects moduleSourceName', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'moduleSourceName');
    const filePath = join(fixtureDir, 'actual.js');
    expect(() =>
      transform(filePath, {
        moduleSourceName: 'react-i18n',
      })
    ).not.toThrow();

    // Check message output
    expect(
      require(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toMatchSnapshot();
  });

  it('should be able to parse inline defineMessage from react-intl', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'inline');
    const filePath = join(fixtureDir, 'actual.js');
    expect(() => transform(filePath)).not.toThrow();

    // Check message output
    expect(
      require(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toMatchSnapshot();
  });

  it('respects extractSourceLocation', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'extractSourceLocation');
    const filePath = join(fixtureDir, 'actual.js');
    expect(() =>
      transform(filePath, {
        extractSourceLocation: true,
      })
    ).not.toThrow();

    // Check message output
    const actualMessages = require(resolveOutputPath(
      process.cwd(),
      __dirname,
      filePath
    ));
    actualMessages.forEach((msg: any) => {
      msg.file = msg.file.replace(/\/|\\/g, '@@sep@@');
    });
    expect(actualMessages).toMatchSnapshot();
  });

  it('respects extractFromFormatMessageCall', () => {
    const fixtureDir = join(
      __dirname,
      'fixtures',
      'extractFromFormatMessageCall'
    );
    const filePath = join(fixtureDir, 'actual.js');
    expect(() =>
      transform(filePath, {
        extractFromFormatMessageCall: true,
      })
    ).not.toThrow();

    // Check message output
    expect(
      require(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toMatchSnapshot();
  });

  it('respects extractFromFormatMessageCall from stateless components', () => {
    const fixtureDir = join(
      __dirname,
      'fixtures',
      'extractFromFormatMessageCallStateless'
    );
    const filePath = join(fixtureDir, 'actual.js');
    expect(() =>
      transform(filePath, {
        extractFromFormatMessageCall: true,
      })
    ).not.toThrow();

    // Check message output
    expect(
      require(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toMatchSnapshot();
  });

  it('additionalComponentNames', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'additionalComponentNames');
    const filePath = join(fixtureDir, 'actual.js');
    expect(() =>
      transform(filePath, {
        additionalComponentNames: ['CustomMessage'],
      })
    ).not.toThrow();

    // Check message output
    expect(
      require(resolveOutputPath(process.cwd(), __dirname, filePath))
    ).toMatchSnapshot();
  });

  it('workspaceRoot', () => {
    const fixtureDir = join(
      __dirname,
      'fixtures',
      'workspaceRoot',
      'subdir1',
      'subdir2'
    );
    const filePath = join(fixtureDir, 'actual.js');
    expect(() =>
      transform(filePath, {
        workspaceRoot: join(__dirname, 'fixtures', 'workspaceRoot', 'subdir1'),
      })
    ).not.toThrow();

    // Check message output
    expect(
      require(resolveOutputPath(
        join(__dirname, 'fixtures', 'workspaceRoot', 'subdir1'),
        __dirname,
        filePath
      ))
    ).toMatchSnapshot();

    expect(() =>
      transform(filePath, {
        workspaceRoot: join(__dirname, 'fixtures', 'workspaceRoot'),
      })
    ).not.toThrow();

    // Check message output
    expect(
      require(resolveOutputPath(
        join(__dirname, 'fixtures', 'workspaceRoot'),
        __dirname,
        filePath
      ))
    ).toMatchSnapshot();
  });

  it('workspaceRoot invalid', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'workspaceRoot', 'subdir3');
    const filePath = join(fixtureDir, 'actual.js');
    expect(() =>
      transform(filePath, {
        workspaceRoot: join(__dirname, 'fixtures', 'workspaceRoot', 'subdir1'),
      })
    ).toThrow();
  });
});

describe('errors', () => {
  it('Properly throws parse errors', () => {
    const fixtureDir = join(__dirname, 'fixtures', 'icuSyntax');
    expect(() => transform(join(fixtureDir, 'actual.js'))).toThrow(
      /Expected .* but "\." found/
    );
  });
});

let cacheBust = 1;

function transform(
  filePath: string,
  options = {},
  {multiplePasses = false} = {}
) {
  function getPluginConfig() {
    return [
      plugin,
      {
        messagesDir: __dirname,
        ...options,
      },
      Date.now() + '' + ++cacheBust,
    ];
  }

  return transformFileSync(filePath, {
    plugins: multiplePasses
      ? [
          'module:@babel/plugin-syntax-jsx',
          getPluginConfig(),
          getPluginConfig(),
        ]
      : ['module:@babel/plugin-syntax-jsx', getPluginConfig()],
  });
}
