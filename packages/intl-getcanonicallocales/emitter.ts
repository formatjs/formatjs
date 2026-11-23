import {lowerCase} from '#packages/intl-getcanonicallocales/parser.js'
import {
  type KV,
  type UnicodeLanguageId,
  type UnicodeLocaleId,
} from '#packages/intl-getcanonicallocales/types.js'

function appendSubtag(tag: string, subtag?: string): string {
  if (!subtag) return tag
  return tag ? tag + '-' + subtag : subtag
}

export function emitUnicodeLanguageId(lang?: UnicodeLanguageId): string {
  if (!lang) return ''
  let tag = appendSubtag(appendSubtag(lang.lang, lang.script), lang.region)
  const variants = lang.variants
  for (let i = 0; variants && i < variants.length; i++)
    tag = appendSubtag(tag, variants[i])
  return tag
}

function appendFields(tag: string, fields: KV[]): string {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    tag = appendSubtag(tag, field[0])
    if (field.length > 1) tag = appendSubtag(tag, field[1])
  }
  return tag
}

// ECMA-402 §6.2.2 steps 2.c–g concatenate private locale fields.
// https://tc39.es/ecma402/#sec-canonicalizeunicodelocaleid
export function emitUnicodeLocaleId({
  lang,
  extensions,
}: UnicodeLocaleId): string {
  let tag = emitUnicodeLanguageId(lang)
  for (let i = 0; i < extensions.length; i++) {
    const ext = extensions[i]
    tag = appendSubtag(tag, ext.type)
    switch (ext.type) {
      case 'u':
        for (let j = 0; j < ext.attributes.length; j++)
          tag = appendSubtag(tag, ext.attributes[j])
        tag = appendFields(tag, ext.keywords)
        break
      case 't':
        tag = appendSubtag(tag, lowerCase(emitUnicodeLanguageId(ext.lang)))
        tag = appendFields(tag, ext.fields)
        break
      default:
        tag = appendSubtag(tag, ext.value)
        break
    }
  }

  return tag
}
