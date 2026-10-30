export interface SourceLocation {
  file: string
  start?: number
  end?: number
  /** Upload stream (for example a branch) that reported this location. */
  source?: string
  /** Repository identifier, such as an `owner/name` slug or a URL. */
  repository?: string
  /** Commit, tag, or branch the location was extracted from. */
  revision?: string
}
export interface SourceLocationHrefOptions {
  /**
   * Base of the file tree, or a resolver returning one for a location.
   * String bases may contain `{repository}` and `{revision}` placeholders.
   * Without a base no link is produced.
   */
  baseUrl?: string | ((location: SourceLocation) => string | undefined)
  /** Fallback repository when a location does not carry one. */
  repository?: string
  /** Fallback revision when a location does not carry one. */
  revision?: string
  /** Builds the URL fragment for a line range; `L{start}` / `L{start}-L{end}` by default. */
  lineFragment?: (start: number, end: number | undefined) => string
}
/** Plain `file`, `file:start`, or `file:start–end` text; never a URL. */
export function formatSourceLocation(location: SourceLocation): string {
  const start = location.start === undefined ? '' : `:${location.start}`
  const end =
    location.end === undefined
      ? ''
      : `${location.start === undefined ? ':' : '–'}${location.end}`
  return `${location.file}${start}${end}`
}
function defaultLineFragment(start: number, end: number | undefined): string {
  return end === undefined || end === start ? `L${start}` : `L${start}-L${end}`
}
const PLACEHOLDER = /\{(repository|revision)\}/g
/** Resolves a link for a location, or `undefined` when one cannot be built. */
export function resolveSourceLocationHref(
  location: SourceLocation,
  {
    baseUrl,
    repository,
    revision,
    lineFragment = defaultLineFragment,
  }: SourceLocationHrefOptions = {}
): string | undefined {
  const base = typeof baseUrl === 'function' ? baseUrl(location) : baseUrl
  if (!base) return undefined
  const values = {
    repository: location.repository ?? repository,
    revision: location.revision ?? revision,
  }
  let missing = false
  const root = base.replace(PLACEHOLDER, (_match, key: keyof typeof values) => {
    const value = values[key]
    if (value === undefined || value === '') {
      missing = true
      return ''
    }
    return encodeURIComponent(value).replace(/%2F/g, '/')
  })
  if (missing) return undefined
  const path = location.file
    .replace(/^(\.\/|\/)+/, '')
    .split('/')
    .filter(segment => segment !== '')
    .map(segment => encodeURIComponent(segment))
    .join('/')
  if (!path) return undefined
  const fragment =
    location.start === undefined
      ? ''
      : `#${lineFragment(location.start, location.end)}`
  return `${root.replace(/\/+$/, '')}/${path}${fragment}`
}
