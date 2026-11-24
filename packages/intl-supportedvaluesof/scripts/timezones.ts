import {readFileSync} from 'node:fs'
import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import primary from '@formatjs_generated/tz/primary.js'

interface Args extends minimist.ParsedArgs {
  out: string
  zone: string[]
  source: string
}
function main(args: Args) {
  const timezones = new Set<string>(([] as string[]).concat(args.zone || []))
  // ECMA-402 §6.5.3 AvailablePrimaryTimeZoneIdentifiers, step 3.a.i:
  // primary identifiers include non-continental zones. DateTimeFormat's
  // transition-file list omits these fixed-offset Zone records from etcetera.
  // https://tc39.es/ecma402/#sec-availableprimarytimezoneidentifiers
  for (const line of readFileSync(args.source, 'utf8').split(/\r?\n/)) {
    const [kind, name] = line.trim().split(/\s+/)
    if (kind === 'Zone') timezones.add(name)
  }
  // IANA names both as Zones; ECMA-402 exposes only UTC as their primary ID.
  timezones.delete('Etc/GMT')
  timezones.delete('Etc/UTC')
  timezones.add('UTC')
  // DateTimeFormat preserves aliases; enumeration must still contain primaries.
  const primaries = new Set(
    [...timezones].map(name => primary[name as keyof typeof primary] ?? name)
  )
  outputFileSync(
    args.out,
    `/* @generated */
// prettier-ignore
export const timezones = ${JSON.stringify([...primaries].sort())} as const
export type Timezone = typeof timezones[number]
    `
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
