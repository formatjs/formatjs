import {join} from 'node:path'
import {outputFileSync} from 'fs-extra/esm'

export function emitLocaleData(
  outDir: string,
  path: string,
  data: unknown,
  method: string,
  queue: string
) {
  const json = JSON.stringify(data)
  outputFileSync(
    join(outDir, path + '.js'),
    `/* @generated */
(function (data) {
  if (Intl.DateTimeFormat && typeof Intl.DateTimeFormat.${method} === 'function') {
    Intl.DateTimeFormat.${method}(data)
  } else {
    (globalThis.${queue} = globalThis.${queue} || []).push(data)
  }
})(JSON.parse(${JSON.stringify(json)}));
`
  )
  outputFileSync(join(outDir, path + '.d.ts'), 'export {}')
}
