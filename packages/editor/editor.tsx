import type {FormEvent, ReactNode} from 'react'
import {useEffect, useId, useMemo, useState} from 'react'
import {MessagePreview} from '#packages/editor/message.js'
import type {
  EditorMessage,
  EditorProps,
  MessageStatus,
  SourceLocation,
} from '#packages/editor/types.js'
import {validateTranslation} from '#packages/editor/validation.js'

const ALL_CATALOGS = ''
const DEFAULT_PAGE_SIZE = 100

function messageTranslation(message: EditorMessage, locale: string): string {
  return message.translations[locale] ?? ''
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unable to save the translation.'
}

function formatLocation(location: SourceLocation): string {
  if (location.start === undefined) {
    return location.file
  }
  if (location.end === undefined || location.end === location.start) {
    return `${location.file}:${location.start}`
  }
  return `${location.file}:${location.start}-${location.end}`
}

export function Editor({
  messages,
  locales,
  onSave,
  defaultLocale,
  sourceLocale = 'en',
  title = 'FormatJS translation editor',
  pageSize = DEFAULT_PAGE_SIZE,
}: EditorProps): ReactNode {
  const initialLocale =
    defaultLocale && locales.includes(defaultLocale)
      ? defaultLocale
      : (locales[0] ?? '')
  const [locale, setLocale] = useState(initialLocale)
  const [catalog, setCatalog] = useState(ALL_CATALOGS)
  const [status, setStatus] = useState<MessageStatus>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState(messages[0]?.id ?? '')
  const [draft, setDraft] = useState('')
  const [baseline, setBaseline] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const translationId = useId()
  const effectivePageSize = Math.max(1, pageSize)

  const catalogs = useMemo(
    () =>
      Array.from(
        new Set<string>(
          messages.reduce<string[]>(
            (values, message) => [...values, ...(message.catalogs ?? [])],
            []
          )
        )
      ).sort(),
    [messages]
  )

  const filteredMessages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return messages.filter(message => {
      const translation = messageTranslation(message, locale)
      if (catalog && !message.catalogs?.includes(catalog)) {
        return false
      }
      if (status === 'missing' && translation) {
        return false
      }
      if (status === 'translated' && !translation) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }
      return [
        message.id,
        message.defaultMessage,
        message.description ?? '',
        translation,
      ].some(value => value.toLocaleLowerCase().includes(normalizedQuery))
    })
  }, [catalog, locale, messages, query, status])

  const pageCount = Math.max(
    1,
    Math.ceil(filteredMessages.length / effectivePageSize)
  )
  const visibleMessages = filteredMessages.slice(
    page * effectivePageSize,
    (page + 1) * effectivePageSize
  )
  const selectedMessage = messages.find(message => message.id === selectedId)
  const selectedTranslation = selectedMessage
    ? messageTranslation(selectedMessage, locale)
    : ''
  const validationError = selectedMessage
    ? validateTranslation(selectedMessage.defaultMessage, draft)
    : null
  const changed = selectedMessage !== undefined && draft !== baseline

  useEffect(() => {
    if (filteredMessages.some(message => message.id === selectedId)) {
      return
    }
    setSelectedId(filteredMessages[0]?.id ?? '')
  }, [filteredMessages, selectedId])

  useEffect(() => {
    setDraft(selectedTranslation)
    setBaseline(selectedTranslation)
    setSaveError(null)
    setSaveMessage(null)
  }, [locale, selectedId, selectedTranslation])

  const resetFilters = (): void => setPage(0)
  const save = async (event: FormEvent): Promise<void> => {
    event.preventDefault()
    if (!selectedMessage || validationError || !changed) {
      return
    }
    setIsSaving(true)
    setSaveError(null)
    setSaveMessage(null)
    try {
      await onSave({id: selectedMessage.id, locale, translation: draft})
      setBaseline(draft)
      setSaveMessage('Translation saved.')
    } catch (error) {
      setSaveError(errorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  if (!locales.length) {
    return (
      <output className="formatjs-editor formatjs-editor--empty">
        Add at least one target locale to begin editing translations.
      </output>
    )
  }

  return (
    <main className="formatjs-editor">
      <header className="formatjs-editor__header">
        <div>
          <h1>{title}</h1>
          <p>
            {messages.length.toLocaleString()} source messages · {sourceLocale}
          </p>
        </div>
        <div className="formatjs-editor__filters">
          <label>
            Locale
            <select
              value={locale}
              onChange={event => {
                setLocale(event.currentTarget.value)
                resetFilters()
              }}
            >
              {locales.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Catalog
            <select
              value={catalog}
              onChange={event => {
                setCatalog(event.currentTarget.value)
                resetFilters()
              }}
            >
              <option value={ALL_CATALOGS}>All catalogs</option>
              {catalogs.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={event => {
                setStatus(event.currentTarget.value as MessageStatus)
                resetFilters()
              }}
            >
              <option value="all">All messages</option>
              <option value="translated">Translated</option>
              <option value="missing">Missing</option>
            </select>
          </label>
        </div>
      </header>

      {saveMessage && (
        <output className="formatjs-editor__notice">{saveMessage}</output>
      )}
      {saveError && (
        <div className="formatjs-editor__error-banner" role="alert">
          {saveError}
        </div>
      )}

      <div className="formatjs-editor__layout">
        <section className="formatjs-editor__messages" aria-label="Messages">
          <div className="formatjs-editor__search">
            <label>
              Search messages
              <input
                type="search"
                placeholder="Source, translation, description, or ID"
                value={query}
                onChange={event => {
                  setQuery(event.currentTarget.value)
                  resetFilters()
                }}
              />
            </label>
            <p>
              {filteredMessages.length.toLocaleString()} message
              {filteredMessages.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="formatjs-editor__message-list">
            {visibleMessages.map(message => {
              const translation = messageTranslation(message, locale)
              return (
                <button
                  aria-pressed={message.id === selectedId}
                  className="formatjs-editor__message-button"
                  key={message.id}
                  onClick={() => setSelectedId(message.id)}
                  type="button"
                >
                  <span>{message.defaultMessage}</span>
                  <small>
                    <code>{message.id}</code>
                    <span data-status={translation ? 'translated' : 'missing'}>
                      {translation ? 'Translated' : 'Missing'}
                    </span>
                  </small>
                </button>
              )
            })}
            {!visibleMessages.length && <p>No messages match these filters.</p>}
          </div>
          {pageCount > 1 && (
            <nav
              className="formatjs-editor__pagination"
              aria-label="Message pages"
            >
              <button
                disabled={page === 0}
                onClick={() => setPage(current => Math.max(0, current - 1))}
                type="button"
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {pageCount}
              </span>
              <button
                disabled={page + 1 >= pageCount}
                onClick={() => setPage(current => current + 1)}
                type="button"
              >
                Next
              </button>
            </nav>
          )}
        </section>

        <section
          className="formatjs-editor__translation"
          aria-label="Translation editor"
        >
          {selectedMessage ? (
            <form onSubmit={save}>
              <div>
                <h2>{sourceLocale} source</h2>
                <div className="formatjs-editor__preview">
                  <MessagePreview message={selectedMessage.defaultMessage} />
                </div>
                {selectedMessage.description && (
                  <p className="formatjs-editor__description">
                    {selectedMessage.description}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={translationId}>
                  {locale} translation
                  <span>{draft.length.toLocaleString()} characters</span>
                </label>
                <textarea
                  aria-label={`${locale} translation`}
                  aria-invalid={changed && validationError !== null}
                  id={translationId}
                  rows={7}
                  value={draft}
                  onChange={event => setDraft(event.currentTarget.value)}
                />
                {changed && validationError && (
                  <p className="formatjs-editor__error" role="alert">
                    {validationError}
                  </p>
                )}
              </div>
              <div>
                <h2>ICU preview</h2>
                <div className="formatjs-editor__preview">
                  <MessagePreview message={draft} />
                </div>
                <p className="formatjs-editor__hint">
                  Arguments, tags, plurals, and selectors are locked tokens and
                  must match the source.
                </p>
              </div>
              <div className="formatjs-editor__actions">
                <button
                  disabled={!changed || isSaving}
                  onClick={() => setDraft(baseline)}
                  type="button"
                >
                  Reset
                </button>
                <button
                  disabled={!changed || validationError !== null || isSaving}
                  type="submit"
                >
                  {isSaving ? 'Saving…' : 'Save translation'}
                </button>
              </div>
            </form>
          ) : (
            <p>Select a message to edit its translation.</p>
          )}
        </section>

        <aside
          className="formatjs-editor__context"
          aria-label="Message context"
        >
          {selectedMessage && (
            <>
              <div>
                <h2>Message ID</h2>
                <code>{selectedMessage.id}</code>
              </div>
              {!!selectedMessage.catalogs?.length && (
                <div>
                  <h2>Catalogs</h2>
                  <ul>
                    {selectedMessage.catalogs.map(value => (
                      <li key={value}>{value}</li>
                    ))}
                  </ul>
                </div>
              )}
              {!!selectedMessage.locations?.length && (
                <div>
                  <h2>Source locations</h2>
                  <ul>
                    {selectedMessage.locations.map(location => (
                      <li key={`${location.file}:${location.start ?? 0}`}>
                        {formatLocation(location)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </main>
  )
}
