import {Keyword} from './types'
import {invariant} from './utils'

export function UnicodeExtensionComponents(extension: string): {
  attributes: string[]
  keywords: Array<Keyword>
} {
  invariant(
    extension === extension.toLowerCase(),
    'Expected extension to be lowercase'
  )
  invariant(
    extension.slice(0, 3) === '-u-',
    'Expected extension to be a Unicode locale extension'
  )
  const attributes: string[] = []
  const keywords: Array<Keyword> = []
  let keyword: Keyword | undefined
  let size = extension.length
  let k = 3
  while (k < size) {
    let e = extension.indexOf('-', k)
    let len
    if (e === -1) {
      len = size - k
    } else {
      len = e - k
    }
    let subtag = extension.slice(k, k + len)
    invariant(len >= 2, 'Expected a subtag to have at least 2 characters')
    if (keyword === undefined && len != 2) {
      if (attributes.indexOf(subtag) === -1) {
        attributes.push(subtag)
      }
    } else if (len === 2) {
      keyword = {key: subtag, value: ''}
      if (keywords.find(k => k.key === keyword?.key) === undefined) {
        keywords.push(keyword)
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
