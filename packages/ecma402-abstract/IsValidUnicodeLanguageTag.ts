const UNICODE_TYPE_REGEX = /^[a-z0-9]{3,8}(-[a-z0-9]{3,8})*$/i

/**
 * https://tc39.es/ecma402/#sec-language-tags
 */
export function IsValidUnicodeLanguageTag(tag: string) {
  return !!UNICODE_TYPE_REGEX.test(tag)
}
