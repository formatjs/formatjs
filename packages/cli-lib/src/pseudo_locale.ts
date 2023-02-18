import {
  parse,
  MessageFormatElement,
  TYPE,
  isLiteralElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  LiteralElement,
} from '@formatjs/icu-messageformat-parser'

function forEachLiteralElement(
  ast: MessageFormatElement[],
  fn: (el: LiteralElement) => void
): void {
  ast.forEach(el => {
    if (isLiteralElement(el)) {
      fn(el)
    } else if (isPluralElement(el) || isSelectElement(el)) {
      for (const opt of Object.values(el.options)) {
        forEachLiteralElement(opt.value, fn)
      }
    } else if (isTagElement(el)) {
      forEachLiteralElement(el.children, fn)
    }
  })
}

export function generateXXLS(
  msg: string | MessageFormatElement[]
): MessageFormatElement[] {
  const ast = typeof msg === 'string' ? parse(msg) : msg
  const lastChunk = ast[ast.length - 1]
  if (lastChunk && isLiteralElement(lastChunk)) {
    lastChunk.value += 'SSSSSSSSSSSSSSSSSSSSSSSSS'
    return ast
  }
  return [...ast, {type: TYPE.literal, value: 'SSSSSSSSSSSSSSSSSSSSSSSSS'}]
}

export function generateXXAC(
  msg: string | MessageFormatElement[]
): MessageFormatElement[] {
  const ast = typeof msg === 'string' ? parse(msg) : msg
  forEachLiteralElement(ast, el => {
    el.value = el.value.toUpperCase()
  })
  return ast
}

export function generateXXHA(
  msg: string | MessageFormatElement[]
): MessageFormatElement[] {
  const ast = typeof msg === 'string' ? parse(msg) : msg
  const [firstChunk, ...rest] = ast
  if (firstChunk && isLiteralElement(firstChunk)) {
    firstChunk.value = '[javascript]' + firstChunk.value
    return [firstChunk, ...rest]
  }
  return [{type: TYPE.literal, value: '[javascript]'}, ...ast]
}

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>

type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never

type PseudoLocaleTransformMap = {
  caps: Tuple<number, 26>
  small: Tuple<number, 26>
}

const ACCENTED_MAP: PseudoLocaleTransformMap = {
  // ȦƁƇḒḖƑƓĦĪĴĶĿḾȠǾƤɊŘŞŦŬṼẆẊẎẐ
  // prettier-ignore
  "caps": [550, 385, 391, 7698, 7702, 401, 403, 294, 298, 308, 310, 319, 7742, 544, 510, 420, 586, 344, 350, 358, 364, 7804, 7814, 7818, 7822, 7824],
  // ȧƀƈḓḗƒɠħīĵķŀḿƞǿƥɋřşŧŭṽẇẋẏẑ
  // prettier-ignore
  "small": [551, 384, 392, 7699, 7703, 402, 608, 295, 299, 309, 311, 320, 7743, 414, 511, 421, 587, 345, 351, 359, 365, 7805, 7815, 7819, 7823, 7825],
}

const FLIPPED_MAP: PseudoLocaleTransformMap = {
  // ∀ԐↃᗡƎℲ⅁HIſӼ⅂WNOԀÒᴚS⊥∩ɅMX⅄Z
  // prettier-ignore
  "caps": [8704, 1296, 8579, 5601, 398, 8498, 8513, 72, 73, 383, 1276, 8514, 87, 78, 79, 1280, 210, 7450, 83, 8869, 8745, 581, 77, 88, 8516, 90],
  // ɐqɔpǝɟƃɥıɾʞʅɯuodbɹsʇnʌʍxʎz
  // prettier-ignore
  "small": [592, 113, 596, 112, 477, 607, 387, 613, 305, 638, 670, 645, 623, 117, 111, 100, 98, 633, 115, 647, 110, 652, 653, 120, 654, 122],
}

/**
 * Based on: https://hg.mozilla.org/mozilla-central/file/a1f74e8c8fb72390d22054d6b00c28b1a32f6c43/intl/l10n/L10nRegistry.jsm#l425
 */
function transformString(
  map: PseudoLocaleTransformMap,
  elongate = false,
  msg: string
) {
  return msg.replace(/[a-z]/gi, ch => {
    const cc = ch.charCodeAt(0)
    if (cc >= 97 && cc <= 122) {
      const newChar = String.fromCodePoint(map.small[cc - 97])
      // duplicate "a", "e", "o" and "u" to emulate ~30% longer text
      if (elongate && (cc === 97 || cc === 101 || cc === 111 || cc === 117)) {
        return newChar + newChar
      }
      return newChar
    }
    if (cc >= 65 && cc <= 90) {
      return String.fromCodePoint(map.caps[cc - 65])
    }
    return ch
  })
}

/**
 * accented - Ȧȧƈƈḗḗƞŧḗḗḓ Ḗḗƞɠŀīīşħ
 * --------------------------------
 *
 * This locale replaces all Latin characters with their accented equivalents, and duplicates some
 * vowels to create roughly 30% longer strings. Strings are wrapped in markers (square brackets),
 * which help with detecting truncation.
 */
export function generateENXA(
  msg: string | MessageFormatElement[]
): MessageFormatElement[] {
  const ast = typeof msg === 'string' ? parse(msg) : msg
  forEachLiteralElement(ast, el => {
    el.value = transformString(ACCENTED_MAP, true, el.value)
  })
  return [
    {type: TYPE.literal, value: '['},
    ...ast,
    {type: TYPE.literal, value: ']'},
  ]
}

/**
 * bidi - ɥsıʅƃuƎ ıpıԐ
 * -------------------
 *
 * This strategy replaces all Latin characters with their 180 degree rotated versions and enforces
 * right to left text flow using Unicode UAX#9 Explicit Directional Embeddings. In this mode, the UI
 * directionality will also be set to right-to-left.
 */
export function generateENXB(
  msg: string | MessageFormatElement[]
): MessageFormatElement[] {
  const ast = typeof msg === 'string' ? parse(msg) : msg
  forEachLiteralElement(ast, el => {
    el.value = transformString(FLIPPED_MAP, false, el.value)
  })
  return [
    {type: TYPE.literal, value: '\u202e'},
    ...ast,
    {type: TYPE.literal, value: '\u202c'},
  ]
}
