import {useEffect, useMemo, useRef, useState} from 'react'
import {useMessageEditor, type EditorState} from '#packages/editor/core.js'
import {
  validateTranslation,
  type TranslationValidationError,
} from '#packages/editor/validation.js'
import {matchesMessageStatus} from '#packages/editor/message-status.js'
import type {SourceLocation} from '#packages/editor/source-location.js'

export type {SourceLocation} from '#packages/editor/source-location.js'
/** One independent translation workspace served by the same editor shell. */
export interface EditorProject {
  id: string
  label: string
  description?: string
}
export interface EditorMessage {
  id: string
  defaultMessage: string
  description?: string
  /** Build units that compile this message. */
  catalogs?: readonly string[]
  /** Upload streams (for example branches) that currently include this message. */
  sources?: readonly string[]
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
export type ProjectChangeResult =
  | {status: 'changed'; project: EditorProject}
  | {status: 'unchanged'}
  | {status: 'blocked'; reason: 'unsaved-drafts' | 'unknown-project'}
export interface ProjectChangeOptions {
  /** Drop every unsaved draft instead of blocking the change. */
  discardDrafts?: boolean
}
export interface TranslationEditorOptions<TContext = void, TResult = void> {
  /** Messages, locales, and persistence for the active project. */
  messages: readonly EditorMessage[]
  locales: readonly string[]
  onSave: (
    update: TranslationUpdate,
    snapshot: TranslationSaveSnapshot<TContext>
  ) => TResult | Promise<TResult>
  defaultLocale?: string
  pageSize?: number
  /** Selectable workspaces; the hook never loads their data itself. */
  projects?: readonly EditorProject[]
  /** Controlled active project ID. */
  project?: string
  /** Initial project ID when `project` is uncontrolled. */
  defaultProject?: string
  onProjectChange?: (projectId: string) => void
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
  sources: readonly string[]
  /** Active source filter; the empty string shows every source. */
  source: string
  setSource: (source: string) => void
  projects: readonly EditorProject[]
  project: EditorProject | undefined
  /** Resets paging, selection, and catalog/source filters; blocked while drafts are unsaved. */
  setProject: (
    projectId: string,
    options?: ProjectChangeOptions
  ) => ProjectChangeResult
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
const noProjects: readonly EditorProject[] = []
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
  projects = noProjects,
  project: controlledProject,
  defaultProject,
  onProjectChange,
}: TranslationEditorOptions<TContext, TResult>): TranslationEditorState<
  TContext,
  TResult
> {
  const [uncontrolledProject, requestProject] = useState(defaultProject)
  const requestedProject = controlledProject ?? uncontrolledProject
  const project =
    projects.find(value => value.id === requestedProject) ?? projects[0]
  const [requestedLocale, requestLocale] = useState(defaultLocale)
  const locale =
    requestedLocale && locales.includes(requestedLocale)
      ? requestedLocale
      : locales[0]
  const [requestedCatalog, requestCatalog] = useState('')
  const [requestedSource, requestSource] = useState('')
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
  const sources = useMemo(() => {
    const values = new Set<string>()
    for (const message of messages) {
      for (const source of message.sources ?? []) values.add(source)
    }
    return [...values].sort()
  }, [messages])
  const source = sources.includes(requestedSource) ? requestedSource : ''
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
              const draft = getDraft(message.id)
              const translations =
                (Object.prototype.hasOwnProperty.call(
                  message.translations,
                  locale
                ) &&
                  message.translations[locale] !== undefined) ||
                draft.baseline
                  ? {[locale]: draft.baseline}
                  : {}
              return (
                (!catalog || message.catalogs?.includes(catalog)) &&
                (!source || message.sources?.includes(source)) &&
                matchesMessageStatus(translations, [locale], status)
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
  const hasUnsavedDrafts = (): boolean =>
    Object.entries(drafts).some(([key, draft]) => {
      const current = reconcile(
        draft,
        remoteValues.current.get(key) ?? draft.remote
      )
      return current.value !== current.baseline
    })
  function setProject(
    projectId: string,
    options?: ProjectChangeOptions
  ): ProjectChangeResult {
    const next = projects.find(value => value.id === projectId)
    if (!next) return {status: 'blocked', reason: 'unknown-project'}
    if (next.id === project?.id) return {status: 'unchanged'}
    if (hasUnsavedDrafts()) {
      if (!options?.discardDrafts)
        return {status: 'blocked', reason: 'unsaved-drafts'}
      setDrafts({})
    }
    editor.clearSelection()
    requestCatalog('')
    requestSource('')
    requestPage(0)
    if (controlledProject === undefined) requestProject(projectId)
    onProjectChange?.(projectId)
    return {status: 'changed', project: next}
  }
  return {
    editor: {
      ...editor,
      setQuery: query => {
        editor.setQuery(query)
        requestPage(0)
      },
      setDescriptionQuery: query => {
        editor.setDescriptionQuery(query)
        requestPage(0)
      },
      setSearchMode: mode => {
        editor.setSearchMode(mode)
        requestPage(0)
      },
      setSearchScope: scope => {
        editor.setSearchScope(scope)
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
    sources,
    source,
    setSource: value => {
      requestSource(value)
      requestPage(0)
    },
    projects,
    project,
    setProject,
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
