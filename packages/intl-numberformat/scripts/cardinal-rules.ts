import {writeFileSync} from 'node:fs'
import {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales'
import {defaultContent} from '@formatjs_generated/cldr.supported-locales/default-content.js'
import plurals from 'cldr-core/supplemental/plurals.json' with {type: 'json'}
import minimist from 'minimist'
import {PluralRulesCompiler} from '#packages/intl-pluralrules/scripts/plural-rules-compiler.ts'

interface Args extends minimist.ParsedArgs {
  out: string
}

function main({out}: Args) {
  const rules = plurals.supplemental['plurals-type-cardinal']
  const functions = new Map<string, string>()
  const tags = new Map<string, string>()
  for (const locale of Object.keys(rules).sort()) {
    const source = new PluralRulesCompiler(
      locale,
      rules[locale as keyof typeof rules]
    ).compile()
    let name = functions.get(source)
    if (name === undefined) {
      name = 'rule' + functions.size
      functions.set(source, name)
    }
    const [canonical] = getCanonicalLocales(locale)
    for (const tag of getCanonicalLocales([
      locale,
      ...(defaultContent[canonical] || []),
    ])) {
      if (!tags.has(tag) || tag === canonical) tags.set(tag, name)
    }
  }
  const declarations = [...functions].map(
    ([source, name]) => `const ${name} = ${source}`
  )
  const entries = [...tags].map(
    ([tag, name]) => `${JSON.stringify(tag)}: ${name}`
  )
  writeFileSync(
    out,
    `// @ts-nocheck
${declarations.join('\n')}
type Category = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'
export const cardinalRules: Readonly<Record<string, (decimal: string, ordinal: false) => Category>> = {
  __proto__: null,
  ${entries.join(',\n  ')}
}
`
  )
}

if (import.meta.filename === process.argv[1])
  main(minimist<Args>(process.argv.slice(2)))
