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
const LEADING_WHITESPACE_RE = /^\s+/
const SETTING_RE = /^\[([^\]\s]+)(?:\s+([^\]]+))?\]/
const WHITESPACE_RE = /\s+/g

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
  let input = source.replace(WHITESPACE_RE, ' ').trim()

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
      const [value, rest] = readToken(
        trimStart(input.slice(relationTokenLength(strength)))
      )
      if (value) {
        rules.push(parseRelation(strength, value))
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
