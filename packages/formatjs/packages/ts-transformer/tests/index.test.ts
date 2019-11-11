import {join} from 'path';
import {Project} from 'ts-morph';
import {transform, Opts} from '../src';
import * as ts from 'typescript';
import {MessageDescriptor} from '../../eslint-plugin-formatjs/src/util';

const FILES_TO_TESTS: Record<string, Partial<Opts>> = {
  additionalComponentNames: {
    additionalComponentNames: ['CustomMessage'],
  },
  defineMessages: {},
  extractFromFormatMessage: {
    extractFromFormatMessageCall: true,
  },
  extractSourceLocation: {
    extractSourceLocation: true,
  },
  formatMessageCall: {},
  FormattedHTMLMessage: {},
  FormattedMessage: {},
  inline: {},
  moduleSourceName: {
    moduleSourceName: 'react-i18n',
  },
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
    overrideIdFn: '[hash:base64:5]',
    extractFromFormatMessageCall: true,
  },
  removeDescription: {},
};

const FIXTURES_DIR = join(__dirname, 'fixtures');

describe('emit asserts for', function() {
  const filenames = Object.keys(FILES_TO_TESTS);
  filenames.forEach(function(fn) {
    if (fn === 'extractSourceLocation') {
      it(`[special] ${fn}`, function() {
        const output = compile(
          join(FIXTURES_DIR, `${fn}.tsx`),
          FILES_TO_TESTS[fn]
        );
        // Check code output
        expect(output.code).toMatchSnapshot();
        expect(output.msgs).toHaveLength(1);
        expect(output.msgs[0]).toMatchSnapshot({
          defaultMessage: 'Hello World!',
          id: 'foo.bar.baz',
          start: 155,
          end: 222,
          file: expect.stringContaining('extractSourceLocation.tsx'),
        });
      });
    } else {
      it(fn, function() {
        const output = compile(
          join(FIXTURES_DIR, `${fn}.tsx`),
          FILES_TO_TESTS[fn]
        );
        expect(output).toMatchSnapshot();
      });
    }
  });
});

function compile(filePath: string, options?: Partial<Opts>) {
  const project = new Project({
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
  });
  project.addExistingSourceFile(filePath);

  let msgs: MessageDescriptor[] = [];

  const result = project.emitToMemory({
    customTransformers: {
      before: [
        transform({
          overrideIdFn: '[hash:base64:10]',
          onMsgExtracted: (_, extractedMsgs) => {
            msgs = msgs.concat(extractedMsgs);
          },
          program: project.getProgram().compilerObject,
          ...(options || {}),
        }),
      ],
    },
  });
  return {
    msgs,
    code: result.getFiles()[0].text,
  };
}
