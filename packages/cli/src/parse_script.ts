import {Opts, transform} from '@formatjs/ts-transformer'
import ts from 'typescript'
/**
 * Invoid TypeScript module transpilation with our TS transformer
 * @param opts Formatjs TS Transformer opt
 * @param fn filename
 */
export function parseScript(opts: Opts, fn?: string) {
  return (source: string) => {
    let output
    try {
      output = ts.transpileModule(source, {
        compilerOptions: {
          allowJs: true,
          target: ts.ScriptTarget.ESNext,
          noEmit: true,
          experimentalDecorators: true,
        },
        reportDiagnostics: true,
        fileName: fn,
        transformers: {
          before: [transform(opts)],
        },
      })
    } catch (e) {
      e.message = `Error processing file ${fn} 
${e.message || ''}`
      throw e
    }
    if (output.diagnostics) {
      const errs = output.diagnostics.filter(
        d => d.category === ts.DiagnosticCategory.Error
      )
      if (errs.length) {
        throw new Error(
          ts.formatDiagnosticsWithColorAndContext(errs, {
            getCanonicalFileName: fileName => fileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => ts.sys.newLine,
          })
        )
      }
    }
  }
}
