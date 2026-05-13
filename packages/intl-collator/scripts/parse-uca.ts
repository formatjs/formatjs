export type ParsedCollationElement = {
  primary: number
  secondary: number
  tertiary: number
  quaternary: number
  variable: boolean
}

export type ParsedUCAEntry = {
  codePoints: number[]
  elements: ParsedCollationElement[]
  comment?: string
}

export type PackedTrieNode = {
  value?: number
  next?: Record<number, PackedTrieNode>
}

const COLLATION_ELEMENT_RE = /\[([^\]]+)\]/g
const LINE_SPLIT_RE = /\r?\n/
const LEADING_WEIGHT_MARKER_RE = /^[*.]/
const WHITESPACE_RE = /\s+/

function parseHex(input: string): number {
  const value = parseInt(input, 16)
  if (!Number.isFinite(value)) {
    throw new RangeError(`Invalid hexadecimal value: ${input}`)
  }
  return value
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
  const variable = input.startsWith('*')
  const weights = input
    .replace(LEADING_WEIGHT_MARKER_RE, '')
    .split('.')
    .filter(Boolean)
    .map(parseHex)

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
    codePoints: parseCodePointSequence(codePointPart),
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
