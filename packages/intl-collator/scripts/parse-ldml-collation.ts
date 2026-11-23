import {XMLParser} from 'fast-xml-parser'

export type CollationRelationStrength =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'quaternary'
  | 'identical'

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
  | {type: 'suppressContractions'; value: number[]}
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

export type CollationRule =
  | CollationSetting
  | CollationReset
  | CollationRelation

export type ParsedLDMLCollation = {
  locale: string
  type: string
  rules: CollationRule[]
  alias?: string
}

const BEFORE_RESET_RE = /^\[before\s+([123])\]\s*([\s\S]*)$/
const QUOTED_TEXT_OR_COMMENT_RE = /'(?:''|[^'])*'|#.*$/gm
const ESCAPE_RE = /\\(?:u([\dA-Fa-f]{4})|U([\dA-Fa-f]{8})|([abfnrtv\\]))/g
const CONTROL_ESCAPES = {
  a: 7,
  b: 8,
  f: 12,
  n: 10,
  r: 13,
  t: 9,
  v: 11,
  '\\': 92,
}
const LEADING_WHITESPACE_RE = /^\p{Pattern_White_Space}+/u
const PATTERN_SPACE_RE = /^\p{Pattern_White_Space}$/u
const SETTING_RE = /^\[([^\]\s]+)(?:\s+(\[[^\]]*\]|[^\]]+))?\]/
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

function readRelationStrength(
  input: string
): CollationRelationStrength | undefined {
  // LDML relation operators encode strength: < primary, << secondary,
  // <<< tertiary, <<<< quaternary, and = identical.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  if (input.startsWith('<<<<')) {
    return 'quaternary'
  }
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
  if (strength === 'quaternary') return 4
  return strength === 'tertiary' ? 3 : strength === 'secondary' ? 2 : 1
}

type RuleCharacter = {value: string; quoted: boolean}

function ruleCharacters(input: string): RuleCharacter[] {
  const result: RuleCharacter[] = []
  const characters = Array.from(input)
  let quoted = false
  for (let i = 0; i < characters.length; i++) {
    const value = characters[i]
    if (value === "'") {
      if (characters[i + 1] === "'") {
        result.push({value, quoted: true})
        i++
      } else {
        quoted = !quoted
      }
    } else if (quoted || !PATTERN_SPACE_RE.test(value)) {
      result.push({value, quoted})
    }
  }
  if (quoted) throw new SyntaxError('Unclosed collation rule quote')
  return result
}

function ruleText(characters: readonly RuleCharacter[]): string {
  return characters.map(character => character.value).join('')
}

function starredRelationValues(input: string): string[] {
  // An unquoted hyphen expands a code point range in a starred relation.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  const characters = ruleCharacters(input)
  const result: string[] = []
  for (let i = 0; i < characters.length; i++) {
    const first = characters[i].value.codePointAt(0)!
    const hyphen = characters[i + 1]
    if (hyphen?.value !== '-' || hyphen.quoted) {
      result.push(characters[i].value)
      continue
    }
    const last = characters[i + 2]?.value.codePointAt(0)
    if (last === undefined || last < first) {
      throw new SyntaxError('Invalid starred collation range')
    }
    for (let point = first; point <= last; point++)
      result.push(String.fromCodePoint(point))
    i += 2
  }
  return result
}

function readToken(input: string, reset = false): [string, string] {
  let directive = ''
  // A reset may start with [before n], a logical position, or both.
  // Other bracketed tokens belong to the next rule.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Collation_Rule_Syntax
  while (reset && input.startsWith('[')) {
    const end = input.indexOf(']')
    if (end < 0) break
    const position = input.slice(0, end + 1)
    directive += position
    input = trimStart(input.slice(end + 1))
    if (!position.startsWith('[before ')) return [directive, input]
  }
  let quoted = false
  let index = 0
  for (; index < input.length; index++) {
    const char = input[index]
    if (char === "'") {
      if (input[index + 1] === "'") index++
      else quoted = !quoted
    } else if (
      !quoted &&
      (char === '&' || char === '<' || char === '=' || char === '[')
    ) {
      break
    }
  }
  return [directive + input.slice(0, index), input.slice(index)]
}

