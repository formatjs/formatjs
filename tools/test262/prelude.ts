import {readFileSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  input: string | string[]
  out: string
}

// Test262 INTERPRETING.md: each test realm gets its own globals and $262 API.
// https://github.com/tc39/test262/blob/419d3e0a2273ba01a3bfcbec423f2801425b8e93/INTERPRETING.md#L20-L51
export function realmPrelude(source: string): string {
  return `(function install(source) {
    const createRealm = $262.createRealm;
    $262.createRealm = function (...args) {
      const realm = Reflect.apply(createRealm, this, args);
      const completion = realm.evalScript('(' + install.toString() + ')(' + JSON.stringify(source) + ')');
      if (completion && completion.type === 'throw') throw completion.value;
      return realm;
    };
    const completion = $262.evalScript(source);
    if (completion && completion.type === 'throw') throw completion.value;
  })(${JSON.stringify(source)});`
}

export function main(args: Args): void {
  const inputs = ([] as string[]).concat(args.input || [])
  if (!inputs.length) throw new Error('At least one prelude input is required')
  const source = inputs.map(input => readFileSync(input, 'utf8')).join('\n;\n')
  writeFileSync(args.out, realmPrelude(source))
}

if (import.meta.filename === resolve(process.argv[1])) {
  main(minimist<Args>(process.argv.slice(2)))
}
