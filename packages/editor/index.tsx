import {useMemo, useState, type ReactNode} from 'react'
import {parseMessage, type ParsedMessage} from './message.js'
import type {TranslatedMessage} from './types.js'

export {Message, parseMessage} from './message.js'
export type {MessageProps, ParsedMessage} from './message.js'
export type {TranslatedMessage} from './types.js'

export interface EditorOptions {
  messages: readonly TranslatedMessage[]
  /** Apply the edit to consumer state; persistence stays with the consumer. */
  onMessageChange: (message: TranslatedMessage) => void
  defaultSelectedId?: string
}

export interface EditorState {
  messages: readonly TranslatedMessage[]
  selectedMessage: TranslatedMessage | undefined
  selectMessage: (id: string) => void
  query: string
  setQuery: (query: string) => void
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
}: EditorOptions): EditorState {
  const [selectedId, selectMessage] = useState(defaultSelectedId)
  const [query, setQuery] = useState('')
  const selectedMessage =
    messages.find(message => message.id === selectedId) ?? messages[0]
  const visibleMessages = useMemo(() => {
    const search = query.trim().toLowerCase()
    return messages.filter(message =>
      [
        message.id,
        message.defaultMessage,
        message.translatedMessage,
        message.description ?? '',
      ].some(value => value.toLowerCase().includes(search))
    )
  }, [messages, query])
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
