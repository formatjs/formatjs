import {defineMessage} from 'react-intl'

export const msg = defineMessage({
  id: 'foo.bar.baz',
  defaultMessage: 'Hello World!',
  description: 'The default message.',
})

// This parses as plain TypeScript but not as TSX
export const f = <T>(x: T): T => x
