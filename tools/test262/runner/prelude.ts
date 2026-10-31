import {readFileSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  input: string | string[]
  out: string
  sourceOut: string
}

// Test262 INTERPRETING.md: each test realm gets its own globals and $262 API.
// https://github.com/tc39/test262/blob/419d3e0a2273ba01a3bfcbec423f2801425b8e93/INTERPRETING.md#L20-L51
// Keep payloads out of eshost's per-test script compilation.
export function realmPrelude(sourceFile: string): string {
  return `(function install(file) {
    const createRealm = $262.createRealm;
    $262.createRealm = function (...args) {
      const realm = Reflect.apply(createRealm, this, args);
      const completion = realm.evalScript('(' + install.toString() + ')(' + JSON.stringify(file) + ')');
      if (completion && completion.type === 'throw') throw completion.value;
      return realm;
    };
    const completion = $262.evalScript(require('node:fs').readFileSync(file, 'utf8'));
    if (completion && completion.type === 'throw') throw completion.value;
  })(require('node:path').resolve(${JSON.stringify(sourceFile)}));`
}

export function main(args: Args): void {
  const inputs = ([] as string[]).concat(args.input || [])
  if (!inputs.length) throw new Error('At least one prelude input is required')
  if (!args.sourceOut) throw new Error('--sourceOut is required')
  const source = inputs.map(input => readFileSync(input, 'utf8')).join('\n;\n')
  writeFileSync(args.sourceOut, source)
  writeFileSync(args.out, realmPrelude(args.sourceOut))
}

if (import.meta.filename === resolve(process.argv[1])) {
  main(minimist<Args>(process.argv.slice(2)))
}
