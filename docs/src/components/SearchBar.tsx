import * as React from 'react'
import {useState, useEffect, useRef} from 'react'
import {Link, useLocation} from 'wouter'
import {
  Autocomplete,
  TextField,
  Box,
  CircularProgress,
  InputAdornment,
  ListItemText,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
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
      <Box
        key={i}
        component="mark"
        sx={{
          backgroundColor: 'primary.light',
          color: 'primary.contrastText',
          padding: '0 2px',
          borderRadius: '2px',
        }}
      >
        {part}
      </Box>
    ) : (
      part
    )
  })
}

export function SearchBar() {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<SearchResultWithSnippet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const indexRef = useRef<lunr.Index | null>(null)
  const documentsRef = useRef<Record<string, DocEntry>>({})
  const [, setLocation] = useLocation()

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

  return (
    <Autocomplete
      sx={{width: {xs: '100%', sm: 400}}}
      ListboxProps={{
        sx: {
          maxHeight: '70vh',
        },
      }}
      options={options}
      getOptionLabel={option => option.title}
      filterOptions={x => x} // Disable built-in filtering, use Lunr instead
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue)
      }}
      onChange={(_, value) => {
        if (value) {
          setInputValue('')
          const hash = value.headingSlug ? `#${value.headingSlug}` : ''
          setLocation(`/docs/${value.path}${hash}`)
        }
      }}
      loading={isLoading}
      loadingText="Loading search index..."
      noOptionsText={inputValue ? 'No results found' : 'Start typing to search'}
      renderInput={params => (
        <TextField
          {...params}
          placeholder="Search docs..."
          size="small"
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    {isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SearchIcon fontSize="small" />
                    )}
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        const {key, ...otherProps} = props
        const hash = option.headingSlug ? `#${option.headingSlug}` : ''
        const href = `/docs/${option.path}${hash}`

        return (
          <Box component="li" key={key} {...otherProps}>
            <ListItemText
              primary={
                <Typography
                  component="a"
                  href={href}
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {option.title}
                  {option.heading && (
                    <>
                      {' > '}
                      <Box component="span" sx={{fontWeight: 400}}>
                        {option.heading}
                      </Box>
                    </>
                  )}
                </Typography>
              }
              secondary={
                option.snippet && (
                  <Typography
                    component="a"
                    href={href}
                    variant="caption"
                    sx={{
                      display: 'block',
                      lineHeight: 1.3,
                      textDecoration: 'none',
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'text.primary',
                      },
                    }}
                  >
                    {highlightMatches(option.snippet, inputValue)}
                  </Typography>
                )
              }
            />
          </Box>
        )
      }}
    />
  )
}
