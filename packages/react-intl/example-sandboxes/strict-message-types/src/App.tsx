import * as React from 'react'
import './styles.css'
import {IntlProvider, FormattedMessage} from 'react-intl'

const messages = {
  title: 'Hello CodeSandbox',
  content: 'Start editing to see some magic happen!',
}

declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: keyof typeof messages
    }
  }
}

export default function App() {
  return (
    <IntlProvider locale="en" messages={messages}>
      <div className="App">
        <h1>
          <FormattedMessage id="title" />
        </h1>
        <h2>
          <FormattedMessage id="content" />
        </h2>
      </div>
    </IntlProvider>
  )
}
