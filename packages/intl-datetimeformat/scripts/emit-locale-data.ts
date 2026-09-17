import {basename, join} from 'node:path'
import {readFileSync} from 'node:fs'
import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'
import ts from 'typescript'

interface Args extends minimist.ParsedArgs {
  input: string | string[]
  outDir: string
  method: string
  queue: string
}

function main(args: Args) {
  const inputs = ([] as string[]).concat(args.input || []).sort()
  if (!inputs.length || !args.outDir || !args.method || !args.queue) {
    throw new Error('--input, --outDir, --method, and --queue are required')
  }
  const f = ts.factory
  const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed})
  const source = ts.createSourceFile(
    'locale.js',
    '',
    ts.ScriptTarget.ESNext,
    false,
    ts.ScriptKind.JS
  )
  const dateTimeFormat = f.createPropertyAccessExpression(
    f.createIdentifier('Intl'),
    'DateTimeFormat'
  )
  const method = f.createElementAccessExpression(
    dateTimeFormat,
    f.createStringLiteral(args.method)
  )
  const queue = f.createElementAccessExpression(
    f.createIdentifier('globalThis'),
    f.createStringLiteral(args.queue)
  )
  const data = f.createIdentifier('data')
  const call = (expression: ts.Expression, values: ts.Expression[]) =>
    f.createCallExpression(expression, undefined, values)
  const registration = f.createIfStatement(
    f.createBinaryExpression(
      dateTimeFormat,
      ts.SyntaxKind.AmpersandAmpersandToken,
      f.createBinaryExpression(
        f.createTypeOfExpression(method),
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        f.createStringLiteral('function')
      )
    ),
    f.createBlock([f.createExpressionStatement(call(method, [data]))], true),
    f.createBlock(
      [
        f.createExpressionStatement(
          call(
            f.createPropertyAccessExpression(
              f.createParenthesizedExpression(
                f.createBinaryExpression(
                  queue,
                  ts.SyntaxKind.EqualsToken,
                  f.createBinaryExpression(
                    queue,
                    ts.SyntaxKind.BarBarToken,
                    f.createArrayLiteralExpression()
                  )
                )
              ),
              'push'
            ),
            [data]
          )
        ),
      ],
      true
    )
  )
  const receiver = f.createParenthesizedExpression(
    f.createFunctionExpression(
      undefined,
      undefined,
      undefined,
      undefined,
      [f.createParameterDeclaration(undefined, undefined, 'data')],
      undefined,
      f.createBlock([registration], true)
    )
  )
  const declaration = printer.printFile(
    f.updateSourceFile(source, [
      f.createExportDeclaration(undefined, false, f.createNamedExports([])),
    ])
  )
  for (const input of inputs) {
    const payload: unknown = JSON.parse(readFileSync(input, 'utf8'))
    const parsed = call(
      f.createPropertyAccessExpression(f.createIdentifier('JSON'), 'parse'),
      [f.createStringLiteral(JSON.stringify(payload))]
    )
    const statement = f.createExpressionStatement(call(receiver, [parsed]))
    ts.addSyntheticLeadingComment(
      statement,
      ts.SyntaxKind.MultiLineCommentTrivia,
      ' @generated ',
      true
    )
    const locale = basename(input, '.json')
    outputFileSync(
      join(args.outDir, locale + '.js'),
      printer.printFile(f.updateSourceFile(source, [statement]))
    )
    outputFileSync(join(args.outDir, locale + '.d.ts'), declaration)
  }
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
