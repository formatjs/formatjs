/** Tests the Unicode locale identifier `type` grammar, not locale support. */
export function IsUnicodeLocaleIdentifierType(value: string): boolean {
  // ResolveOptions step 6.d.ii requires a Unicode locale identifier type.
  // https://tc39.es/ecma402/#sec-resolveoptions:~:text=If%20value%20cannot%20be%20matched
  // https://unicode.org/reports/tr35/#Unicode_locale_identifier
  // Require end of input; $ would also accept a trailing line terminator.
  return /^[a-z0-9]{3,8}(-[a-z0-9]{3,8})*(?![\s\S])/i.test(value)
}
