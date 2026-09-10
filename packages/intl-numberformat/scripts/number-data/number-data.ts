import {XMLParser} from 'fast-xml-parser'

export interface NumberPathPart {
  name: string
  attributes?: Readonly<Record<string, string>>
}

type Path = readonly NumberPathPart[]
type Node = Record<string, unknown>
interface Bundle {
  systems: Set<string>
  values: Map<string, string>
  aliases: Map<string, string>
}

const NUMBER_SECTIONS = new Set([
  'symbols',
  'decimalFormats',
  'scientificFormats',
  'miscPatterns',
  'rationalFormats',
  'percentFormats',
  'currencyFormats',
])

const parser = new XMLParser({
  ignoreAttributes: false,
  htmlEntities: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  alwaysCreateTextNode: true,
})

function key(path: Path): string {
  return JSON.stringify(
    path.map(part => {
      const attributes = part.attributes || {}
      return [
        part.name,
        Object.keys(attributes)
          .sort()
          .map(name => [name, attributes[name]]),
      ]
    })
  )
}

function object(value: unknown): Node | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Node)
    : undefined
}

function parseBundle(source: string): Bundle {
  const bundle: Bundle = {
    values: new Map(),
    aliases: new Map(),
    systems: new Set(),
  }
  const parsed = parser.parse(source) as Node
  const numbers = object(object(parsed.ldml)?.numbers)
  if (!numbers) return bundle
  function visit(node: Node, path: Path): void {
    // Match the contributed/approved threshold used by CLDR JSON and ICU.
    // https://github.com/unicode-org/cldr-json#latest-release
    // https://github.com/unicode-org/cldr-json/blob/bb334e8d6250c9363e957e131bf7e6d08ec72f91/README.md#L11-L13
    if (node['@_draft'] === 'unconfirmed' || node['@_draft'] === 'provisional')
      return
    const alias = object(node.alias)
    if (alias) {
      if (
        alias['@_source'] !== 'locale' ||
        typeof alias['@_path'] !== 'string'
      ) {
        throw new Error('Unsupported number-data alias source')
      }
      bundle.aliases.set(key(path), alias['@_path'])
      return
    }
    if (typeof node['#text'] === 'string' && node['#text'] !== '↑↑↑') {
      bundle.values.set(key(path), node['#text'])
    }
    for (const name of Object.keys(node)) {
      const value = node[name]
      if (name.startsWith('@_') || name === '#text') continue
      if (!path.length && !NUMBER_SECTIONS.has(name)) continue
      for (const item of Array.isArray(value) ? value : [value]) {
        const child = object(item)
        if (!child) continue
        const attributes: Record<string, string> = {}
        for (const attribute of Object.keys(child)) {
          const text = child[attribute]
          if (
            attribute.startsWith('@_') &&
            attribute !== '@_draft' &&
            attribute !== '@_references'
          ) {
            attributes[attribute.slice(2)] = String(text)
          }
        }
        if (!path.length && attributes.numberSystem)
          bundle.systems.add(attributes.numberSystem)
        visit(child, [...path, {name, attributes}])
      }
    }
  }
  visit(numbers, [])
  return bundle
}

// The pinned number data uses these LDML alias forms. Fail on new syntax rather
// than silently applying an incomplete XPath interpretation.
function aliasTarget(path: Path, source: string): NumberPathPart[] {
  const parent = path.slice(0, -1)
  for (const name of [
    'symbols',
    'decimalFormats',
    'scientificFormats',
    'miscPatterns',
    'rationalFormats',
    'percentFormats',
    'currencyFormats',
  ]) {
    if (source === `../${name}[@numberSystem='latn']`) {
      return [...parent, {name, attributes: {numberSystem: 'latn'}}]
    }
  }
  if (source === "../currencyFormat[@type='standard']") {
    return [...parent, {name: 'currencyFormat', attributes: {type: 'standard'}}]
  }
  if (source === "../decimalFormatLength[@type='short']") {
    return [
      ...parent,
      {name: 'decimalFormatLength', attributes: {type: 'short'}},
    ]
  }
  if (
    source === "../../currencyFormats[@numberSystem='latn']/currencySpacing"
  ) {
    return [
      ...path.slice(0, -2),
      {name: 'currencyFormats', attributes: {numberSystem: 'latn'}},
      {name: 'currencySpacing'},
    ]
  }
  throw new Error(`Unsupported number-data alias path: ${source}`)
}

