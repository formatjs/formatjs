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
/** Render-snapshot metadata plus consumer-owned context supplied to save. */
export interface TranslationSaveSnapshot<TContext = void> {
  readonly source: string
  readonly baselineTranslation: string
  readonly context: TContext | undefined
}
export type TranslationSaveResult<TResult = void> =
  | {status: 'saved'; value: TResult}
  | {status: 'failed'; error: Error}
  | {status: 'invalid'; validationError: TranslationValidationError}
  | {status: 'skipped'; reason: 'unavailable' | 'unchanged' | 'pending'}
export interface TranslationEditorOptions<TContext = void, TResult = void> {
  messages: readonly EditorMessage[]
  locales: readonly string[]
  onSave: (
    update: TranslationUpdate,
    snapshot: TranslationSaveSnapshot<TContext>
  ) => TResult | Promise<TResult>
  defaultLocale?: string
  pageSize?: number
}
/** A render snapshot and actions for one message/locale pair. */
export interface TranslationDraftState<TContext = void, TResult = void> {
  readonly value: string
  readonly baseline: string
  readonly validationError: TranslationValidationError | null
  readonly changed: boolean
  readonly isSaving: boolean
  readonly saveError: Error | null
  readonly saved: boolean
  setTranslation: (value: string) => void
  reset: () => void
  save: (context?: TContext) => Promise<TranslationSaveResult<TResult>>
}
export interface TranslationEditorState<TContext = void, TResult = void> {
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
  save: (context?: TContext) => Promise<TranslationSaveResult<TResult>>
  reset: () => void
  getTranslation: (
    id: string,
    locale: string
  ) => TranslationDraftState<TContext, TResult> | undefined
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
export function useTranslationEditor<TContext = void, TResult = void>({
  messages,
  locales,
  onSave,
  defaultLocale,
  pageSize = 100,
}: TranslationEditorOptions<TContext, TResult>): TranslationEditorState<
  TContext,
  TResult
> {
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
  const getDraft = (id: string, targetLocale = locale ?? ''): Draft =>
    reconcile(
      drafts[draftKey(id, targetLocale)],
      remoteValues.current.get(draftKey(id, targetLocale)) ?? ''
    )
  function update(key: string, change: (draft: Draft) => Draft): void {
    setDrafts(current => ({
      ...current,
      [key]: change(
        reconcile(
          current[key],
          remoteValues.current.get(key) ?? current[key]?.remote ?? ''
        )
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
  const size =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.max(1, Math.floor(pageSize))
      : 100
  const pageCount = Math.max(1, Math.ceil(editor.messages.length / size))
  const page = Math.min(requestedPage, pageCount - 1)
  useEffect(() => {
    requestPage(current => Math.min(current, pageCount - 1))
  }, [pageCount])
  function getTranslation(
    id: string,
    targetLocale: string
  ): TranslationDraftState<TContext, TResult> | undefined {
    const message = messages.find(value => value.id === id)
    if (!message || !locales.includes(targetLocale)) return undefined
    const key = draftKey(id, targetLocale)
    const draft = getDraft(id, targetLocale)
    const source = message.defaultMessage
    const validationError = validateTranslation(source, draft.value)
    const changed = draft.value !== draft.baseline
    return {
      value: draft.value,
      baseline: draft.baseline,
      validationError,
      changed,
      isSaving: draft.saving,
      saveError: draft.error,
      saved: draft.saved && !changed,
      setTranslation: value => {
        if (!remoteValues.current.has(key)) return
        update(key, current => ({...current, value, error: null, saved: false}))
      },
      reset: () => {
        if (!remoteValues.current.has(key)) return
        update(key, current => ({
          ...current,
          value: current.baseline,
          error: null,
          saved: false,
        }))
      },
      save: async context => {
        if (!remoteValues.current.has(key))
          return {status: 'skipped', reason: 'unavailable'}
        if (pending.current.has(key))
          return {status: 'skipped', reason: 'pending'}
        if (!changed) return {status: 'skipped', reason: 'unchanged'}
        if (validationError) return {status: 'invalid', validationError}
        const submitted = draft.value
        const snapshot: TranslationSaveSnapshot<TContext> = Object.freeze({
          source,
          baselineTranslation: draft.baseline,
          context,
        })
        pending.current.add(key)
        update(key, current => ({
          ...current,
          saving: true,
          error: null,
          saved: false,
        }))
        try {
          const value = await onSave(
            {id, locale: targetLocale, translation: submitted},
            snapshot
          )
          update(key, current => ({
            ...current,
            baseline: submitted,
            saved: true,
          }))
          return {status: 'saved', value}
        } catch (error) {
          const saveError =
            error instanceof Error ? error : new Error(String(error))
          update(key, current => ({...current, error: saveError}))
          return {status: 'failed', error: saveError}
        } finally {
          pending.current.delete(key)
          update(key, current => ({...current, saving: false}))
        }
      },
    }
  }
  const selectedTranslation =
    selectedMessage && locale !== undefined
      ? getTranslation(selectedMessage.id, locale)
      : undefined
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
    validationError: selectedTranslation?.validationError ?? null,
    changed: selectedTranslation?.changed ?? false,
    isSaving: selectedTranslation?.isSaving ?? false,
    saveError: selectedTranslation?.saveError ?? null,
    saved: selectedTranslation?.saved ?? false,
    save: async context =>
      selectedTranslation
        ? selectedTranslation.save(context)
        : {status: 'skipped', reason: 'unavailable'},
    reset: () => selectedTranslation?.reset(),
    getTranslation,
  }
}
