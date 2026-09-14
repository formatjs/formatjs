import type {MessageStatus} from '#packages/editor/workflow.js'

export type MessageTranslations = Readonly<Record<string, string | undefined>>

/** Translated means a catalog entry exists for every selected locale. */
export function hasTranslationForEveryLocale(
  translations: MessageTranslations,
  locales: readonly string[]
): boolean {
  return (
    locales.length > 0 &&
    locales.every(locale =>
      Object.prototype.hasOwnProperty.call(translations, locale)
    )
  )
}

export function matchesMessageStatus(
  translations: MessageTranslations,
  locales: readonly string[],
  status: MessageStatus
): boolean {
  if (status === 'all') return true
  const translated = hasTranslationForEveryLocale(translations, locales)
  return status === 'translated' ? translated : !translated
}
