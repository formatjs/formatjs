import * as ts from 'typescript'
import {Project} from 'ts-morph'
import { transform as intlTransformer } from "./src";

declare module "fs-extra" {
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
  target: ts.ScriptTarget.ES2015
};

export default function compile(
  input: string,
  compilerOptions: ts.CompilerOptions = CJS_CONFIG
) {
  const project = new Project({
    compilerOptions
  })
  project.addExistingSourceFiles(input)
  
  const msgs = {};

  project.emit({
    customTransformers: {
    before: [
      intlTransformer({
        overrideIdFn: "[hash:base64:10]",
        program: project.getProgram().compilerObject
      })
    ]
  }});
  const diagnostics = project.getPreEmitDiagnostics();

  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics));
  return msgs;
}
