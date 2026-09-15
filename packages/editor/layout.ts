import {useState} from 'react'

export type TranslationLayout = 'grid' | 'list'

export interface EditorPreferenceStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface TranslationLayoutOptions {
  storageKey: string
  defaultLayout?: TranslationLayout
  /** Defaults to browser localStorage when available. Pass null to disable persistence. */
  storage?: EditorPreferenceStorage | null
}

export interface TranslationLayoutState {
  layout: TranslationLayout
  setLayout: (layout: TranslationLayout) => void
}

function browserStorage(): EditorPreferenceStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function readLayout(
  storage: EditorPreferenceStorage | null,
  storageKey: string,
  fallback: TranslationLayout
): TranslationLayout {
  try {
    const stored = storage?.getItem(storageKey)
    if (stored === 'grid' || stored === 'list') return stored
    const value =
      stored === null || stored === undefined ? null : JSON.parse(stored)
    return value === 'grid' || value === 'list' ? value : fallback
  } catch {
    return fallback
  }
}

/** Layout preference state with guarded browser persistence and a grid default. */
export function useTranslationLayout({
  storageKey,
  defaultLayout = 'grid',
  storage = browserStorage(),
}: TranslationLayoutOptions): TranslationLayoutState {
  const [layout, updateLayout] = useState(() =>
    readLayout(storage, storageKey, defaultLayout)
  )
  return {
    layout,
    setLayout: value => {
      updateLayout(value)
      try {
        storage?.setItem(storageKey, JSON.stringify(value))
      } catch {
        // Persistence is best-effort; the in-memory preference still applies.
      }
    },
  }
}
