import {supplemental} from 'cldr-core/supplemental/likelySubtags.json'
import {outputJsonSync} from 'fs-extra/esm'
import minimist from 'minimist'

interface Args {
  out: string
}

const UND_LOCALE = /^und-([A-Z]{2})$/

function main(args: Args) {
  const {likelySubtags} = supplemental
  outputJsonSync(
    args.out,
    Object.keys(likelySubtags)
      .filter(k => k.match(UND_LOCALE))
      .reduce<Record<string, string>>((all, locale) => {
        const region = locale.match(UND_LOCALE)![1]
        all[region] = likelySubtags[locale as 'und']
        return all
      }, {})
  )
}

if (require.main === module) {
  main(minimist<Args>(process.argv))
}
