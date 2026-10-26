import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'
import minimist from 'minimist'
import ts from 'typescript'

interface Args extends minimist.ParsedArgs {
  input: string
  out: string
  bundle?: boolean
}

function main(args: Args) {
  const source = readFileSync(args.input, 'utf8')
  const file = ts.createSourceFile(
    args.input,
    source,
    ts.ScriptTarget.ES2020,
    true,
    ts.ScriptKind.JS
  )
  const diagnostics = ts.transpileModule(source, {
    fileName: args.input,
    reportDiagnostics: true,
    compilerOptions: {target: ts.ScriptTarget.ES2020},
  }).diagnostics
  if (
    diagnostics?.some(item => item.category === ts.DiagnosticCategory.Error)
  ) {
    throw new Error('Invalid canonicalization factory source')
  }
  const expressions = file.statements.filter(ts.isExpressionStatement)
  if (
    expressions.length !== 1 ||
    file.statements.some(
      item =>
        !ts.isExpressionStatement(item) &&
        item.kind !== ts.SyntaxKind.EmptyStatement
    )
  ) {
    throw new Error('Expected one canonicalization factory expression')
  }
  let factory = expressions[0].expression
  while (ts.isParenthesizedExpression(factory)) factory = factory.expression
  if (!ts.isFunctionExpression(factory) || factory.parameters.length !== 1) {
    throw new Error('Expected a factory accepting the native canonicalizer')
  }
  // Reuse the spec implementation unchanged in Hermes' precompiled setup table.
  const extension = `extensions.IntlGetCanonicalLocales = ${factory.getText(file)};\n`
  const output = args.bundle
    ? `(function () {\n'use strict';\nvar extensions = {};\n${extension}return extensions;\n})();\n`
    : extension
  mkdirSync(dirname(args.out), {recursive: true})
  writeFileSync(args.out, output)
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
