import type {JSX} from 'react'
import {IntlProvider, FormattedMessage, useIntl} from 'react-intl'

// Swedish messages with locally type-safe keys
const messages = {
  title: 'Hej FormatJS',
  content: 'Börja redigera för att se lite magi hända!',
  body: 'Din språkinställning ({locale}) är nu typsäker',
  welcome: 'Välkommen {name}',
  itemCount:
    'Du har {count, plural, =0 {inga objekt} =1 {ett objekt} other {# objekt}}',
  currentTime: 'Nuvarande tid: {time, time}',
  description:
    'Detta är ett exempel på typsäker internationalisering med svenska språket',
} as const

type SwedishLocale = 'sv-SE' | 'sv' | 'en'

const SvenskKomponent = (): JSX.Element => {
  const {locale} = useIntl()
  const typedLocale = locale as SwedishLocale

  return (
    <div>
      <p>
        <FormattedMessage id="body" values={{locale: typedLocale}} />
      </p>
      <p>
        <FormattedMessage id="welcome" values={{name: 'Anna'}} />
      </p>
      <p>
        <FormattedMessage id="itemCount" values={{count: 5}} />
      </p>
      <p>
        <FormattedMessage id="currentTime" values={{time: new Date()}} />
      </p>
    </div>
  )
}

export default function SvensktStriktExample(): JSX.Element {
  return (
    <IntlProvider locale="sv-SE" messages={messages}>
      <div style={{fontFamily: 'system-ui', padding: '20px'}}>
        <h1>
          <FormattedMessage id="title" />
        </h1>
        <h2>
          <FormattedMessage id="content" />
        </h2>
        <p>
          <FormattedMessage id="description" />
        </p>
        <SvenskKomponent />
      </div>
    </IntlProvider>
  )
}
