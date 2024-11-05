import {defineMessage} from '@formatjs/intl'
import {doSomething} from './other.mjs' with {type: 'macro'}

export const msg = defineMessage({
  id: 'greeting',
  defaultMessage: 'Hello, {name}!',
})

export const smthnElse = doSomething()
