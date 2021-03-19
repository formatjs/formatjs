import 'core-js/stable'
import '@formatjs/intl-pluralrules/polyfill'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Timezone from './TimeZone'
import Messages from './Messages'
import Hooks from './Hooks'
import {bootstrapApplication} from './advanced/Advanced'
import Injected from './Injected'
import HandleChange from './HandleChange'
import StaticTypeSafetyAndCodeSplitting from './StaticTypeSafetyAndCodeSplitting/StaticTypeSafetyAndCodeSplitting'
import {App as Bug2727} from './Bug2727'
//polyfills
import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'

import '@formatjs/intl-pluralrules/polyfill'
import '@formatjs/intl-pluralrules/locale-data/en' // locale-data for en

import '@formatjs/intl-numberformat/polyfill'
import '@formatjs/intl-numberformat/locale-data/en' // locale-data for en

import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/locale-data/en' // locale-data for en
import '@formatjs/intl-datetimeformat/add-all-tz' // Add ALL tz data

ReactDOM.render(<Timezone />, document.getElementById('timezone'))

ReactDOM.render(<Messages />, document.getElementById('messages'))
ReactDOM.render(<Hooks />, document.getElementById('hooks'))

ReactDOM.render(<Injected />, document.getElementById('injected'))
ReactDOM.render(<HandleChange />, document.getElementById('handlechange'))

ReactDOM.render(
  <StaticTypeSafetyAndCodeSplitting />,
  document.getElementById('static-type-safety-and-code-splitting')
)

ReactDOM.render(<Bug2727 />, document.getElementById('bug2727'))

bootstrapApplication('en').then(app => {
  ReactDOM.render(app, document.getElementById('advanced'))
})
