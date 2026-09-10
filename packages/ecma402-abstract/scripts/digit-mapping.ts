import minimist, {type ParsedArgs} from 'minimist'
import {outputFileSync} from 'fs-extra/esm'
import stringify from 'json-stable-stringify'
import numberingSystems from 'cldr-core/supplemental/numberingSystems.json' with {type: 'json'}

interface Args extends ParsedArgs {
  out: string
}

function main(args: Args) {
  if (!args.out) throw new Error('--out is required')
  const digitMapping: Record<string, string[]> = {}
  // ECMA-402 §16.5.5 step 4.c.iii.1.a uses the ten code points in Table 30.
  // https://tc39.es/ecma402/#table-numbering-system-digits
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L844-L855
  // CLDR supplies complete digit strings, including non-contiguous hanidec.
  for (const [name, definition] of Object.entries(
    numberingSystems.supplemental.numberingSystems
  )) {
    // Latin digits need no substitution; algorithmic systems need other rules.
    if (name === 'latn' || definition._type !== 'numeric') continue
    if (!('_digits' in definition))
      throw new Error(`Missing digits for ${name}`)
    const digits = Array.from(definition._digits)
    if (digits.length !== 10) throw new Error(`Expected ten digits for ${name}`)
    digitMapping[name] = digits
  }
  outputFileSync(
    args.out,
    `export const digitMapping: Record<string, ReadonlyArray<string>> = ${stringify(
      digitMapping,
      {space: 2}
    )};`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
