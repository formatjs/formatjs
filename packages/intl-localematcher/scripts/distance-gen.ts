import matching from 'cldr-core/supplemental/languageMatching.json' with {type: 'json'}
import containment from 'cldr-core/supplemental/territoryContainment.json' with {type: 'json'}
import likely from 'cldr-core/supplemental/likelySubtags.json' with {type: 'json'}
import aliases from 'cldr-core/supplemental/aliases.json' with {type: 'json'}
import {outputFileSync} from 'fs-extra/esm'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  out: string
  rust?: boolean
}

interface Rule {
  _desired: string
  _supported: string
  _distance: number
  _oneway?: boolean
}

// Compile the same CLDR rules for both runtimes. Keep first-match precedence.
function main(args: Args) {
  const source = matching.supplemental.languageMatching['written-new']
  const rules: Rule[] = source.languageMatch
  const tree = containment.supplemental.territoryContainment as Record<
    string,
    {_contains: string[]}
  >
  function leaves(region: string): string[] {
    return tree[region] ? tree[region]._contains.flatMap(leaves) : [region]
  }
  const variables = Object.fromEntries(
    Object.entries(source.matchVariables).map(([key, value]) => [
      key,
      new Set(value._value.split('+').flatMap(leaves)),
    ])
  )
  const regionRules = rules.filter(r => r._desired.split('-').length === 3)
  const selectors = [
    ...new Set(
      regionRules.flatMap(r => [
        r._desired.split('-')[2],
        r._supported.split('-')[2],
      ])
    ),
  ].sort()
  function includes(selector: string, region: string): boolean {
    if (selector === '*') return true
    if (selector.startsWith('$!')) {
      return !variables['$' + selector.slice(2)].has(region)
    }
    return selector.startsWith('$')
      ? variables[selector].has(region)
      : selector === region
  }
  const partitions: string[] = []
  const regionPartition = new Map<string, number>()
  for (const region of [...new Set(leaves('001'))].sort()) {
    const signature = selectors
      .map(s => (includes(s, region) ? '1' : '0'))
      .join('')
    let partition = partitions.indexOf(signature)
    if (partition < 0) {
      partition = partitions.length
      partitions.push(signature)
    }
    regionPartition.set(region, partition)
  }
  const regions: Record<string, number[]> = {}
  for (const region of [
    ...new Set([...regionPartition.keys(), ...Object.keys(tree)]),
  ].sort()) {
    if (region.includes('-')) continue
    regions[region] = [
      ...new Set(leaves(region).map(r => regionPartition.get(r)!)),
    ].sort((a, b) => a - b)
  }
  const language: Record<string, number> = {}
  const script: Record<string, number> = {}
  const region: Record<string, number[]> = {}
  const defaults = [80, 50, 4]
  for (const rule of rules) {
    const desired = rule._desired.split('-')
    const supported = rule._supported.split('-')
    if (desired.every(s => s === '*') && supported.every(s => s === '*')) {
      defaults[desired.length - 1] = rule._distance
      continue
    }
    for (const [d, s] of rule._oneway
      ? [[desired, supported]]
      : [
          [desired, supported],
          [supported, desired],
        ]) {
      const key = [d[0], s[0], ...(d.length > 1 ? [d[1], s[1]] : [])].join('|')
      if (d.length < 3) {
        const table = d.length === 1 ? language : script
        table[key] ??= rule._distance
      } else {
        const matrix = (region[key] ??= Array(partitions.length ** 2).fill(-1))
        const di = selectors.indexOf(d[2])
        const si = selectors.indexOf(s[2])
        for (let i = 0; i < partitions.length; i++) {
          for (let j = 0; j < partitions.length; j++) {
            const offset = i * partitions.length + j
            if (
              matrix[offset] < 0 &&
              partitions[i][di] === '1' &&
              partitions[j][si] === '1'
            ) {
              matrix[offset] = rule._distance
            }
          }
        }
      }
    }
  }
  for (const matrix of Object.values(region)) {
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i] < 0) matrix[i] = defaults[2]
    }
  }
  const cldrVersion = matching.supplemental.version._cldrVersion
  const likelyRegions = Object.fromEntries(
    Object.entries(likely.supplemental.likelySubtags)
      .filter(([key]) => /^und-(?:[A-Z]{2}|[0-9]{3})$/.test(key))
      .map(([key, value]) => [key.slice(4), value])
  )
  const macroRegions = Object.keys(likelyRegions).filter(key =>
    /^[0-9]{3}$/.test(key)
  )
  const basicTag =
    /^(?:[a-z]{2,3}|[a-z]{5,8})(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/
  const alias = aliases.supplemental.metadata.alias
  const canonicalAliases = {
    language: [
      ...new Set(
        Object.keys(alias.languageAlias)
          .filter(key => basicTag.test(key))
          .map(key => key.split('-')[0])
      ),
    ].sort(),
    script: Object.keys(alias.scriptAlias).sort(),
    region: Object.keys(alias.territoryAlias)
      .filter(key => /^(?:[A-Z]{2}|[0-9]{3})$/.test(key))
      .sort(),
  }
  const minLsrDistance = Math.min(
    ...defaults,
    ...Object.values(language),
    ...Object.values(script),
    ...Object.values(region).flat()
  )
  const demotion =
    region['en|en|*|*']?.[
      regionPartition.get('US')! * partitions.length +
        regionPartition.get('GB')!
    ] ?? defaults[2]
  const data = {
    language,
    script,
    region,
    regions,
    defaults,
    partitionCount: partitions.length,
    paradigms: source.paradigmLocales._locales,
    cldrVersion,
    macroRegions,
    canonicalAliases,
    minLsrDistance,
    demotion,
  }
  if (!args.rust) {
    outputFileSync(
      args.out,
      `// Generated from CLDR supplemental data.\nexport const matchingData: {\n language: Record<string, number>; script: Record<string, number>;\n region: Record<string, number[]>; regions: Record<string, number[]>;\n defaults: number[]; partitionCount: number; paradigms: string[]; cldrVersion: string; macroRegions: string[];\n canonicalAliases: {language: string[]; script: string[]; region: string[]}; minLsrDistance: number; demotion: number;\n} = ${JSON.stringify(data)}\n`
    )
    return
  }
  const strings = (values: string[]) =>
    values.map(s => JSON.stringify(s)).join(',')
  const table = (
    name: string,
    values: Record<string, number | number[]>,
    list: boolean
  ) =>
    `#[rustfmt::skip]\npub const ${name}: &[(&str, ${list ? '&[u8]' : 'u8'})] = &[\n${Object.entries(
      values
    )
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(
        ([k, v]) =>
          `(${JSON.stringify(k)},${Array.isArray(v) ? `&[${v.join(',')}]` : v}),`
      )
      .join('\n')}\n];\n`
  outputFileSync(
    args.out,
    '// Generated by packages/intl-localematcher/scripts/distance-gen.ts.\n' +
      table('LANGUAGE', language, false) +
      table('SCRIPT', script, false) +
      table('REGION', region, true) +
      table('REGIONS', regions, true) +
      `pub const DEFAULTS: [u8; 3] = [${defaults.join(', ')}];\n` +
      `pub const PARTITION_COUNT: usize = ${partitions.length};\n` +
      `#[rustfmt::skip]\npub const PARADIGMS: &[&str] = &[${strings(data.paradigms)}];\n` +
      `pub const CLDR_VERSION: &str = ${JSON.stringify(cldrVersion)};\n` +
      `#[rustfmt::skip]\npub const LANGUAGE_KEYS: &[&str] = &[${strings([...new Set(Object.keys(language).map(key => key.split('|')[0]))].sort())}];\n` +
      `#[rustfmt::skip]\npub const MACRO_REGIONS: &[&str] = &[${strings(macroRegions)}];\n` +
      `#[rustfmt::skip]\npub const LIKELY_REGIONS: &[(&str, &str)] = &[\n${Object.entries(
        likelyRegions
      )
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => `(${JSON.stringify(k)},${JSON.stringify(v)}),`)
        .join('\n')}\n];\n`
  )
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
