export function parse(): void {
  throw new Error(
    "You're trying to format an uncompiled message with react-intl without parser, please import from 'react-intl' instead"
  )
}
export * from '#packages/icu-messageformat-parser/types.js'
export const _Parser = undefined
export {isStructurallySame} from '#packages/icu-messageformat-parser/manipulator.js'
