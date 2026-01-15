import * as React from 'react'
import {useState, useEffect, useRef, useCallback} from 'react'
import {navigate} from 'vike/client/router'
import {Search, Loader2} from 'lucide-react'
import {Dialog, DialogContent} from './ui/dialog'
import Typesense, {type Client} from 'typesense'

interface TypesenseResult {
  title: string
  content: string
  url: string
  section: string
  page_title: string
  doc_type: 'guide' | 'api' | 'reference' | 'example'
  tags: string[]
  heading_level?: number
}

interface SearchResultWithSnippet extends TypesenseResult {
  snippet?: string
  highlights?: string[]
}

// Typesense client configuration
const TYPESENSE_CONFIG = {
  host: '6e4uts1pzdy7wm3fp-1.a1.typesense.net',
  port: 443,
  protocol: 'https' as const,
  // Search-only API key (safe to expose in frontend)
  apiKey: 'zsQzkAsJQkHdtXxra3IzxOuhxEA4J8Qj',
}

const COLLECTION_NAME = 'docs'

// Format section name for display
function formatSection(section: string): string {
  return section
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Get badge color for doc type
function getDocTypeBadge(docType: string): {bg: string; text: string} {
  switch (docType) {
    case 'guide':
      return {
        bg: 'bg-blue-900/30',
        text: 'text-blue-300',
      }
    case 'api':
      return {
        bg: 'bg-purple-900/30',
        text: 'text-purple-300',
      }
    case 'reference':
      return {
        bg: 'bg-green-900/30',
        text: 'text-green-300',
      }
    case 'example':
      return {
        bg: 'bg-orange-900/30',
        text: 'text-orange-300',
      }
    default:
      return {
        bg: 'bg-gray-900/30',
        text: 'text-gray-300',
      }
  }
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

// Extract snippet from highlighted content or plain content
function extractSnippet(
  content: string,
  highlights: string[] = [],
  maxLength = 150
): string {
  // If we have highlights, use the first one
  if (highlights.length > 0) {
    const highlight = highlights[0]
    // Remove highlight tags
    const cleaned = highlight.replace(/<mark>/g, '').replace(/<\/mark>/g, '')
    return cleaned.length > maxLength
      ? cleaned.substring(0, maxLength) + '...'
      : cleaned
  }

  // Fallback to plain content
  return (
    content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
  )
}

export function SearchBar(): React.ReactNode {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<SearchResultWithSnippet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize Typesense client
  useEffect(() => {
    if (!TYPESENSE_CONFIG.apiKey) {
      console.warn('Typesense API key not configured. Search will not work.')
      return
    }

    try {
      clientRef.current = new Typesense.Client({
        nodes: [
          {
            host: TYPESENSE_CONFIG.host,
            port: TYPESENSE_CONFIG.port,
            protocol: TYPESENSE_CONFIG.protocol,
          },
        ],
        apiKey: TYPESENSE_CONFIG.apiKey,
        connectionTimeoutSeconds: 5,
      })
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to initialize Typesense client:', error)
      setIsLoading(false)
    }
  }, [])

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !clientRef.current) {
      setOptions([])
      return
    }

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setIsSearching(true)
    // Clear previous results immediately when starting a new search
    setOptions([])

    try {
      const searchParams = {
        q: query,
        query_by: 'title,tags,page_title,content',
        query_by_weights: '10,8,5,1',
        per_page: 10,
        highlight_fields: 'content',
        highlight_full_fields: 'title,page_title',
        snippet_threshold: 30,
        num_typos: 1,
        typo_tokens_threshold: 1,
        // Include faceting fields in response
        facet_by: 'section,doc_type',
      }

      const searchResult = await clientRef.current
        .collections(COLLECTION_NAME)
        .documents()
        .search(searchParams)

      // Map Typesense results to our format
      const results: SearchResultWithSnippet[] =
        searchResult.hits && searchResult.hits.length > 0
          ? searchResult.hits.map((hit: any) => {
              const doc = hit.document as TypesenseResult
              const highlights =
                hit.highlights?.map((h: any) => h.snippet) || []
              const snippet = extractSnippet(doc.content, highlights)

              return {
                ...doc,
                snippet,
                highlights,
              }
            })
          : []

      setOptions(results)
    } catch (error: any) {
      // Ignore abort errors (results already cleared above)
      if (error.name !== 'AbortError') {
        console.error('Search error:', error)
      }
      // Keep options empty on error
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(inputValue)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [inputValue, performSearch])

  // Reset input when dialog closes
  useEffect(() => {
    if (!open) {
      setInputValue('')
      setOptions([])
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
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
    // URL already contains the full path with anchor
    const url = option.url.replace('https://formatjs.io', '')
    navigate(url)
  }

  const showLoader = isLoading || isSearching

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
              disabled={isLoading}
            />
            {showLoader && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="h-[400px] overflow-y-auto">
            {!inputValue ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Start typing to search documentation
              </div>
            ) : options.length === 0 && !isSearching ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No results found for "{inputValue}"
              </div>
            ) : (
              <div className="p-2">
                {options.map(option => {
                  const badge = getDocTypeBadge(option.doc_type)
                  return (
                    <button
                      key={option.url}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className="w-full flex flex-col gap-1.5 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium text-sm">
                          {option.title}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                          >
                            {option.doc_type}
                          </span>
                          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                            {formatSection(option.section)}
                          </span>
                        </div>
                      </div>
                      {option.snippet && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {highlightMatches(option.snippet, inputValue)}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
