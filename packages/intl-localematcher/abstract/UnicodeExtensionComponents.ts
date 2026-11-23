import {
  arrayFind,
  arrayIndexOf,
  setDataProperty,
  stringIndexOf,
  stringLowerCase,
  stringSlice,
} from '#packages/intl-localematcher/abstract/intrinsics.js'
import type {Keyword} from '#packages/intl-localematcher/abstract/types.js'
import {invariant} from '#packages/intl-localematcher/abstract/utils.js'

export function UnicodeExtensionComponents(extension: string): {
  attributes: string[]
  keywords: Array<Keyword>
} {
  // ECMA-402 §9.2.5 steps 1–2: check the canonical extension.
  invariant(
    extension === stringLowerCase(extension),
    'Expected extension to be lowercase'
  )
  invariant(
    stringSlice(extension, 0, 3) === '-u-',
    'Expected extension to be a Unicode locale extension'
  )
  const attributes: string[] = []
  const keywords: Array<Keyword> = []
  let keyword: Keyword | undefined
  let size = extension.length
  let k = 3
  while (k < size) {
    // ECMA-402 §9.2.5 steps 8.a–c: find the next subtag.
    let e = stringIndexOf(extension, '-', k)
    let len
    if (e === -1) {
      len = size - k
    } else {
      len = e - k
    }
    let subtag = stringSlice(extension, k, k + len)
    invariant(len >= 2, 'Expected a subtag to have at least 2 characters')
    if (keyword === undefined && len != 2) {
      if (arrayIndexOf(attributes, subtag) === -1) {
        // ECMA-402 §9.2.5 step 8.f.i: append an own List element.
        setDataProperty(attributes, `${attributes.length}`, subtag)
      }
    } else if (len === 2) {
      keyword = {key: subtag, value: ''}
      if (arrayFind(keywords, k => k.key === keyword?.key) === undefined) {
        // ECMA-402 §9.2.5 step 8.g.ii: retain the first keyword.
        setDataProperty(keywords, `${keywords.length}`, keyword)
      }
    } else if (keyword?.value === '') {
      keyword.value = subtag
    } else {
      invariant(keyword !== undefined, 'Expected keyword to be defined')
      keyword.value += '-' + subtag
    }
    k += len + 1
  }
  return {attributes, keywords}
}
