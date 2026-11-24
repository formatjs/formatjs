import {writeFileSync} from 'node:fs'
import minimist from 'minimist'
import {
  availableCollationLocales,
  collationLocaleData,
} from '@formatjs_generated/cldr.collation/locale-data.js'
import {
  combiningClasses,
  decimalDigitZeros,
  hanImplicitStart,
  hanRanges,
  hanRanks,
  hanWeightStep,
  numericOrderingElement,
  primaryReordering,
  rootElements,
  rootLogicalResets,
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
      logical_resets: rootLogicalResets,
      prefixes: rootPrefixEntries,
      trie: rootTrie,
      combining_classes: combiningClasses,
      decimal_digit_zeros: decimalDigitZeros,
      numeric_ordering_element: numericOrderingElement,
      han_ranges: hanRanges,
      han_ranks: hanRanks,
      han_implicit_start: hanImplicitStart,
      han_weight_step: hanWeightStep,
      primary_reordering: primaryReordering,
      tailorings: collationTailorings,
    }) + '\n'
  )
}
if (import.meta.filename === process.argv[1])
  main(minimist(process.argv.slice(2)) as Args)
