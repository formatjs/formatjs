import {Collator} from '#packages/intl-collator/index.js'

if (typeof Intl === 'undefined') {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'Intl', {
      value: {},
    })
    // @ts-ignore we don't include @types/node so global isn't a thing
  } else if (typeof global !== 'undefined') {
    // @ts-ignore we don't include @types/node so global isn't a thing
    Object.defineProperty(global, 'Intl', {
      value: {},
    })
  }
}

Object.defineProperty(Intl, 'Collator', {
  value: Collator,
})
