import type {JSX} from 'react'
import {IntlProvider, FormattedMessage} from 'react-intl'

const SvensktInnehåll = (): JSX.Element => {
  const now = new Date()

  return (
    <div style={{fontFamily: 'system-ui', padding: '20px', maxWidth: '600px'}}>
      <h1>
        <FormattedMessage
          id="welcome"
          defaultMessage="Välkommen till FormatJS"
        />
      </h1>

      <p>
        <FormattedMessage
          id="greeting"
          defaultMessage="Hej {name}!"
          values={{name: 'Anna'}}
        />
      </p>

      <p>
        <FormattedMessage
          id="photoCount"
          defaultMessage="Du har {count, plural, =0 {inga foton} =1 {ett foto} other {# foton}} i ditt album"
          values={{count: 42}}
        />
      </p>

      <p>
        <FormattedMessage
          id="currentDate"
          defaultMessage="Idag är det {date, date, long}"
          values={{date: now}}
        />
      </p>

      <p>
        <FormattedMessage
          id="price"
          defaultMessage="Pris: {amount, number, ::currency/SEK}"
          values={{amount: 299.5}}
        />
      </p>

      <p>
        <FormattedMessage
          id="temperature"
          defaultMessage="Temperaturen är {temp, number}°C"
          values={{temp: -5}}
        />
      </p>

      <p>
        <FormattedMessage
          id="lastLogin"
          defaultMessage="Senast inloggad: {time, date, short} kl. {time, time, short}"
          values={{time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)}}
        />
      </p>

      <p>
        <FormattedMessage
          id="userCount"
          defaultMessage="Vi har {users, plural, =0 {inga användare} =1 {en användare} other {# användare}} registrerade"
          values={{users: 1337}}
        />
      </p>

      <p>
        <FormattedMessage
          id="ordinalExample"
          defaultMessage="Du kom på {place, selectordinal, one {#:a} two {#:a} =3 {#:e} other {#:e}} plats"
          values={{place: 3}}
        />
      </p>

      <p>
        <FormattedMessage
          id="genderMessage"
          defaultMessage="{name} är {gender, select, male {en kille} female {en tjej} other {en person}} från {city}"
          values={{
            name: 'Erik',
            gender: 'male',
            city: 'Stockholm',
          }}
        />
      </p>

      <p>
        <FormattedMessage
          id="weekdayExample"
          defaultMessage="Veckodag: {today, date, ::EEEE}"
          values={{today: now}}
        />
      </p>

      <hr style={{margin: '20px 0'}} />

      <h3>
        <FormattedMessage
          id="directFormattersHeading"
          defaultMessage="Direkta formatterare"
        />
      </h3>

      <p>
        <FormattedMessage
          id="formattedDateLabel"
          defaultMessage="Datum: <formattedDate>{now, date, ::yMMMMd}</formattedDate>"
          values={{
            now,
            formattedDate: chunks => <strong>{chunks}</strong>,
          }}
        />
      </p>
      <p>
        <FormattedMessage
          id="formattedTimeLabel"
          defaultMessage="Tid: <formattedTime>{now, time, ::Hms}</formattedTime>"
          values={{
            now,
            formattedTime: chunks => <strong>{chunks}</strong>,
          }}
        />
      </p>
      <p>
        <FormattedMessage
          id="formattedNumberLabel"
          defaultMessage="Nummer: <formattedNumber>{value, number}</formattedNumber>"
          values={{
            value: 1234567.89,
            formattedNumber: chunks => <strong>{chunks}</strong>,
          }}
        />
      </p>
      <p>
        <FormattedMessage
          id="formattedCurrencyLabel"
          defaultMessage="Valuta: <formattedCurrency>{value, number, ::currency/SEK}</formattedCurrency>"
          values={{
            value: 1999.99,
            formattedCurrency: chunks => <strong>{chunks}</strong>,
          }}
        />
      </p>
      <p>
        <FormattedMessage
          id="formattedPercentLabel"
          defaultMessage="Procent: <formattedPercent>{value, number, ::percent}</formattedPercent>"
          values={{
            value: 0.159,
            formattedPercent: chunks => <strong>{chunks}</strong>,
          }}
        />
      </p>

      <h3>
        <FormattedMessage
          id="pluralHeading"
          defaultMessage="Pluralformer"
        />
      </h3>
      {[0, 1, 2, 5].map(count => (
        <p key={count}>
          <FormattedMessage
            id="pluralExample"
            defaultMessage="Exempel ({count}): {count, plural, one {# hund} other {# hundar}}"
            values={{count}}
          />
        </p>
      ))}
    </div>
  )
}

export default function SvenskaExample(): JSX.Element {
  return (
    <IntlProvider locale="sv-SE" timeZone="Europe/Stockholm">
      <SvensktInnehåll />
    </IntlProvider>
  )
}
