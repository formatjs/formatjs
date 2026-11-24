import {canonicalCollation} from './canonical-collation.js'
import {basename} from 'node:path'
import minimist from 'minimist'
import {readdirSync, readFileSync, statSync} from 'node:fs'
import {outputFileSync} from 'fs-extra/esm'
import {
  parseLDMLCollations,
  type CollationRule,
} from './parse-ldml-collation.js'

type CaseFirst = 'false' | 'upper' | 'lower'
type TailoringDefaults = {caseFirst: CaseFirst; ignorePunctuation: boolean}

type GeneratedLocaleData = {
  readonly co: readonly string[]
  readonly kn: readonly ['false', 'true']
  readonly kf: readonly CaseFirst[]
  readonly searchKf: readonly CaseFirst[]
  readonly defaultCollation: string
  readonly sensitivity: 'variant'
  readonly ignorePunctuation: boolean
  readonly searchIgnorePunctuation: boolean
  readonly collationDefaults: Record<string, TailoringDefaults>
}

type LocaleMetadata = Pick<
  GeneratedLocaleData,
  'co' | 'kn' | 'defaultCollation' | 'sensitivity'
>

const DEFAULT_COLLATION_RE =
  /<defaultCollation\b[^>]*>([^<]+)<\/defaultCollation>/i
const UNDERSCORE_RE = /_/g
const WHITESPACE_RE = /\s+/g

// ECMA-402 §10.2.3 defines the Collator locale data for co, kf, and kn.
// https://tc39.es/ecma402/#sec-initializecollator
// https://tc39.es/ecma402/#sec-intl-collator-internal-slots

function collationPaths(dir: string): string[] {
  const entries = readdirSync(dir).flatMap(entry => {
    const path = `${dir}/${entry}`
    return statSync(path).isDirectory() ? collationPaths(path) : [path]
  })
  return entries.filter(path => path.endsWith('.xml')).sort()
}

function collationPathList(input: string | string[] | undefined): string[] {
  return (Array.isArray(input) ? input.join(' ') : input || '')
    .split(WHITESPACE_RE)
    .filter(path => path.endsWith('.xml'))
    .sort()
}

function collationPathsFromCopyConfig(dir: string): string[] {
  const configPath = `${dir}_config.json`
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
    files: Array<{path: string}>
  }
  return config.files
    .map(file => file.path)
    .filter(path => path.endsWith('.xml'))
    .sort()
}

function localeFromPath(path: string): string {
  return basename(path, '.xml').replace(UNDERSCORE_RE, '-')
}

function defaultCollation(source: string): string {
  // LDML <defaultCollation> defines the locale default collation type used by
  // type fallback when the requested ECMA-402 collation is "default".
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Collation_Type_Fallback
  return DEFAULT_COLLATION_RE.exec(source)?.[1].trim() || 'standard'
}

function serialize(value: unknown): string {
  return JSON.stringify(value)
}

const argv = minimist(process.argv.slice(2), {
  string: ['collationDir', 'collationPath', 'collationPaths', 'out'],
})

if (!argv.collationDir && !argv.collationPath && !argv.collationPaths) {
  throw new Error(
    '--collationDir, --collationPath, or --collationPaths is required'
  )
}
if (!argv.out) {
  throw new Error('--out is required')
}

const baseLocaleData: Record<string, LocaleMetadata> = {}
const localeRules = new Map<string, Map<string, CollationRule[]>>()

function applyTailoringDefaults(
  locale: string,
  type: string,
  defaults: TailoringDefaults,
  active: Set<string>
) {
  while (locale !== 'root' && !localeRules.get(locale)?.has(type)) {
    const parent = locale.lastIndexOf('-')
    locale = parent < 0 ? 'root' : locale.slice(0, parent)
  }
  const key = locale + '|' + type
  if (active.has(key)) return
  active.add(key)
  // LDML imports contribute settings in order, including later overrides.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Special_Purpose_Commands
  for (const rule of localeRules.get(locale)?.get(type) || []) {
    if (rule.type === 'caseFirst') {
      defaults.caseFirst =
        rule.value === 'upper' || rule.value === 'lower' ? rule.value : 'false'
    } else if (rule.type === 'alternate') {
      defaults.ignorePunctuation = rule.value === 'shifted'
    } else if (rule.type === 'import') {
      const [source, collation = 'standard'] = rule.value.split('-u-co-', 2)
      applyTailoringDefaults(
        source === 'und' ? 'root' : source,
        collation,
        defaults,
        active
      )
    }
  }
  active.delete(key)
}

function tailoringDefaults(locale: string, type: string): TailoringDefaults {
  const defaults: TailoringDefaults = {
    caseFirst: 'false',
    ignorePunctuation: false,
  }
  applyTailoringDefaults(locale, type, defaults, new Set())
  return defaults
}

