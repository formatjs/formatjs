import * as React from 'react'
import {useState, useEffect, useRef} from 'react'
import {navigate} from 'vike/client/router'
import {Search, Loader2} from 'lucide-react'
import {Dialog, DialogContent} from './ui/dialog'
import lunr from 'lunr'

interface DocEntry {
  id: string
  title: string
  heading?: string
  headingSlug?: string
  path: string
  section?: string
  content: string
}

interface SearchResultWithSnippet extends DocEntry {
  snippet?: string
}

// Extract a snippet from content around the search term
function extractSnippet(
  content: string,
  query: string,
  maxLength = 150
): string {
  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const terms = lowerQuery.split(/\s+/).filter(t => t.length > 0)

  // Find the first occurrence of any search term
  let position = -1
  for (const term of terms) {
    position = lowerContent.indexOf(term)
    if (position !== -1) break
  }

  if (position === -1) {
    // No match found, return beginning
    return (
      content.substring(0, maxLength) +
      (content.length > maxLength ? '...' : '')
    )
  }

  // Calculate start position to center the match
  const start = Math.max(0, position - Math.floor(maxLength / 2))
  const end = Math.min(content.length, start + maxLength)

  let snippet = content.substring(start, end)

  // Add ellipsis
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'

  return snippet.trim()
}

// Highlight matching terms in text
function highlightMatches(text: string, query: string): React.ReactNode {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2)
  if (terms.length === 0) return text

  // Create regex to match any of the terms (case insensitive)
  const regex = new RegExp(
    `(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  )
  const parts = text.split(regex)

  return parts.map((part, i) => {
    const isMatch = terms.some(term => part.toLowerCase().includes(term))
    return isMatch ? (
      <mark
        key={i}
        className="bg-primary/30 text-primary-foreground px-0.5 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    )
  })
}

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<SearchResultWithSnippet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const indexRef = useRef<lunr.Index | null>(null)
  const documentsRef = useRef<Record<string, DocEntry>>({})

  // Load pre-built search index
  useEffect(() => {
    const loadIndex = async () => {
      try {
        const module = await import('../search-index.generated.json')
        const data = module.default

        // Load Lunr index from JSON
        indexRef.current = lunr.Index.load(data.index)

        // Store documents by ID for lookup
        documentsRef.current = data.documents.reduce(
          (acc: Record<string, DocEntry>, doc: DocEntry) => {
            acc[doc.id] = doc
            return acc
          },
          {}
        )

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load search index:', error)
        setIsLoading(false)
      }
    }

    loadIndex()
  }, [])

  // Perform search when input changes
  useEffect(() => {
    if (!inputValue.trim() || !indexRef.current) {
      setOptions([])
      return
    }

    try {
      // Search with Lunr
      const searchResults = indexRef.current.search(inputValue)

      // Map results to documents with snippets
      const mappedResults = searchResults.slice(0, 10).map(result => {
        const doc = documentsRef.current[result.ref]
        const snippet = extractSnippet(doc.content, inputValue)

        return {
          ...doc,
          snippet,
        }
      })

      setOptions(mappedResults)
    } catch (error) {
      // Lunr throws on invalid queries - just clear results
      setOptions([])
    }
  }, [inputValue])

  // Reset input when dialog closes
  useEffect(() => {
    if (!open) {
      setInputValue('')
      setOptions([])
    }
  }, [open])

  // Keyboard shortcut to open search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (option: SearchResultWithSnippet) => {
    setOpen(false)
    const hash = option.headingSlug ? `#${option.headingSlug}` : ''
    navigate(`/docs/${option.path}${hash}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-popover text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search docs...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search docs..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="flex h-12 w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
              disabled={isLoading}
            />
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {!inputValue ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Start typing to search documentation
              </div>
            ) : options.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No results found for "{inputValue}"
              </div>
            ) : (
              <div className="p-2">
                {options.map(option => (
                  <div
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className="flex flex-col gap-1 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="font-medium text-sm">
                      {option.title}
                      {option.heading && (
                        <>
                          {' → '}
                          <span className="font-normal text-muted-foreground">
                            {option.heading}
                          </span>
                        </>
                      )}
                    </div>
                    {option.snippet && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {highlightMatches(option.snippet, inputValue)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
