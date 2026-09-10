import {useEffect, useMemo, useRef, useState} from 'react'
import {useMessageEditor, type EditorState} from '#packages/editor/core.js'
import {
  validateTranslation,
  type TranslationValidationError,
} from '#packages/editor/validation.js'

export interface SourceLocation {
  file: string
  start?: number
  end?: number
}
export interface EditorMessage {
  id: string
  defaultMessage: string
  description?: string
  catalogs?: readonly string[]
  locations?: readonly SourceLocation[]
  translations: Readonly<Record<string, string | undefined>>
}
export interface TranslationUpdate {
  id: string
  locale: string
  translation: string
}
export type MessageStatus = 'all' | 'translated' | 'missing'
export interface TranslationEditorOptions {
  messages: readonly EditorMessage[]
  locales: readonly string[]
  onSave: (update: TranslationUpdate) => void | Promise<void>
  defaultLocale?: string
  pageSize?: number
}
export interface TranslationEditorState {
  editor: EditorState
  selectedMessage: EditorMessage | undefined
  locale: string | undefined
  setLocale: (locale: string) => void
  catalogs: readonly string[]
  catalog: string
  setCatalog: (catalog: string) => void
  status: MessageStatus
  setStatus: (status: MessageStatus) => void
  page: number
  pageCount: number
  setPage: (page: number) => void
  pageMessages: EditorState['messages']
  validationError: TranslationValidationError | null
  changed: boolean
  isSaving: boolean
  saveError: Error | null
  saved: boolean
  save: () => Promise<void>
  reset: () => void
}
interface Draft {
  value: string
  baseline: string
  remote: string
  saving: boolean
  error: Error | null
  saved: boolean
}
const draftKey = (id: string, locale: string): string =>
  JSON.stringify([id, locale])
function reconcile(draft: Draft | undefined, remote: string): Draft {
  if (!draft)
    return {
      value: remote,
      baseline: remote,
      remote,
      saving: false,
      error: null,
      saved: false,
    }
  if (draft.remote === remote) return draft
  return {
    ...draft,
    remote,
    baseline: remote,
    value: draft.value === draft.baseline ? remote : draft.value,
  }
}

/** Per-message, per-locale drafts layered on the existing headless editor. */
export function useTranslationEditor({
  messages,
  locales,
  onSave,
  defaultLocale,
  pageSize = 100,
}: TranslationEditorOptions): TranslationEditorState {
  const [requestedLocale, requestLocale] = useState(defaultLocale)
  const locale =
    requestedLocale && locales.includes(requestedLocale)
      ? requestedLocale
      : locales[0]
  const [requestedCatalog, requestCatalog] = useState('')
  const [status, updateStatus] = useState<MessageStatus>('all')
  const [requestedPage, requestPage] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const pending = useRef(new Set<string>())
  const remoteValues = useRef(new Map<string, string>())
  const values = new Map<string, string>()
  for (const message of messages) {
    for (const value of locales) {
      values.set(draftKey(message.id, value), message.translations[value] ?? '')
    }
  }
  remoteValues.current = values
  const catalogs = useMemo(() => {
    const values = new Set<string>()
    for (const message of messages) {
      for (const catalog of message.catalogs ?? []) values.add(catalog)
    }
    return [...values].sort()
  }, [messages])
  const catalog = catalogs.includes(requestedCatalog) ? requestedCatalog : ''
  const getDraft = (id: string): Draft =>
    reconcile(
      drafts[draftKey(id, locale ?? '')],
      remoteValues.current.get(draftKey(id, locale ?? '')) ?? ''
    )
  function update(key: string, change: (draft: Draft) => Draft): void {
    setDrafts(current => ({
      ...current,
      [key]: change(
        reconcile(current[key], remoteValues.current.get(key) ?? '')
      ),
    }))
  }
  const editor = useMessageEditor({
    messages:
      locale === undefined
        ? []
        : messages
            .filter(message => {
              const translated = !!getDraft(message.id).baseline
              return (
                (!catalog || message.catalogs?.includes(catalog)) &&
                (status === 'all' ||
                  (status === 'translated' ? translated : !translated))
              )
            })
            .map(message => ({
              id: message.id,
              defaultMessage: message.defaultMessage,
              description: message.description,
              translatedMessage: getDraft(message.id).value,
            })),
    onMessageChange: message => {
      if (locale !== undefined)
        update(draftKey(message.id, locale), draft => ({
          ...draft,
          value: message.translatedMessage,
          error: null,
          saved: false,
        }))
    },
  })
  const selectedMessage = messages.find(
    message => message.id === editor.selectedMessage?.id
  )
  const selected =
    selectedMessage && locale !== undefined
      ? getDraft(selectedMessage.id)
      : undefined
  const size =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.max(1, Math.floor(pageSize))
      : 100
  const pageCount = Math.max(1, Math.ceil(editor.messages.length / size))
  const page = Math.min(requestedPage, pageCount - 1)
  useEffect(() => {
    requestPage(current => Math.min(current, pageCount - 1))
  }, [pageCount])
  const validationError =
    selectedMessage && selected
      ? validateTranslation(selectedMessage.defaultMessage, selected.value)
      : null
  const changed = selected !== undefined && selected.value !== selected.baseline
  async function save(): Promise<void> {
    if (
      !selectedMessage ||
      !selected ||
      locale === undefined ||
      !changed ||
      validationError
    )
      return
    const key = draftKey(selectedMessage.id, locale)
    if (pending.current.has(key)) return
    const submitted = selected.value
    pending.current.add(key)
    update(key, draft => ({...draft, saving: true, error: null, saved: false}))
    try {
      await onSave({id: selectedMessage.id, locale, translation: submitted})
      update(key, draft => ({
        ...draft,
        baseline: submitted,
        saved: true,
      }))
    } catch (error) {
      update(key, draft => ({
        ...draft,
        error: error instanceof Error ? error : new Error(String(error)),
      }))
    } finally {
      pending.current.delete(key)
      update(key, draft => ({...draft, saving: false}))
    }
  }
  return {
    editor: {
      ...editor,
      setQuery: query => {
        editor.setQuery(query)
        requestPage(0)
      },
    },
    selectedMessage,
    locale,
    setLocale: value => {
      requestLocale(value)
      requestPage(0)
    },
    catalogs,
    catalog,
    setCatalog: value => {
      requestCatalog(value)
      requestPage(0)
    },
    status,
    setStatus: value => {
      updateStatus(value)
      requestPage(0)
    },
    page,
    pageCount,
    setPage: value =>
      requestPage(
        Number.isFinite(value)
          ? Math.max(0, Math.min(Math.floor(value), pageCount - 1))
          : 0
      ),
    pageMessages: editor.messages.slice(page * size, (page + 1) * size),
    validationError,
    changed,
    isSaving: selected?.saving ?? false,
    saveError: selected?.error ?? null,
    saved: !!selected?.saved && !changed,
    save,
    reset: () => {
      if (selectedMessage && locale !== undefined)
        update(draftKey(selectedMessage.id, locale), draft => ({
          ...draft,
          value: draft.baseline,
          error: null,
          saved: false,
        }))
    },
  }
}
