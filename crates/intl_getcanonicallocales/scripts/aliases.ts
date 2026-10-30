import {readFileSync, readdirSync} from 'node:fs'
import {outputFileSync} from 'fs-extra/esm'
import aliases from 'cldr-core/supplemental/aliases.json' with {type: 'json'}
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  out: string
}

interface TypeData {
  _alias?: string
  _preferred?: string
}

interface LanguageId {
  language: string
  script: string
  region: string
  variants: string[]
}

// UTS #35 preprocessing 1–4: parse alias types/replacements as Unicode language IDs.
// https://github.com/unicode-org/cldr/blob/11299982335beb974c1c63c45265184e759c0f41/docs/ldml/tr35.md#L4175-L4182
function parseLanguageId(value: string): LanguageId | undefined {
  const parts = value.split('-')
  const language = parts.shift()!.toLowerCase()
  if (!/^(?:[a-z]{2,3}|[a-z]{5,8})$/.test(language)) return
  let script = ''
  if (/^[a-z]{4}$/i.test(parts[0] || '')) {
    const part = parts.shift()!
    script = part[0].toUpperCase() + part.slice(1).toLowerCase()
  }
  let region = ''
  if (/^(?:[a-z]{2}|[0-9]{3})$/i.test(parts[0] || '')) {
    region = parts.shift()!.toUpperCase()
  }
  if (!parts.every(part => /^(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3})$/i.test(part)))
    return
  return {
    language,
    script,
    region,
    variants: parts.map(part => part.toLowerCase()),
  }
}

