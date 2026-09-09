import {appendToList} from '#packages/intl-getcanonicallocales/appendToList.js'
import {
  type UnicodeLanguageId,
  type UnicodeLocaleId,
} from '#packages/intl-getcanonicallocales/types.js'

export function emitUnicodeLanguageId(lang?: UnicodeLanguageId): string {
  if (!lang) {
    return ''
  }
  return [lang.lang, lang.script, lang.region, ...(lang.variants || [])]
    .filter(Boolean)
    .join('-')
}

export function emitUnicodeLocaleId({
  lang,
  extensions,
}: UnicodeLocaleId): string {
  const chunks = [emitUnicodeLanguageId(lang)]
  for (const ext of extensions) {
    appendToList(chunks, ext.type)
    switch (ext.type) {
      case 'u':
        appendToList(
          chunks,
          ...ext.attributes,
          ...ext.keywords.reduce((all: string[], kv) => all.concat(kv), [])
        )
        break
      case 't':
        appendToList(
          chunks,
          emitUnicodeLanguageId(ext.lang).toLowerCase(),
          ...ext.fields.reduce((all: string[], kv) => all.concat(kv), [])
        )
        break
      default:
        appendToList(chunks, ext.value)
        break
    }
  }

  return chunks.filter(Boolean).join('-')
}
