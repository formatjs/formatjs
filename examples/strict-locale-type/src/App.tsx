import * as React from 'react'
import './styles.css'
import {IntlProvider, FormattedMessage, useIntl} from 'react-intl'

const messages = {
  title: 'Hello CodeSandbox',
  content: 'Start editing to see some magic happen!',
  body: 'Your locale ({locale}) is now type safe',
}

declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: keyof typeof messages
    }
    interface IntlConfig {
      locale: 'en' | 'fr'
    }
  }
}

const Component = () => {
  // Here locale is type safe
  const {locale} = useIntl()

  return (
    <p>
      <FormattedMessage id="body" values={{locale}}></FormattedMessage>
    </p>
  )
}

export default function App() {
  return (
    // Here locale is type safe
    <IntlProvider locale="en" messages={messages}>
      <div className="App">
        <h1>
          <FormattedMessage id="title" />
        </h1>
        <h2>
          <FormattedMessage id="content" />
        </h2>
        <Component />
      </div>
    </IntlProvider>
  )
}