function main(args: Args) {
  // Preprocessing 1: cldr-core JSON already supplies hyphenated language IDs.
  const languageRules = Object.entries(
    aliases.supplemental.metadata.alias.languageAlias
  )
    .flatMap(([source, data]) => {
      const from = parseLanguageId(source)
      // Preprocessing 2–4: legacy input is rejected by ECMA-402; discard invalid types
      // and extract the remaining constraints (und contributes no language constraint).
      if (!from) return []
      const to = parseLanguageId(data._replacement)
      if (!to)
        throw new Error(
          `Invalid language alias replacement: ${data._replacement}`
        )
      const fields = [
        Number(from.language !== 'und'),
        Number(!!from.script),
        Number(!!from.region),
        from.variants.length,
      ]
      return [{from, replacement: data._replacement, fields, source}]
    })
    .sort((left, right) => {
      // Preprocessing 5.1: more constrained fields sort first.
      // https://github.com/unicode-org/cldr/blob/11299982335beb974c1c63c45265184e759c0f41/docs/ldml/tr35.md#L4184-L4189
      const score =
        right.fields.reduce((a, b) => a + b, 0) -
        left.fields.reduce((a, b) => a + b, 0)
      if (score) return score
      // Preprocessing 5.2: break ties by language, then script, region, variants.
      // https://github.com/unicode-org/cldr/blob/11299982335beb974c1c63c45265184e759c0f41/docs/ldml/tr35.md#L4190-L4204
      for (let i = 0; i < left.fields.length; i++) {
        if (!!left.fields[i] !== !!right.fields[i])
          return right.fields[i] ? 1 : -1
      }
      // Preprocessing 5.3 / 6: spelling breaks remaining ties; retain this rule order.
      // https://github.com/unicode-org/cldr/blob/11299982335beb974c1c63c45265184e759c0f41/docs/ldml/tr35.md#L4205-L4221
      return left.source < right.source
        ? -1
        : left.source > right.source
          ? 1
          : 0
    })
  // Group lookup is an optimization; runtime matching keeps the sorted rule order.
  const languageGroups = new Map<string, string[]>()
  for (const {from, replacement, fields} of languageRules) {
    const rules = languageGroups.get(from.language) || []
    rules.push(
      `            LanguageAliasRule { script: ${JSON.stringify(from.script)}, region: ${JSON.stringify(from.region)}, variants: &[${from.variants.map(value => JSON.stringify(value)).join(', ')}], replacement: ${JSON.stringify(replacement)}, specificity: ${fields.reduce((a, b) => a + b, 0)} },`
    )
    languageGroups.set(from.language, rules)
  }
  const independentLanguageRules = (languageGroups.get('und') || []).map(
    rule => `    ${rule.trimStart()}`
  )
  const languageCases = [...languageGroups]
    .filter(([language]) => language !== 'und')
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(
      ([language, rules]) =>
        `        ${JSON.stringify(language)} => &[\n${rules.join('\n')}\n        ],`
    )
    .join('\n')
  const directory = new URL(
    './bcp47/',
    import.meta.resolve('cldr-bcp47/package.json')
  )
  const entries: string[] = []
  for (const file of readdirSync(directory).sort()) {
    if (!file.endsWith('.json')) continue
    const {keyword} = JSON.parse(
      readFileSync(new URL(file, directory), 'utf8')
    ) as {
      keyword: Record<string, Record<string, Record<string, TypeData | string>>>
    }
    for (const [extension, keys] of Object.entries(keyword)) {
      for (const [key, types] of Object.entries(keys)) {
        for (const [type, metadata] of Object.entries(types)) {
          if (typeof metadata !== 'object') continue
          // Processing LocaleIds 2: preferred names and valid BCP 47 type aliases map
          // complete u/t values; grammar-invalid aliases cannot occur in accepted input.
          // https://github.com/unicode-org/cldr/blob/11299982335beb974c1c63c45265184e759c0f41/docs/ldml/tr35.md#L4262-L4266
          const canonical = metadata._preferred || type
          for (const alias of [type, ...(metadata._alias || '').split(' ')]) {
            const normalized = alias.toLowerCase()
            if (
              normalized === canonical ||
              !/^[a-z0-9]{3,8}(?:-[a-z0-9]{3,8})*$/.test(normalized)
            )
              continue
            entries.push(
              `        (${JSON.stringify(extension)}, ${JSON.stringify(key)}, ${JSON.stringify(normalized)}) => Some(${JSON.stringify(canonical)}),`
            )
          }
        }
      }
    }
  }
  // Processing LocaleIds 3: first subdivision replacement; territory codes gain zzzz.
  // https://github.com/unicode-org/cldr/blob/11299982335beb974c1c63c45265184e759c0f41/docs/ldml/tr35.md#L4267-L4271
  const subdivisions = Object.entries(
    aliases.supplemental.metadata.alias.subdivisionAlias
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([alias, data]) => {
      const first = data._replacement.split(' ')[0].toLowerCase()
      const replacement = first.length === 2 ? first + 'zzzz' : first
      return `        ${JSON.stringify(alias)} => Some(${JSON.stringify(replacement)}),`
    })
  // UTS #35 territory replacement: long unregistered languages have no likely region,
  // so their ICU compatibility path needs the first candidate rather than und inference.
  // https://github.com/unicode-org/cldr/blob/11299982335beb974c1c63c45265184e759c0f41/docs/ldml/tr35.md#L4128-L4149
  const territories = Object.entries(
    aliases.supplemental.metadata.alias.territoryAlias
  )
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(
      ([alias, data]) =>
        `        ${JSON.stringify(alias)} => Some(${JSON.stringify(data._replacement.split(' ')[0])}),`
    )
  outputFileSync(
    args.out,
    `// @generated by scripts/aliases.ts.\nuse super::LanguageAliasRule;\n\n#[rustfmt::skip]\npub(super) const INDEPENDENT_LANGUAGE_ALIASES: &[LanguageAliasRule] = &[\n${independentLanguageRules.join('\n')}\n];\n\n#[rustfmt::skip]\npub(super) fn language_aliases(language: &str) -> &'static [LanguageAliasRule] {\n    match language {\n        "und" => INDEPENDENT_LANGUAGE_ALIASES,\n${languageCases}\n        _ => &[],\n    }\n}\n\n#[rustfmt::skip]\npub fn extension_alias(extension: &str, key: &str, value: &str) -> Option<&'static str> {\n    match (extension, key, value) {\n${[...new Set(entries)].sort().join('\n')}\n        _ => None,\n    }\n}\n\n#[rustfmt::skip]\npub fn subdivision_alias(value: &str) -> Option<&'static str> {\n    match value {\n${subdivisions.join('\n')}\n        _ => None,\n    }\n}\n\n#[rustfmt::skip]\npub fn territory_alias(value: &str) -> Option<&'static str> {\n    match value {\n${territories.join('\n')}\n        _ => None,\n    }\n}\n`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
