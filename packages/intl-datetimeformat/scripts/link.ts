import minimist from 'minimist'
import {readFileSync} from 'fs'
import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'

interface Args extends minimist.ParsedArgs {
  input: string | string[]
  out: string
}
export function parseLinks(source: string): Record<string, string> {
  const links: Record<string, string> = Object.create(null)
  for (const line of source.split('\n')) {
    const [kind, target, alias] = line.trim().split(/\s+/)
    if (kind === 'Link' && target && alias) links[alias] = target
  }
  return links
}
function main(args: Args) {
  const {input, out} = args
  const inputs = ([] as string[]).concat(input || [])
  const linkMap = parseLinks(
    inputs.map(path => readFileSync(path, 'utf8')).join('\n')
  )
  outputFileSync(
    out,
    `// @generated
// prettier-ignore
export default ${stringify(linkMap, {space: 2})}`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv.slice(2)) as Args)
}
