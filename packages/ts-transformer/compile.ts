import * as ts from 'typescript';
import {transform as intlTransformer} from './src';

declare module 'fs-extra' {
  export function outputJsonSync(file: string, data: any, opts?: {}): void;
}
const CJS_CONFIG: ts.CompilerOptions = {
  experimentalDecorators: true,
  jsx: ts.JsxEmit.React,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  noEmitOnError: false,
  noUnusedLocals: true,
  noUnusedParameters: true,
  stripInternal: true,
  declaration: true,
  baseUrl: __dirname,
  target: ts.ScriptTarget.ES2015,
};

export default function compile(
  input: string,
  compilerOptions: ts.CompilerOptions = CJS_CONFIG
) {
  const compilerHost = ts.createCompilerHost(compilerOptions);
  const program = ts.createProgram([input], compilerOptions, compilerHost);

  const msgs = {};

  let emitResult = program.emit(undefined, undefined, undefined, undefined, {
    before: [
      intlTransformer({
        overrideIdFn: '[hash:base64:10]',
      }),
    ],
  });

  let allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);
  console.log(
    ts.formatDiagnosticsWithColorAndContext(allDiagnostics, {
      getCanonicalFileName: fileName => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => ts.sys.newLine,
    })
  );

  return msgs;
}