function suppressionPoints(set: string): number[] {
  // The bundled CLDR sets use literal code points, escapes, and ranges.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Special_Purpose_Commands
  if (!set.startsWith('[') || !set.endsWith(']')) {
    throw new SyntaxError(`Invalid suppressContractions set: ${set}`)
  }
  const source = set.slice(1, -1)
  if (/[[\]{}&^]/.test(source)) {
    throw new SyntaxError(`Unsupported suppressContractions set: ${set}`)
  }
  const points = new Set<number>()
  const tokens = Array.from(source).filter(
    value => !PATTERN_SPACE_RE.test(value)
  )
  for (let i = 0; i < tokens.length; i++) {
    const first = tokens[i].codePointAt(0)!
    const last =
      tokens[i + 1] === '-' && i + 2 < tokens.length
        ? tokens[(i += 2)].codePointAt(0)!
        : first
    if (last < first || first === 0x5c) {
      throw new SyntaxError(`Invalid suppressContractions range: ${set}`)
    }
    for (let current = first; current <= last; current++) points.add(current)
  }
  return [...points]
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
    case 'optimize':
      return {type: key, value} as CollationSetting
    case 'suppressContractions':
      return {type: key, value: suppressionPoints(value)}
    case 'reorder':
      return {
        type: 'reorder',
        value: value.split(WHITESPACE_RE).filter(Boolean),
      }
    default:
      return {type: 'unknown', key, value}
  }
}

function parseReset(rawValue: string): CollationReset {
  // A rule chain starts with a reset (&). [before 1|2|3] changes insertion
  // position relative to the reset anchor at primary/secondary/tertiary level.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  const before = BEFORE_RESET_RE.exec(rawValue)
  const target = before ? trimStart(before[2]) : rawValue
  const value = target.startsWith('[')
    ? target
    : ruleText(ruleCharacters(target))
  return before
    ? {type: 'reset', before: Number(before[1]) as 1 | 2 | 3, value}
    : {type: 'reset', value}
}

function parseRelation(
  strength: CollationRelationStrength,
  rawValue: string
): CollationRelation {
  // Only unquoted bars and slashes delimit context and extension strings.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Context_Before
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Expansions
  const characters = ruleCharacters(rawValue)
  const prefix = characters.findIndex(
    ({value, quoted}) => value === '|' && !quoted
  )
  const expansion = characters.findIndex(
    ({value, quoted}) => value === '/' && !quoted
  )
  return {
    type: 'relation',
    strength,
    value: ruleText(
      characters.slice(prefix + 1, expansion < 0 ? undefined : expansion)
    ),
    expansion:
      expansion < 0 ? undefined : ruleText(characters.slice(expansion + 1)),
    prefix: prefix < 0 ? undefined : ruleText(characters.slice(0, prefix)),
  }
}

export function parseCollationRules(source: string): CollationRule[] {
  const rules: CollationRule[] = []
  // Parse the LDML <cr> rule language: settings, resets, relation chains,
  // starred relations, comments, prefixes, and expansions.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
  // Decode ICU resource escapes before tokenizing so quoted syntax stays literal.
  // https://www.unicode.org/reports/tr35/tr35-collation.html#Collation_Rule_Syntax
  let input = source
    .replace(ESCAPE_RE, (_, short, long, control) =>
      String.fromCodePoint(
        short || long
          ? parseInt(short || long, 16)
          : CONTROL_ESCAPES[control as keyof typeof CONTROL_ESCAPES]
      )
    )
    .replace(QUOTED_TEXT_OR_COMMENT_RE, token =>
      token[0] === '#' ? '' : token
    )

  while (input) {
    input = trimStart(input)
    if (!input) break
    const setting = SETTING_RE.exec(input)
    if (setting) {
      rules.push(parseSetting(setting[1], setting[2]))
      input = input.slice(setting[0].length)
      continue
    }

    if (input.startsWith('&')) {
      const [value, rest] = readToken(trimStart(input.slice(1)), true)
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
            rules.push({type: 'relation', strength, value: relationValue})
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
