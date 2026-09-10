import {readFileSync} from 'node:fs'
import minimist from 'minimist'
import {outputFileSync} from 'fs-extra/esm'

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
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L338-L340
  for (const line of readFileSync(args.source, 'utf8').split(/\r?\n/)) {
    const [kind, name] = line.trim().split(/\s+/)
    if (kind === 'Zone') timezones.add(name)
  }
  timezones.add('UTC')
  outputFileSync(
    args.out,
    `/* @generated */
// prettier-ignore
export const timezones = ${JSON.stringify([...timezones].sort())} as const
export type Timezone = typeof timezones[number]
    `
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv))
}
