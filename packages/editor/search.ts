export type MessageSearchMode = 'partial' | 'exact'
export type MessageSearchScope = 'source' | 'translation' | 'both'

export interface MessageSearchOptions {
  mode?: MessageSearchMode
  scope?: MessageSearchScope
}

export interface MessageSearchTarget {
  id: string
  source: string
  translations?: readonly string[]
  /** Additional searchable metadata, such as complete source-location text. */
  metadata?: readonly string[]
}

function normalized(value: string): string {
  return value.toLocaleLowerCase()
}

/**
 * Matches source/translation text with the selected mode and scope. Partial mode
 * also matches ID and metadata fragments. Exact mode matches complete metadata
 * and IDs, plus long ID fragments for generated identifier suffix lookup.
 */
export function matchesMessageSearch(
  target: MessageSearchTarget,
  query: string,
  {mode = 'partial', scope = 'both'}: MessageSearchOptions = {}
): boolean {
  const search = normalized(query.trim())
  if (!search) return true
  const id = normalized(target.id)
  const metadata = (target.metadata ?? []).map(normalized)
  const matchesMetadata =
    mode === 'partial'
      ? [id, ...metadata].some(value => value.includes(search))
      : id === search ||
        metadata.some(value => value === search) ||
        (search.length >= 8 && id.includes(search))
  if (matchesMetadata) return true

  const values = [
    ...(scope === 'source' || scope === 'both' ? [target.source] : []),
    ...(scope === 'translation' || scope === 'both'
      ? (target.translations ?? [])
      : []),
  ].map(normalized)
  return values.some(value =>
    mode === 'exact' ? value === search : value.includes(search)
  )
}

/** Whitespace-delimited terms are case-insensitive ANDs within one description. */
export function matchesDescriptionSearch(
  description: string | undefined,
  query: string
): boolean {
  const terms = normalized(query.trim()).split(/\s+/u).filter(Boolean)
  if (terms.length === 0) return true
  const value = normalized(description ?? '')
  return terms.every(term => value.includes(term))
}
