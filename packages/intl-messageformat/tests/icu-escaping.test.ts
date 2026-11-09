import {execFileSync} from 'node:child_process'
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'
import {expect, test} from 'vitest'
import {parse} from '@formatjs/icu-messageformat-parser'
import {printAST} from '@formatjs/icu-messageformat-parser/printer.js'
import {hoistSelectors} from '@formatjs/icu-messageformat-parser/manipulator.js'
import {IntlMessageFormat} from '#packages/intl-messageformat/index.js'

test('escapes match ICU4J fixtures verified independently by ICU4C', () => {
  const rows = readFileSync(process.env.MESSAGEFORMAT_ESCAPE_FIXTURES!, 'utf8')
    .trimEnd()
    .split('\n')
    .slice(1)
  expect(rows.length).toBeGreaterThan(0)
  const printedRows = ['case\tn\tg\tpattern\texpected']
  for (const row of rows) {
    const [id, n, g, pattern, expected] = row.split('\t')
    const values = {
      '0': 3,
      '1': 'x',
      '2': 'Y',
      n: Number(n),
      g,
      x: 'X',
      name: 'Ada',
    }
    for (const captureEscapes of [false, true]) {
      if (expected === '!PARSE_ERROR') {
        expect(() => parse(pattern, {captureEscapes}), row).toThrow()
        continue
      }
      const ast = JSON.parse(JSON.stringify(parse(pattern, {captureEscapes})))
      const printed = printAST(ast)
      printedRows.push(
        [`${id}-${captureEscapes}`, n, g, printed, expected].join('\t')
      )
      const context = `ICU case ${id}: ${pattern}; n=${n}, g=${g}, capture=${captureEscapes}`
      expect(new IntlMessageFormat(ast, 'en').format(values), context).toBe(
        expected
      )
      expect(new IntlMessageFormat(printed, 'en').format(values), context).toBe(
        expected
      )
      const flattened = hoistSelectors(ast)
      const flatMessage = printAST(flattened)
      expect(
        new IntlMessageFormat(flattened, 'en').format(values),
        context
      ).toBe(expected)
      expect(
        new IntlMessageFormat(flatMessage, 'en').format(values),
        context
      ).toBe(expected)
      printedRows.push(
        [`${id}-flat-${captureEscapes}`, n, g, flatMessage, expected].join('\t')
      )
    }
  }
  const directory = mkdtempSync(join(tmpdir(), 'formatjs-icu-escapes-'))
  try {
    const path = join(directory, 'printed.tsv')
    writeFileSync(path, printedRows.join('\n') + '\n')
    execFileSync(resolve(process.env.MESSAGEFORMAT_ESCAPE_ORACLE!), [
      '--verify',
      path,
    ])
  } finally {
    rmSync(directory, {recursive: true, force: true})
  }
})
