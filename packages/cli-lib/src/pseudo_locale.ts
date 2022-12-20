import {
  parse,
  MessageFormatElement,
  TYPE,
  isLiteralElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
} from '@formatjs/icu-messageformat-parser'

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
  ast.forEach(el => {
    if (isLiteralElement(el)) {
      el.value = el.value.toUpperCase()
    } else if (isPluralElement(el) || isSelectElement(el)) {
      for (const opt of Object.values(el.options)) {
        generateXXAC(opt.value)
      }
    } else if (isTagElement(el)) {
      generateXXAC(el.children)
    }
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

const ASCII = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const ACCENTED_ASCII = 'âḃćḋèḟĝḫíĵǩĺṁńŏṗɋŕśṭůṿẘẋẏẓḀḂḈḊḔḞḠḢḬĴḴĻḾŊÕṔɊŔṠṮŨṼẄẌŸƵ'

export function generateENXA(
  msg: string | MessageFormatElement[]
): MessageFormatElement[] {
  const ast = typeof msg === 'string' ? parse(msg) : msg
  ast.forEach(el => {
    if (isLiteralElement(el)) {
      el.value = el.value
        .split('')
        .map(c => {
          const i = ASCII.indexOf(c)
          if (i < 0) {
            return c
          }
          return ACCENTED_ASCII[i]
        })
        .join('')
    } else if (isPluralElement(el) || isSelectElement(el)) {
      for (const opt of Object.values(el.options)) {
        generateENXA(opt.value)
      }
    } else if (isTagElement(el)) {
      generateENXA(el.children)
    }
  })
  return ast
}

export function generateENXB(
  msg: string | MessageFormatElement[]
): MessageFormatElement[] {
  const ast = typeof msg === 'string' ? parse(msg) : msg
  ast.forEach(el => {
    if (isLiteralElement(el)) {
      const pseudoString = el.value
        .split('')
        .map((c, index) => {
          const i = ASCII.indexOf(c)
          const canPad = (index + 1) % 3 === 0

          if (i < 0) {
            return c
          }

          return canPad ? ACCENTED_ASCII[i].repeat(3) : ACCENTED_ASCII[i]
        })
        .join('')

      el.value = `[!! ${pseudoString} !!]`
    } else if (isPluralElement(el) || isSelectElement(el)) {
      for (const opt of Object.values(el.options)) {
        generateENXB(opt.value)
      }
    } else if (isTagElement(el)) {
      generateENXB(el.children)
    }
  })
  return ast
}
