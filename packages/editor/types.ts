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

export type MessageStatus = 'all' | 'missing' | 'translated'

export interface TranslationUpdate {
  id: string
  locale: string
  translation: string
}

export interface EditorProps {
  messages: readonly EditorMessage[]
  locales: readonly string[]
  onSave: (update: TranslationUpdate) => void | Promise<void>
  defaultLocale?: string
  sourceLocale?: string
  title?: string
  pageSize?: number
}
