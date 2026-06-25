import * as React from 'react'
import {
  FormattedDate,
  FormattedMessage,
  IntlProvider,
  createIntl,
  createIntlCache,
  defineMessage,
  useIntl,
} from 'react-intl'
import {createIntl as createServerIntl} from 'react-intl/server'

const messages = {
  title: 'Hello React 18',
  today: 'Today is {value, date, ::yyyyMMdd}',
}

declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: keyof typeof messages
    }
  }
}

function Child() {
  const intl = useIntl()
  const message = defineMessage({id: 'title', defaultMessage: 'Hello'})
  return <p>{intl.formatMessage(message)}</p>
}

function App() {
  const intl = createIntl({locale: 'en', messages}, createIntlCache())
  createServerIntl({locale: 'en', messages}, createIntlCache())

  return (
    <IntlProvider locale="en" messages={messages}>
      <h1>
        <FormattedMessage id="title" />
      </h1>
      <FormattedDate value={new Date()} />
      <p>{intl.formatMessage({id: 'today'}, {value: new Date()})}</p>
      <Child />
    </IntlProvider>
  )
}

;<App />
