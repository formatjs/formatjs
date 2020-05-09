import {join} from 'path';
import {transform, Opts, MessageDescriptor} from '../';
import * as ts from 'typescript';
import {readFile as readFileAsync} from 'fs';
import {promisify} from 'util';

const readFile = promisify(readFileAsync);

const FILES_TO_TESTS: Record<string, Partial<Opts>> = {
  additionalComponentNames: {
    additionalComponentNames: ['CustomMessage'],
  },
  defineMessages: {},
  extractFromFormatMessage: {
    extractFromFormatMessageCall: true,
  },
  extractFromFormatMessageStateless: {
    extractFromFormatMessageCall: true,
  },
  nested: {
    extractFromFormatMessageCall: true,
    overrideIdFn: (id, defaultMessage, description) => {
      return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`;
    },
  },
  extractSourceLocation: {
    extractSourceLocation: true,
  },
  formatMessageCall: {},
  FormattedMessage: {},
  inline: {},
  overrideIdFn: {
    overrideIdFn: (id, defaultMessage, description) => {
      return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`;
    },
    extractFromFormatMessageCall: true,
  },
  removeDefaultMessage: {
    removeDefaultMessage: true,
  },
  noImport: {
    overrideIdFn: '[sha1:contenthash:base64:6]',
    extractFromFormatMessageCall: true,
  },
  removeDescription: {},
};

const FIXTURES_DIR = join(__dirname, 'fixtures');

describe('emit asserts for', function () {
  const filenames = Object.keys(FILES_TO_TESTS);
  filenames.forEach(function (fn) {
    if (fn === 'extractSourceLocation') {
      it(`[special] ${fn}`, async function () {
        const output = await compile(
          join(FIXTURES_DIR, `${fn}.tsx`),
          FILES_TO_TESTS[fn]
        );
        // Check code output
        expect(output.code).toMatchSnapshot();
        expect(output.msgs).toHaveLength(1);
        expect(output.msgs[0]).toMatchSnapshot({
          defaultMessage: 'Hello World!',
          id: 'foo.bar.baz',
          start: 154,
          end: 222,
          file: expect.stringContaining('extractSourceLocation.tsx'),
        });
      });
    } else {
      it(fn, async function () {
        const output = await compile(
          join(FIXTURES_DIR, `${fn}.tsx`),
          FILES_TO_TESTS[fn]
        );
        expect(output).toMatchSnapshot();
      });
    }
  });
});

async function compile(filePath: string, options?: Partial<Opts>) {
  let msgs: MessageDescriptor[] = [];

  const input = await readFile(filePath, 'utf8');
  const output = ts.transpileModule(input, {
    compilerOptions: {
      experimentalDecorators: true,
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      noEmitOnError: false,
      noUnusedLocals: true,
      noUnusedParameters: true,
      stripInternal: true,
      declaration: false,
      baseUrl: __dirname,
      target: ts.ScriptTarget.ES2015,
      rootDir: __dirname,
      outDir: join(__dirname, 'output'),
    },
    fileName: filePath,
    reportDiagnostics: true,
    transformers: {
      before: [
        transform({
          overrideIdFn: '[hash:base64:10]',
          onMsgExtracted: (_, extractedMsgs) => {
            msgs = msgs.concat(extractedMsgs);
          },
          ...(options || {}),
        }),
      ],
    },
  });
  return {
    msgs,
    code: output.outputText,
  };
}
