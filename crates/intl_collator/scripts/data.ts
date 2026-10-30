import {writeFileSync} from 'node:fs'
import minimist from 'minimist'
import {
  availableCollationLocales,
  collationLocaleData,
} from '@formatjs_generated/cldr.collation/locale-data.js'
import {
  rootElements,
  rootPrefixEntries,
  rootTrie,
} from '@formatjs_generated/cldr.collation/root.js'
import {collationTailorings} from '@formatjs_generated/cldr.collation/tailoring.js'
interface Args extends minimist.ParsedArgs {
  out: string
}
function main(args: Args) {
  if (!args.out) throw new Error('--out required')
  for (const locale of availableCollationLocales)
    if (!(locale in collationLocaleData))
      throw new Error('Missing collation metadata: ' + locale)
  writeFileSync(
    args.out,
    JSON.stringify({
      available: availableCollationLocales,
      locales: collationLocaleData,
      elements: rootElements,
      prefixes: rootPrefixEntries,
      trie: rootTrie,
      tailorings: collationTailorings,
    }) + '\n'
  )
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
