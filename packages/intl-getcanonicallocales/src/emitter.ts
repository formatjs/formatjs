import {UnicodeLanguageId, UnicodeLocaleId} from './types';

export function emitUnicodeLanguageId(lang?: UnicodeLanguageId): string {
  if (!lang) {
    return '';
  }
  return [lang.lang, lang.script, lang.region, ...(lang.variants || [])]
    .filter(Boolean)
    .join('-');
}

export function emitUnicodeLocaleId({
  lang,
  extensions,
}: UnicodeLocaleId): string {
  const chunks = [emitUnicodeLanguageId(lang)];
  for (const ext of extensions) {
    chunks.push(ext.type);
    switch (ext.type) {
      case 'u':
        chunks.push(
          ...ext.attributes,
          ...ext.keywords.reduce((all: string[], kv) => all.concat(kv), [])
        );
        break;
      case 't':
        chunks.push(
          emitUnicodeLanguageId(ext.lang),
          ...ext.fields.reduce((all: string[], kv) => all.concat(kv), [])
        );
        break;
      default:
        chunks.push(ext.value);
        break;
    }
  }

  return chunks.filter(Boolean).join('-');
}
