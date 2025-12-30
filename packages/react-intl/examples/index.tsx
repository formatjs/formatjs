import '@formatjs/intl-pluralrules/polyfill.js'
import * as ReactDOM from 'react-dom/client'
import {bootstrapApplication} from './advanced/Advanced'
import {App as Bug2727} from './Bug2727'
import HandleChange from './HandleChange'
import Hooks from './Hooks'
import Injected from './Injected'
import Messages from './Messages'
import StaticTypeSafetyAndCodeSplitting from './StaticTypeSafetyAndCodeSplitting/StaticTypeSafetyAndCodeSplitting'
import Timezone from './TimeZone'
//polyfills
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'

import '@formatjs/intl-pluralrules/locale-data/en.js' // locale-data for en
import '@formatjs/intl-pluralrules/polyfill.js'

import '@formatjs/intl-numberformat/locale-data/en.js' // locale-data for en
import '@formatjs/intl-numberformat/polyfill.js'

import '@formatjs/intl-datetimeformat/add-all-tz.js' // Add ALL tz data
import '@formatjs/intl-datetimeformat/locale-data/en.js' // locale-data for en
import '@formatjs/intl-datetimeformat/polyfill.js'

ReactDOM.createRoot(document.getElementById('timezone')!).render(<Timezone />)

ReactDOM.createRoot(document.getElementById('messages')!).render(<Messages />)
ReactDOM.createRoot(document.getElementById('hooks')!).render(<Hooks />)

ReactDOM.createRoot(document.getElementById('injected')!).render(<Injected />)
ReactDOM.createRoot(document.getElementById('handlechange')!).render(
  <HandleChange />
)

ReactDOM.createRoot(
  document.getElementById('static-type-safety-and-code-splitting')!
).render(<StaticTypeSafetyAndCodeSplitting />)

ReactDOM.createRoot(document.getElementById('bug2727')!).render(<Bug2727 />)

bootstrapApplication('en').then(app => {
  ReactDOM.createRoot(document.getElementById('advanced')!).render(app)
})
