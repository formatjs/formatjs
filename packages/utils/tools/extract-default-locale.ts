import {supplemental} from 'cldr-core/supplemental/likelySubtags.json'
import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'

interface Args {
  out: string
}

const UND_LOCALE = /^und-([A-Z]{2})$/

function main(args: Args) {
  const {likelySubtags} = supplemental
  const data = Object.keys(likelySubtags)
    .filter(k => k.match(UND_LOCALE))
    .reduce<Record<string, string>>((all, locale) => {
      const region = locale.match(UND_LOCALE)![1]
      all[region] = likelySubtags[locale as 'und']
      return all
    }, {})
  outputFileSync(
    args.out,
    `
      // This is a generated file. Do not edit directly.
      export default ${JSON.stringify(data, null, 2)} as const;`
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
