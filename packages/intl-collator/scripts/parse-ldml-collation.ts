import {XMLParser} from 'fast-xml-parser'

export type CollationRelationStrength = 'primary' | 'secondary' | 'tertiary' | 'identical'

export type CollationSetting =
  | {type: 'alternate'; value: string}
  | {type: 'backwards'; value: string}
  | {type: 'caseFirst'; value: string}
  | {type: 'caseLevel'; value: string}
  | {type: 'hiraganaQ'; value: string}
  | {type: 'import'; value: string}
  | {type: 'normalization'; value: string}
  | {type: 'numericOrdering'; value: string}
  | {type: 'reorder'; value: string[]}
  | {type: 'strength'; value: string}
  | {type: 'suppressContractions'; value: string}
  | {type: 'optimize'; value: string}
  | {type: 'unknown'; key: string; value: string}

export type CollationReset = {
  type: 'reset'
  value: string
  before?: 1 | 2 | 3
}

export type CollationRelation = {
  type: 'relation'
  strength: CollationRelationStrength
  value: string
  expansion?: string
  prefix?: string
}

export type CollationRule = CollationSetting | CollationReset | CollationRelation

export type ParsedLDMLCollation = {
  locale: string
  type: string
  rules: CollationRule[]
  alias?: string
}

const BEFORE_RESET_RE = /^\[before\s+([123])\]\s*(.*)$/
const COMMENT_RE = /#.*$/gm
const LEADING_WHITESPACE_RE = /^\s+/
const SETTING_RE = /^\[([^\]\s]+)(?:\s+([^\]]+))?\]/
const WHITESPACE_RE = /\s+/g

// LDML Part 5 defines collation XML as <collations> containing one or more
// typed <collation> elements, each with <cr> rule text or an <alias>.
// https://www.unicode.org/reports/tr35/tr35-collation.html#Collation_Tailorings
const xmlParser = new XMLParser({
  attributeNamePrefix: '',
  ignoreAttributes: false,
  isArray: name => name === 'collation',
  parseAttributeValue: false,
  parseTagValue: false,
  preserveOrder: false,
  textNodeName: '#text',
  trimValues: false,
})

function trimStart(input: string): string {
  return input.replace(LEADING_WHITESPACE_RE, '')
}

function readRelationStrength(input: string): CollationRelationStrength | undefined {
  // LDML relation operators encode strength: < primary, << secondary,
  // <<< tertiary, and = identical.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  if (input.startsWith('<<<')) {
    return 'tertiary'
  }
  if (input.startsWith('<<')) {
    return 'secondary'
  }
  if (input.startsWith('<')) {
    return 'primary'
  }
  if (input.startsWith('=')) {
    return 'identical'
  }
  return undefined
}

function relationTokenLength(strength: CollationRelationStrength): number {
  return strength === 'tertiary'
    ? 3
    : strength === 'secondary'
      ? 2
      : 1
}

function starredRelationValues(input: string): string[] {
  // LDML starred relations expand a sequence into one relation per code point.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  return Array.from(input.replace(WHITESPACE_RE, ''))
}

function readToken(input: string): [string, string] {
  let value = ''
  let escaped = false
  let index = 0
  for (; index < input.length; index++) {
    const char = input[index]
    if (escaped) {
      value += char
      escaped = false
      continue
    }
    if (char === "'") {
      escaped = true
      continue
    }
    if (char === '&' || char === '<' || char === '=') {
      break
    }
    value += char
  }
  return [value.trim(), input.slice(index)]
}

function parseSetting(key: string, rawValue = ''): CollationSetting {
  const value = rawValue.trim()
  // LDML collation settings appear in square brackets in the <cr> rule stream.
  // Unknown settings are preserved so generation can decide how to handle them.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Collation_Settings
  switch (key) {
    case 'alternate':
    case 'backwards':
    case 'caseFirst':
    case 'caseLevel':
    case 'hiraganaQ':
    case 'import':
    case 'normalization':
    case 'numericOrdering':
    case 'strength':
    case 'suppressContractions':
    case 'optimize':
      return {type: key, value} as CollationSetting
    case 'reorder':
      return {type: 'reorder', value: value.split(WHITESPACE_RE).filter(Boolean)}
    default:
      return {type: 'unknown', key, value}
  }
}