export class NumberDataResolver {
  private readonly bundles = new Map<string, Bundle>()
  private readonly cache = new Map<string, string | undefined>()

  constructor(
    sources: ReadonlyMap<string, string>,
    private readonly parent: (locale: string) => string | undefined
  ) {
    for (const [locale, source] of sources)
      this.bundles.set(locale, parseBundle(source))
  }

  clearCache(): void {
    this.cache.clear()
  }

  usesLatinData(requestedLocale: string, system: string): boolean {
    const seen = new Set<string>()
    for (
      let locale: string | undefined = requestedLocale;
      locale !== undefined && locale !== 'root';
      locale = this.parent(locale)
    ) {
      if (seen.has(locale)) throw new Error('Cyclic number-data parent locale')
      seen.add(locale)
      if (this.bundles.get(locale)?.systems.has(system)) return false
    }
    const root = this.bundles.get('root')
    return [
      'symbols',
      'decimalFormats',
      'percentFormats',
      'currencyFormats',
      'miscPatterns',
    ].every(
      name =>
        root?.aliases.get(key([{name, attributes: {numberSystem: system}}])) ===
        `../${name}[@numberSystem='latn']`
    )
  }

  get(locale: string, path: Path): string | undefined {
    return this.resolve(locale, path, new Set())
  }

  private resolve(
    requestedLocale: string,
    path: Path,
    active: Set<string>
  ): string | undefined {
    const cacheKey = JSON.stringify([requestedLocale, key(path)])
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)
    if (active.has(cacheKey)) throw new Error('Cyclic number-data alias')
    active.add(cacheKey)
    try {
      const result = this.lookup(requestedLocale, path, active)
      this.cache.set(cacheKey, result)
      return result
    } finally {
      active.delete(cacheKey)
    }
  }

  private lookup(
    requestedLocale: string,
    path: Path,
    active: Set<string>
  ): string | undefined {
    const seen = new Set<string>()
    for (
      let locale: string | undefined = requestedLocale;
      locale !== undefined;
      locale = this.parent(locale)
    ) {
      if (seen.has(locale)) throw new Error('Cyclic number-data parent locale')
      seen.add(locale)
      const bundle = this.bundles.get(locale)
      if (!bundle) continue
      const exact = bundle.values.get(key(path))
      if (exact !== undefined) return exact
      // LDML count=other fallback precedes parent-locale inheritance.
      // https://unicode.org/reports/tr35/tr35.html#Count_Fallback_normal
      // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L2033-L2042
      if (
        path.some(
          part => part.attributes?.count && part.attributes.count !== 'other'
        )
      ) {
        const other = path.map(part =>
          part.attributes?.count
            ? {...part, attributes: {...part.attributes, count: 'other'}}
            : part
        )
        const value = bundle.values.get(key(other))
        if (value !== undefined) return value
      }
      for (let length = path.length; length >= 0; length--) {
        const prefix = path.slice(0, length)
        const alias = bundle.aliases.get(key(prefix))
        if (alias === undefined) continue
        // A root alias changes the path and restarts at the requested locale.
        // https://unicode.org/reports/tr35/tr35.html#Lookup-Differences
        // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35.md#L1915
        return this.resolve(
          requestedLocale,
          [...aliasTarget(prefix, alias), ...path.slice(length)],
          active
        )
      }
    }
    return undefined
  }
}
