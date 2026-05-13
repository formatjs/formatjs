export type ParsedCollationElement = {
  primary: number
  secondary: number
  tertiary: number
  quaternary: number
  variable: boolean
}

export type ParsedUCAEntry = {
  prefix?: number[]
  codePoints: number[]
  elements: ParsedCollationElement[]
  comment?: string
}

export type PackedTrieNode = {
  value?: number
  next?: Record<number, PackedTrieNode>
}

const COLLATION_ELEMENT_RE = /\[([^\]]+)\]/g
const HEX_BYTE_RE = /^[0-9A-Fa-f]{1,2}$/
const CODE_POINT_WEIGHT_RE = /^U\+([0-9A-Fa-f]+)$/
const LEADING_ASTERISK_RE = /^\*/
const LEADING_DOT_RE = /^\./
const LINE_SPLIT_RE = /\r?\n/
const WHITESPACE_RE = /\s+/

function parseHex(input: string): number {
  const value = parseInt(input, 16)
  if (!Number.isFinite(value)) {
    throw new RangeError(`Invalid hexadecimal value: ${input}`)
  }
  return value
}

function parseWeightComponent(input: string): number {
  const codePointWeight = input.trim().match(CODE_POINT_WEIGHT_RE)
  if (codePointWeight) {
    return parseHex(codePointWeight[1])
  }

  const bytes = input.trim().split(WHITESPACE_RE).filter(Boolean)
  if (bytes.length === 0) {
    return 0
  }
  if (!bytes.every(byte => HEX_BYTE_RE.test(byte))) {
    throw new RangeError(`Invalid hexadecimal weight: ${input}`)
  }
  return parseHex(bytes.join(''))
}

function parseDottedWeightComponent(input: string): number {
  const codePointWeight = input.trim().match(CODE_POINT_WEIGHT_RE)
  return codePointWeight ? parseHex(codePointWeight[1]) : parseHex(input)
}

export function parseCodePointSequence(input: string): number[] {
  const codePoints = input
    .trim()
    .split(WHITESPACE_RE)
    .filter(Boolean)
    .map(parseHex)
  if (codePoints.length === 0) {
    throw new RangeError('UCA entry must contain at least one code point')
  }
  return codePoints
}

export function parseCollationElement(
  input: string
): ParsedCollationElement {
  const normalized = input.trim().replace(LEADING_ASTERISK_RE, '')
  const variable = input.trim().startsWith('*')
  const weights = normalized.includes(',')
    ? normalized.split(',').map(parseWeightComponent)
    : normalized
        .replace(LEADING_DOT_RE, '')
        .split('.')
        .filter(Boolean)
        .map(parseDottedWeightComponent)

  return {
    primary: weights[0] || 0,
    secondary: weights[1] || 0,
    tertiary: weights[2] || 0,
    quaternary: weights[3] || 0,
    variable,
  }
}

export function parseUCALine(line: string): ParsedUCAEntry | undefined {
  const [withoutComment, comment] = line.split('#', 2)
  const trimmed = withoutComment.trim()
  if (!trimmed || trimmed.startsWith('@') || !trimmed.includes(';')) {
    return undefined
  }

  const [codePointPart, elementPart] = trimmed.split(';', 2)
  const [prefixPart, relevantCodePointPart] = codePointPart.includes('|')
    ? codePointPart.split('|', 2)
    : [undefined, codePointPart]
  COLLATION_ELEMENT_RE.lastIndex = 0
  const elements: ParsedCollationElement[] = []
  let match: RegExpExecArray | null
  while ((match = COLLATION_ELEMENT_RE.exec(elementPart))) {
    elements.push(parseCollationElement(match[1]))
  }
  if (elements.length === 0) {
    return undefined
  }

  return {
    prefix:
      prefixPart === undefined ? undefined : parseCodePointSequence(prefixPart),
    codePoints: parseCodePointSequence(relevantCodePointPart),
    elements,
    comment: comment?.trim(),
  }
}

export function parseUCA(source: string): ParsedUCAEntry[] {
  return source
    .split(LINE_SPLIT_RE)
    .map(parseUCALine)
    .filter((entry): entry is ParsedUCAEntry => entry !== undefined)
}

export function buildUCATrie(entries: ParsedUCAEntry[]): PackedTrieNode {
  const root: PackedTrieNode = {}
  entries.forEach((entry, index) => {
    let node = root
    for (const codePoint of entry.codePoints) {
      const next = (node.next ||= Object.create(null))
      node = next[codePoint] ||= {}
    }
    node.value = index
  })
  return root
}
