import {useMemo, useState, type ReactNode} from 'react'
import {parseMessage, type ParsedMessage} from './message.js'
import {
  matchesDescriptionSearch,
  matchesMessageSearch,
  type MessageSearchMode,
  type MessageSearchScope,
} from './search.js'
import type {TranslatedMessage} from './types.js'

export interface EditorOptions {
  messages: readonly TranslatedMessage[]
  /** Apply the edit to consumer state; persistence stays with the consumer. */
  onMessageChange: (message: TranslatedMessage) => void
  defaultSelectedId?: string
  defaultSearchMode?: MessageSearchMode
  defaultSearchScope?: MessageSearchScope
}

export interface EditorState {
  messages: readonly TranslatedMessage[]
  selectedMessage: TranslatedMessage | undefined
  selectMessage: (id: string) => void
  query: string
  setQuery: (query: string) => void
  descriptionQuery: string
  setDescriptionQuery: (query: string) => void
  searchMode: MessageSearchMode
  setSearchMode: (mode: MessageSearchMode) => void
  searchScope: MessageSearchScope
  setSearchScope: (scope: MessageSearchScope) => void
  source: ParsedMessage | undefined
  translation: ParsedMessage | undefined
  setTranslation: (value: string) => void
  copySource: () => void
  clearTranslation: () => void
}

/** Controlled message data with no DOM, styling, providers, or network access. */
export function useMessageEditor({
  messages,
  onMessageChange,
  defaultSelectedId,
  defaultSearchMode = 'partial',
  defaultSearchScope = 'both',
}: EditorOptions): EditorState {
  const [selectedId, selectMessage] = useState(defaultSelectedId)
  const [query, setQuery] = useState('')
  const [descriptionQuery, setDescriptionQuery] = useState('')
  const [searchMode, setSearchMode] = useState(defaultSearchMode)
  const [searchScope, setSearchScope] = useState(defaultSearchScope)
  const selectedMessage =
    messages.find(message => message.id === selectedId) ?? messages[0]
  const visibleMessages = useMemo(() => {
    return messages.filter(
      message =>
        matchesMessageSearch(
          {
            id: message.id,
            source: message.defaultMessage,
            translations: [message.translatedMessage],
          },
          query,
          {mode: searchMode, scope: searchScope}
        ) && matchesDescriptionSearch(message.description, descriptionQuery)
    )
  }, [descriptionQuery, messages, query, searchMode, searchScope])
  const sourceText = selectedMessage?.defaultMessage
  const translationText = selectedMessage?.translatedMessage
  const source = useMemo(
    () => (sourceText === undefined ? undefined : parseMessage(sourceText)),
    [sourceText]
  )
  const translation = useMemo(
    () =>
      translationText === undefined ? undefined : parseMessage(translationText),
    [translationText]
  )
  function setTranslation(value: string): void {
    if (selectedMessage)
      onMessageChange({...selectedMessage, translatedMessage: value})
  }
  return {
    messages: visibleMessages,
    selectedMessage,
    selectMessage,
    query,
    setQuery,
    descriptionQuery,
    setDescriptionQuery,
    searchMode,
    setSearchMode,
    searchScope,
    setSearchScope,
    source,
    translation,
    setTranslation,
    copySource: () => {
      if (selectedMessage) setTranslation(selectedMessage.defaultMessage)
    },
    clearTranslation: () => setTranslation(''),
  }
}

export interface EditorProps extends EditorOptions {
  children: (editor: EditorState) => ReactNode
}

export function Editor({children, ...options}: EditorProps): ReactNode {
  return children(useMessageEditor(options))
}
