import * as React from 'react'
import {IntlProvider, useIntl} from 'react-intl'

const Comp: React.FC<{}> = _ => {
  const {formatDate} = useIntl()
  return <h1>{formatDate(Date.now())}</h1>
}

const Comp2: React.FC = () => {
  const {formatDate, formatTime} = useIntl()
  return (
    <>
      <h1>{formatDate(new Date(), {month: 'long'})}</h1>
      <h2>{formatTime(undefined)}</h2>
    </>
  )
}

const App: React.FC = () => {
  return (
    <IntlProvider locale="en" timeZone="Asia/Tokyo">
      <div>
        <Comp />
        <Comp2 />
      </div>
    </IntlProvider>
  )
}

export default App