function parseReset(rawValue: string): CollationReset {
  // A rule chain starts with a reset (&). [before 1|2|3] changes insertion
  // position relative to the reset anchor at primary/secondary/tertiary level.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  const before = BEFORE_RESET_RE.exec(rawValue)
  if (before) {
    return {
      type: 'reset',
      before: Number(before[1]) as 1 | 2 | 3,
      value: before[2].trim(),
    }
  }
  return {
    type: 'reset',
    value: rawValue.trim(),
  }
}

function parseRelation(
  strength: CollationRelationStrength,
  rawValue: string
): CollationRelation {
  // LDML relation strings can carry a prefix/context with "|" and an expansion
  // with "/"; keep both so tailoring compilation can assign context mappings.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Context_Before
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Expansions
  const [prefixAndValue, expansion] = rawValue.split('/', 2)
  const [prefix, value] = prefixAndValue.split('|', 2)
  return {
    type: 'relation',
    strength,
    value: (value || prefix).trim(),
    expansion: expansion?.trim(),
    prefix: value === undefined ? undefined : prefix.trim(),
  }
}

export function parseCollationRules(source: string): CollationRule[] {
  const rules: CollationRule[] = []
  // Parse the LDML <cr> rule language: settings, resets, relation chains,
  // starred relations, comments, prefixes, and expansions.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  let input = source.replace(COMMENT_RE, '').replace(WHITESPACE_RE, ' ').trim()

  while (input) {
    input = trimStart(input)
    const setting = SETTING_RE.exec(input)
    if (setting) {
      rules.push(parseSetting(setting[1], setting[2]))
      input = input.slice(setting[0].length)
      continue
    }

    if (input.startsWith('&')) {
      const [value, rest] = readToken(trimStart(input.slice(1)))
      rules.push(parseReset(value))
      input = rest
      continue
    }

    const strength = readRelationStrength(input)
    if (strength) {
      const tokenLength = relationTokenLength(strength)
      const starred = input[tokenLength] === '*'
      const [value, rest] = readToken(
        trimStart(input.slice(tokenLength + (starred ? 1 : 0)))
      )
      if (value) {
        if (starred) {
          for (const relationValue of starredRelationValues(value)) {
            rules.push(parseRelation(strength, relationValue))
          }
        } else {
          rules.push(parseRelation(strength, value))
        }
      }
      input = rest
      continue
    }

    input = input.slice(1)
  }

  return rules
}

type XMLNode = Record<string, unknown>

function asNode(value: unknown): XMLNode | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as XMLNode)
    : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function nodeText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value
  }
  const node = asNode(value)
  return node ? asString(node['#text']) : undefined
}

function rootCollations(parsed: XMLNode): XMLNode | undefined {
  return asNode(parsed.collations) || asNode(asNode(parsed.ldml)?.collations)
}

export function parseLDMLCollations(
  locale: string,
  source: string
): ParsedLDMLCollation[] {
  const collations: ParsedLDMLCollation[] = []
  // Read the LDML XML layer with a real XML parser, then hand only <cr> rule
  // text to the rule parser above. Aliases represent LDML collation fallback
  // links between locale/type records.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Collation_Types
  const parsed = xmlParser.parse(source) as XMLNode
  const collationNodes = rootCollations(parsed)?.collation
  if (!Array.isArray(collationNodes)) {
    return collations
  }

  for (const collation of collationNodes) {
    const collationNode = asNode(collation)
    if (!collationNode) {
      continue
    }
    const type = asString(collationNode.type) || 'standard'
    const alias = asNode(collationNode.alias)
    if (alias) {
      collations.push({
        locale,
        type,
        rules: [],
        alias: asString(alias.path) || asString(alias.source),
      })
      continue
    }

    collations.push({
      locale,
      type,
      rules: parseCollationRules(nodeText(collationNode.cr) || ''),
    })
  }
  return collations
}
