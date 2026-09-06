/** Tests the Unicode locale identifier `type` grammar, not locale support. */
export function IsUnicodeLocaleIdentifierType(value: string): boolean {
  // ResolveOptions step 6.d.ii requires a Unicode locale identifier type.
  // ECMA-402 §9.2.8 ResolveOptions, step 6.d.ii.
  // https://tc39.es/ecma402/#sec-resolveoptions
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L314
  // Require end of input; $ would also accept a trailing line terminator.
  return /^[a-z0-9]{3,8}(-[a-z0-9]{3,8})*(?![\s\S])/i.test(value)
}
