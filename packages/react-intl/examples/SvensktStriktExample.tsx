import type {JSX} from 'react'
import {IntlProvider, FormattedMessage, useIntl} from 'react-intl'

type SwedishLocale = 'sv-SE' | 'sv' | 'en'

const SvenskKomponent = (): JSX.Element => {
  const {locale} = useIntl()
  const typedLocale = locale as SwedishLocale

  return (
    <div>
      <p>
        <FormattedMessage
          id="body"
          defaultMessage="Din språkinställning ({locale}) är nu typsäker"
          values={{locale: typedLocale}}
        />
      </p>
      <p>
        <FormattedMessage
          id="welcome"
          defaultMessage="Välkommen {name}"
          values={{name: 'Anna'}}
        />
      </p>
      <p>
        <FormattedMessage
          id="itemCount"
          defaultMessage="Du har {count, plural, =0 {inga objekt} =1 {ett objekt} other {# objekt}}"
          values={{count: 5}}
        />
      </p>
      <p>
        <FormattedMessage
          id="currentTime"
          defaultMessage="Nuvarande tid: {time, time}"
          values={{time: new Date()}}
        />
      </p>
    </div>
  )
}

export default function SvensktStriktExample(): JSX.Element {
  return (
    <IntlProvider locale="sv-SE">
      <div style={{fontFamily: 'system-ui', padding: '20px'}}>
        <h1>
          <FormattedMessage id="title" defaultMessage="Hej FormatJS" />
        </h1>
        <h2>
          <FormattedMessage
            id="content"
            defaultMessage="Börja redigera för att se lite magi hända!"
          />
        </h2>
        <p>
          <FormattedMessage
            id="description"
            defaultMessage="Detta är ett exempel på typsäker internationalisering med svenska språket"
          />
        </p>
        <SvenskKomponent />
      </div>
    </IntlProvider>
  )
}
