const typeApply = Reflect.apply
const charCodeAt = String.prototype.charCodeAt

/** Tests the Unicode locale identifier `type` grammar, not locale support. */
export function IsUnicodeLocaleIdentifierType(value: string): boolean {
  // ResolveOptions step 6.d.ii requires a Unicode locale identifier type.
  // ECMA-402 §9.2.8 ResolveOptions, step 6.d.ii.
  // https://tc39.es/ecma402/#sec-resolveoptions
  let length = 0
  for (let index = 0; index < value.length; index++) {
    const code = typeApply(charCodeAt, value, [index]) as number
    if (code === 45) {
      if (length < 3) return false
      length = 0
      continue
    }
    const letter = code | 32
    if (!(letter >= 97 && letter <= 122) && !(code >= 48 && code <= 57))
      return false
    if (++length > 8) return false
  }
  return length >= 3
}
