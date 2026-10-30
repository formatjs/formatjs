import minimist from 'minimist'
import {readFileSync} from 'fs'
import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'
export function parseLinks(source: string): Record<string, string> {
  const links: Record<string, string> = Object.create(null)
  for (const line of source.split('\n')) {
    const [kind, target, alias] = line.trim().split(/\s+/)
    if (kind === 'Link' && target && alias) links[alias] = target
  }
  return links
}
function main(args: minimist.ParsedArgs) {
  const {input, out} = args
  const linkMap = parseLinks(readFileSync(input, 'utf8'))
  outputFileSync(
    out,
    `// @generated
// prettier-ignore
export default ${stringify(linkMap, {space: 2})}`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist(process.argv))
}
