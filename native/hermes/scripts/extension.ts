import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'
import minimist from 'minimist'
import ts from 'typescript'

interface Args extends minimist.ParsedArgs {
  input: string | string[]
  name?: string | string[]
  out: string
  bundle?: boolean
  factory?: boolean
}

function main(args: Args) {
  const inputs = ([] as string[]).concat(args.input || [])
  const names = ([] as string[]).concat(args.name || 'IntlGetCanonicalLocales')
  if (!inputs.length || inputs.length !== names.length) {
    throw new Error('Each extension input needs one name')
  }
  if (args.factory && (inputs.length !== 1 || args.bundle)) {
    throw new Error('Factory output requires one input and no bundle')
  }
  const factories = inputs.map((input, index) => {
    if (!/^Intl[A-Za-z]+$/.test(names[index])) {
      throw new Error('Invalid Intl extension name')
    }
    const result = ts.transpileModule(readFileSync(input, 'utf8'), {
      fileName: input,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleDetection: ts.ModuleDetectionKind.Legacy,
      },
    })
    if (
      result.diagnostics?.some(
        item => item.category === ts.DiagnosticCategory.Error
      )
    ) {
      throw new Error(`Invalid extension factory: ${input}`)
    }
    const file = ts.createSourceFile(
      input,
      result.outputText,
      ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.JS
    )
    const statements = file.statements.filter(
      item => item.kind !== ts.SyntaxKind.EmptyStatement
    )
    // TypeScript can emit a script prologue outside the already-strict factory.
    if (
      statements[0] &&
      ts.isExpressionStatement(statements[0]) &&
      ts.isStringLiteral(statements[0].expression) &&
      statements[0].expression.text === 'use strict'
    )
      statements.shift()
    if (statements.length !== 1 || !ts.isExpressionStatement(statements[0])) {
      throw new Error(`Expected one extension factory expression: ${input}`)
    }
    let factory = statements[0].expression
    while (ts.isParenthesizedExpression(factory)) factory = factory.expression
    if (!ts.isFunctionExpression(factory) || factory.parameters.length !== 1) {
      throw new Error('Expected a factory accepting one native function')
    }
    return factory.getText(file)
  })
  // Both source startup and precompiled setup use the same transpiled factory.
  const extension = factories
    .map((factory, index) => `extensions.${names[index]} = ${factory};\n`)
    .join('')
  const output = args.factory
    ? `(${factories[0]});\n`
    : args.bundle
      ? `(function () {\n'use strict';\nvar extensions = {};\n${extension}return extensions;\n})();\n`
      : extension
  mkdirSync(dirname(args.out), {recursive: true})
  writeFileSync(args.out, output)
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
