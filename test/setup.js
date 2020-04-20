import {configure} from 'enzyme'
import '@formatjs/intl-pluralrules/polyfill-locales'
import '@formatjs/intl-relativetimeformat/polyfill-locales'
import '@formatjs/intl-listformat/polyfill-locales'
import '@formatjs/intl-displaynames/polyfill-locales'
import * as Adapter from 'enzyme-adapter-react-16'

configure({adapter: new Adapter()})

function toBeA(received, typeNameOrObj) {
  let pass
  if (typeof typeNameOrObj === 'string') {
    pass = typeof received === typeNameOrObj
  } else {
    pass = received instanceof typeNameOrObj
  }
  if (pass) {
    return {
      message: () => `expected ${received} to have type ${typeNameOrObj}`,
      pass: true,
    }
  }
  return {
    message: () => `expected ${received} not to have type ${typeNameOrObj}`,
    pass: false,
  }
}

expect.extend({
  toBeA,
  toBeAn: toBeA,
})
