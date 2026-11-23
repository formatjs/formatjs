const apply = Reflect.apply
const substring = String.prototype.substring
const indexOf = String.prototype.indexOf
const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty)

function isVariableCharacter(code: number): boolean {
  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a) ||
    code === 0x5f
  )
}

// ECMA-402 §19.1.1 initializes Segmenter without changing RegExp match state.
// https://tc39.es/ecma402/#sec-intl.segmenter
export const replaceVariables = (
  variables: Record<string, string>,
  input: string
): string => {
  let result = ''
  let end = 0
  let start = apply(indexOf, input, ['$']) as number
  while (start !== -1) {
    let cursor = start + 1
    while (isVariableCharacter(charCodeAt(input, cursor))) cursor++
    if (cursor === start + 1) {
      start = apply(indexOf, input, ['$', cursor]) as number
      continue
    }
    const name = apply(substring, input, [start, cursor]) as string
    if (!hasOwn(variables, name)) {
      throw new Error(`No such variable ${name}`)
    }
    result += apply(substring, input, [end, start]) + variables[name]
    end = cursor
    start = apply(indexOf, input, ['$', cursor]) as number
  }
  return result + apply(substring, input, [end])
}

const charCodeAt = Function.prototype.call.bind(
  String.prototype.charCodeAt
) as (input: string, position: number) => number

export const isSurrogate = (str: string, pos: number): boolean => {
  const lead = charCodeAt(str, pos - 1)
  const trail = charCodeAt(str, pos)
  return 0xd800 <= lead && lead <= 0xdbff && 0xdc00 <= trail && trail <= 0xdfff
}

// alternative surrogate check mimicking the java implementation
// const TRAIL_SURROGATE_BITMASK = 0xfffffc00
// const TRAIL_SURROGATE_BITS = 0xdc00
// const LEAD_SURROGATE_BITMASK = 0xfffffc00
// const LEAD_SURROGATE_BITS = 0xd800
// const isSurrogate = (text: string, position: number) => {
//   if (
//     (text.charCodeAt(position - 1) & LEAD_SURROGATE_BITMASK) ==
//       LEAD_SURROGATE_BITS &&
//     (text.charCodeAt(position) & TRAIL_SURROGATE_BITMASK) ==
//       TRAIL_SURROGATE_BITS
//   ) {
//     return true
//   } else {
//     return false
//   }
// }
