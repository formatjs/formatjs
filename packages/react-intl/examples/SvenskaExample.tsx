import type {JSX} from 'react'
import {
  IntlProvider,
  FormattedMessage,
  FormattedDate,
  FormattedNumber,
  FormattedPlural,
} from 'react-intl'

// Swedish messages with proper plural forms and culturally appropriate content
const svenskaMessages = {
  welcome: 'Välkommen till FormatJS',
  greeting: 'Hej {name}!',
  photoCount:
    'Du har {count, plural, =0 {inga foton} =1 {ett foto} other {# foton}} i ditt album',
  currentDate: 'Idag är det {date, date, long}',
  price: 'Pris: {amount, number, ::currency/SEK}',
  temperature: 'Temperaturen är {temp, number}°C',
  lastLogin: 'Senast inloggad: {time, date, short} kl. {time, time, short}',
  userCount:
    'Vi har {users, plural, =0 {inga användare} =1 {en användare} other {# användare}} registrerade',
  ordinalExample:
    'Du kom på {place, selectordinal, one {#:a} two {#:a} =3 {#:e} other {#:e}} plats',
  genderMessage:
    '{name} är {gender, select, male {en kille} female {en tjej} other {en person}} från {city}',
  weekday:
    'Det är {day, select, monday {måndag} tuesday {tisdag} wednesday {onsdag} thursday {torsdag} friday {fredag} saturday {lördag} sunday {söndag} other {en okänd dag}}',
} as const

// Component demonstrating Swedish formatting
const SvensktInnehåll = (): JSX.Element => {
  const now = new Date()

  return (
    <div style={{fontFamily: 'system-ui', padding: '20px', maxWidth: '600px'}}>
      <h1>
        <FormattedMessage id="welcome" />
      </h1>

      <p>
        <FormattedMessage id="greeting" values={{name: 'Anna'}} />
      </p>

      <p>
        <FormattedMessage id="photoCount" values={{count: 42}} />
      </p>

      <p>
        <FormattedMessage id="currentDate" values={{date: now}} />
      </p>

      <p>
        <FormattedMessage id="price" values={{amount: 299.5}} />
      </p>

      <p>
        <FormattedMessage id="temperature" values={{temp: -5}} />
      </p>

      <p>
        <FormattedMessage
          id="lastLogin"
          values={{time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)}}
        />
      </p>

      <p>
        <FormattedMessage id="userCount" values={{users: 1337}} />
      </p>

      <p>
        <FormattedMessage id="ordinalExample" values={{place: 3}} />
      </p>

      <p>
        <FormattedMessage
          id="genderMessage"
          values={{
            name: 'Erik',
            gender: 'male',
            city: 'Stockholm',
          }}
        />
      </p>

      <p>
        <FormattedMessage
          id="weekday"
          values={{
            day: [
              'sunday',
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday',
            ][now.getDay()],
          }}
        />
      </p>

      <hr style={{margin: '20px 0'}} />

      <h3>Direkta formatters</h3>

      <p>
        <FormattedMessage
          id="formattedDateLabel"
          defaultMessage="Datum: <formattedDate></formattedDate>"
          values={{
            formattedDate: () => (
              <FormattedDate value={now} year="numeric" month="long" day="numeric" />
            ),
          }}
        />
      </p>
      <p>
        <FormattedMessage
          id="formattedTimeLabel"
          defaultMessage="Tid: <formattedTime></formattedTime>"
          values={{
            formattedTime: () => (
              <FormattedDate
                value={now}
                hour="numeric"
                minute="numeric"
                second="numeric"
              />
            ),
          }}
        />
      </p>
      <p>Nummer: <FormattedNumber value={1234567.89} /></p>
      <p>
        Valuta: <FormattedNumber value={1999.99} style="currency" currency="SEK" />
      </p>
      <p>Procent: <FormattedNumber value={0.159} style="percent" /></p>

      <h3>Pluralformen</h3>
      {[0, 1, 2, 5].map(count => (
        <p key={count}>
          <FormattedPlural value={count} one="# hund" other="# hundar" /> (count:{' '}
          {count})
        </p>
      ))}
    </div>
  )
}

export default function SvenskaExample(): JSX.Element {
  return (
    <IntlProvider locale="sv-SE" messages={svenskaMessages} timeZone="Europe/Stockholm">
      <SvensktInnehåll />
    </IntlProvider>
  )
}