function caseFirstValues(defaultValue: CaseFirst): CaseFirst[] {
  const values: CaseFirst[] = ['false', 'upper', 'lower']
  return [defaultValue, ...values.filter(value => value !== defaultValue)]
}

const paths =
  argv.collationPath !== undefined
    ? collationPathList(argv.collationPath)
    : argv.collationPaths === undefined
      ? collationPaths(argv.collationDir)
      : collationPathList(argv.collationPaths)
const resolvedPaths =
  paths.length === 0 && argv.collationDir
    ? collationPathsFromCopyConfig(argv.collationDir)
    : paths

for (const path of resolvedPaths) {
  const source = readFileSync(path, 'utf8')
  const locale = localeFromPath(path)
  const defaultType = defaultCollation(source)
  const collations = parseLDMLCollations(locale, source)
  localeRules.set(
    locale,
    new Map(
      collations
        .filter(collation => collation.rules.length)
        .map(collation => [canonicalCollation(collation.type), collation.rules])
    )
  )
  const collationTypes = new Set<string>(['default'])
  // ECMA-402 exposes supported "co" values through locale data. Keep
  // non-standard/search LDML types plus the locale default type.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Collation_Types
  for (const collation of collations) {
    if (
      collation.type !== 'standard' &&
      collation.type !== 'search' &&
      !collation.type.startsWith('private-') &&
      collation.type !== defaultType
    ) {
      collationTypes.add(canonicalCollation(collation.type))
    }
  }
  if (defaultType !== 'standard' && defaultType !== 'search') {
    collationTypes.add(canonicalCollation(defaultType))
  }
  baseLocaleData[locale] = {
    co: [...collationTypes].sort(),
    kn: ['false', 'true'],
    defaultCollation: canonicalCollation(defaultType),
    sensitivity: 'variant',
  }
}

// Root collations apply to every language; their rules remain shared.
const rootTypes = baseLocaleData.root?.co || []
const localeData: Record<string, GeneratedLocaleData> = {}
for (const [locale, data] of Object.entries(baseLocaleData)) {
  // ECMA-402 §10.1.1 selects sort or search locale data before resolving kf
  // and the locale's ignorePunctuation default.
  // https://tc39.es/ecma402/#sec-intl.collator
  const sort = tailoringDefaults(locale, data.defaultCollation)
  const search = tailoringDefaults(locale, 'search')
  const co = [...new Set([...rootTypes, ...data.co])].sort()
  localeData[locale] = {
    ...data,
    co,
    kf: caseFirstValues(sort.caseFirst),
    searchKf: caseFirstValues(search.caseFirst),
    ignorePunctuation: sort.ignorePunctuation,
    searchIgnorePunctuation: search.ignorePunctuation,
    collationDefaults: Object.fromEntries(
      co
        .filter(type => type !== 'default')
        .map(type => [type, tailoringDefaults(locale, type)] as const)
        .filter(
          ([, defaults]) =>
            defaults.caseFirst !== sort.caseFirst ||
            defaults.ignorePunctuation !== sort.ignorePunctuation
        )
    ),
  }
}

// ECMA-402 §9 Available Locales List: every entry must be a well-formed,
// canonical language tag. CLDR "root" is data inheritance, not a language tag.
// This is a list constraint, not an algorithm step.
// https://tc39.es/ecma402/#available-locales-list
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L6
const availableLocales = Object.keys(localeData)
  .filter(locale => locale !== 'root')
  .sort()

// Compact candidate locales let enumeration probe locale-specific collations
// without shipping the collation rules or constructing every locale/type pair.
const collationLocales: Record<string, string[]> = {}
for (const locale of Object.keys(localeData)) {
  // A script/region locale also exposes its parent's collation types.
  for (
    let parent = locale;
    parent;
    parent = parent.includes('-')
      ? parent.slice(0, parent.lastIndexOf('-'))
      : ''
  ) {
    for (const type of localeData[parent]?.co || []) {
      if (type === 'default') continue
      const locales = (collationLocales[type] ||= [])
      const candidate = locale === 'root' ? 'en' : locale
      if (!locales.includes(candidate)) locales.push(candidate)
    }
  }
}

outputFileSync(
  argv.out,
  `// @generated by packages/intl-collator/scripts/generate-locale-data.ts
// CLDR locale collation metadata generated from common/collation/*.xml.

export const availableCollationLocales = ${serialize(availableLocales)} as const

export const collationLocaleData = ${serialize(localeData)} as const

export const collationCandidateLocales = ${serialize(collationLocales)} as const
`
)
