import {readFileSync} from 'node:fs'
import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import raw from 'cldr-bcp47/bcp47/timezone.json' with {type: 'json'}

interface Args extends minimist.ParsedArgs {
  source: string | string[]
  tab: string
  out: string
}
interface ZoneEntry {
  _alias?: string
  _iana?: string
  _preferred?: string
}
const whitespace = /\s+/
const newline = /\r?\n/
export function primaryZones(
  sources: string[],
  tab: string,
  entries: Record<string, ZoneEntry>
): Record<string, string> {
  const zones = new Set<string>(),
    identifiers = new Set<string>()
  for (const source of sources) {
    for (const line of source.split(newline)) {
      const fields = line.trim().split(whitespace)
      if (fields[0] === 'Zone') {
        zones.add(fields[1])
        identifiers.add(fields[1])
      } else if (fields[0] === 'Link') identifiers.add(fields[2])
    }
  }
  const primary = new Set(zones)
  for (const line of tab.split(newline)) {
    if (!line || line.startsWith('#')) continue
    const id = line.split('\t')[2]
    if (!identifiers.has(id)) throw new Error(`Missing IANA identifier: ${id}`)
    primary.add(id)
  }
  const aliases = new Map<string, string>()
  function preferred(
    key: string,
    seen = new Set<string>()
  ): string | undefined {
    if (seen.has(key)) throw new Error(`Cyclic CLDR timezone: ${key}`)
    seen.add(key)
    const entry = entries[key]
    if (!entry) throw new Error(`Missing CLDR timezone: ${key}`)
    return entry._preferred
      ? preferred(entry._preferred, seen)
      : (entry._iana ?? entry._alias?.split(' ')[0])
  }
  for (const [key, entry] of Object.entries(entries)) {
    const target = preferred(key)
    for (const id of (entry._alias ?? '').split(' '))
      if (id && target) aliases.set(id, target)
  }
  const result: Record<string, string> = Object.create(null)
  for (const id of [...identifiers].sort()) {
    let target = primary.has(id) ? id : aliases.get(id)
    if (target === 'Etc/UTC' || target === 'Etc/GMT' || target === 'GMT')
      target = 'UTC'
    if (!target || (target !== 'UTC' && !primary.has(target)))
      throw new Error(`Missing primary IANA timezone for ${id}: ${target}`)
    if (id !== target) result[id] = target
  }
  return result
}
function main(args: Args): void {
  const paths = ([] as string[]).concat(args.source || [])
  const entries: Record<string, ZoneEntry> = {}
  for (const [key, value] of Object.entries(raw.keyword.u.tz)) {
    if (typeof value === 'object') entries[key] = value
  }
  const aliases = primaryZones(
    paths.map(path => readFileSync(path, 'utf8')),
    readFileSync(args.tab, 'utf8'),
    entries
  )
  outputFileSync(
    args.out,
    `// @generated from pinned IANA and CLDR timezone identities.\nexport default ${JSON.stringify(aliases, null, 2)} as const\n`
  )
}
if (import.meta.filename === process.argv[1])
  main(minimist<Args>(process.argv.slice(2)))
