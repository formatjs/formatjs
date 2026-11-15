import {writeFileSync} from 'node:fs'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  wasm: string
  out: string
}

export function main(args: Args): void {
  writeFileSync(
    args.out,
    `
globalThis.TextEncoder ??= require('node:util').TextEncoder;
globalThis.TextDecoder ??= require('node:util').TextDecoder;
globalThis.__formatjsTemporalWasmInstance = new WebAssembly.Instance(new WebAssembly.Module(
  require('node:fs').readFileSync(require('node:path').resolve(${JSON.stringify(args.wasm)}))
), {});
`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
