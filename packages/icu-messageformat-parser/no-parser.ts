export function parse() {
  throw new Error(
    "You're trying to format an uncompiled message with react-intl without parser, please import from 'react-int' instead"
  )
}
export * from './types'
export const _Parser = undefined
