export const replaceVariables = (
  variables: Record<string, string>,
  input: string
) => {
  const findVarRegex = /\$[A-Za-z0-9_]+/gm
  return input.replaceAll(findVarRegex, match => {
    if (!(match in variables)) {
      throw new Error(`No such variable ${match}`)
    }
    return variables[match]
  })
}

export const isSurrogate = (str: string, pos: number) => {
  return (
    0xd800 <= str.charCodeAt(pos - 1) &&
    str.charCodeAt(pos - 1) <= 0xdbff &&
    0xdc00 <= str.charCodeAt(pos) &&
    str.charCodeAt(pos) <= 0xdfff
  )
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
