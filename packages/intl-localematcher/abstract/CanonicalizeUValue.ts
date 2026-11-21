import {invariant} from '#packages/intl-localematcher/abstract/utils.js'
import {
  extensionAlias,
  subdivisionAlias,
} from '@formatjs_generated/cldr.core/aliases.js'

const hasOwn = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty
) as (object: object, property: string) => boolean

export function CanonicalizeUValue(ukey: string, uvalue: string): string {
  invariant(ukey !== undefined, `ukey must be defined`)
  // https://tc39.es/ecma402/#sec-canonicalizeuvalue
  let canonicalized = ''
  for (let i = 0; i < uvalue.length; i++) {
    const code = uvalue.charCodeAt(i)
    canonicalized +=
      code >= 65 && code <= 90 ? String.fromCharCode(code + 32) : uvalue[i]
  }
  const aliases = hasOwn(extensionAlias.u, ukey)
    ? extensionAlias.u[ukey]
    : undefined
  if (aliases && hasOwn(aliases, canonicalized)) {
    canonicalized = aliases[canonicalized]
  }
  if (
    (ukey === 'rg' || ukey === 'sd') &&
    hasOwn(subdivisionAlias, canonicalized)
  ) {
    canonicalized = subdivisionAlias[canonicalized]
  }
  return canonicalized === 'true' ? '' : canonicalized
}
