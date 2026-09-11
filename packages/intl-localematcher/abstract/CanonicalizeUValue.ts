import {invariant} from '#packages/intl-localematcher/abstract/utils.js'
import {
  extensionAlias,
  subdivisionAlias,
} from '@formatjs_generated/cldr.core/aliases.js'

export function CanonicalizeUValue(ukey: string, uvalue: string): string {
  invariant(ukey !== undefined, `ukey must be defined`)
  // https://tc39.es/ecma402/#sec-canonicalizeuvalue
  let canonicalized = ''
  for (let i = 0; i < uvalue.length; i++) {
    const code = uvalue.charCodeAt(i)
    canonicalized +=
      code >= 65 && code <= 90 ? String.fromCharCode(code + 32) : uvalue[i]
  }
  const aliases = Object.prototype.hasOwnProperty.call(extensionAlias.u, ukey)
    ? extensionAlias.u[ukey]
    : undefined
  if (aliases && Object.prototype.hasOwnProperty.call(aliases, canonicalized)) {
    canonicalized = aliases[canonicalized]
  }
  if (
    (ukey === 'rg' || ukey === 'sd') &&
    Object.prototype.hasOwnProperty.call(subdivisionAlias, canonicalized)
  ) {
    canonicalized = subdivisionAlias[canonicalized]
  }
  return canonicalized === 'true' ? '' : canonicalized
}
