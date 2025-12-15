import * as React from 'react'
import {useState} from 'react'
import {IntlProvider, FormattedRelativeTime, useIntl} from 'react-intl'

const getRelativeTime = (date: Date) =>
  (date.getTime() - new Date().getTime()) / 1000

const PostDate: React.FC<{date: Date}> = ({date}) => {
  const intl = useIntl()
  return (
    <span title={intl.formatDate(date)}>
      <FormattedRelativeTime
        value={getRelativeTime(date)}
        updateIntervalInSeconds={1}
      />
    </span>
  )
}

export const App: React.FC<{}> = () => {
  const [hide, setHide] = useState(false)
  return (
    <IntlProvider locale={navigator.language}>
      <div>
        <h1>Hello world</h1>
        {!hide && (
          <p>
            <PostDate date={new Date()} />
          </p>
        )}

        <button onClick={() => setHide(current => !current)}>
          Toggle FormattedRelativeTime
        </button>
      </div>
    </IntlProvider>
  )
}
