const apply = Reflect.apply
const charCodeAt = String.prototype.charCodeAt

// ECMA-402 §6.3.1 steps 1–4 accept exactly three ASCII letters.
// https://tc39.es/ecma402/#sec-iswellformedcurrencycode
export function IsWellFormedCurrencyCode(currency: string): boolean {
  if (currency.length !== 3) return false
  for (let index = 0; index < currency.length; index++) {
    const code = apply(charCodeAt, currency, [index])
    if (!(code >= 0x41 && code <= 0x5a) && !(code >= 0x61 && code <= 0x7a))
      return false
  }
  return true
}
