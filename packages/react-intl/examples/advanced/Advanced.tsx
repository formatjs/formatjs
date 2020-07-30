import * as React from 'react';
import {IntlProvider, FormattedMessage} from '../../';

type IntlProviderProps = React.ComponentProps<typeof IntlProvider>;

function loadLocaleData(locale: string) {
  switch (locale) {
    case 'fr':
      return import('./compiled-lang/fr.json');
    default:
      return import('./compiled-lang/en.json');
  }
}

interface Props {
  locale: IntlProviderProps['locale'];
  messages: IntlProviderProps['messages'];
}

const App: React.FC<Props> = props => {
  return (
    <IntlProvider
      locale={props.locale}
      defaultLocale="en"
      messages={props.messages}
    >
      <p>
        <span style={{fontSize: '30px'}}>AST</span>
        <br />
        <FormattedMessage id="simple" />
        <br />
        <FormattedMessage id="placeholder" values={{name: 'John'}} />
        <br />
        <FormattedMessage id="date" values={{ts: Date.now()}} />
        <br />
        <FormattedMessage id="time" values={{ts: Date.now()}} />
        <br />
        <FormattedMessage id="number" values={{num: Math.random() * 1000}} />
        <br />
        <FormattedMessage id="plural" values={{num: 1}} />
        <br />
        <FormattedMessage id="plural" values={{num: 99}} />
        <br />
        <FormattedMessage id="select" values={{gender: 'male'}} />
        <br />
        <FormattedMessage id="select" values={{gender: 'female'}} />
        <br />
        <FormattedMessage id="selectordinal" values={{order: 1}} />
        <br />
        <FormattedMessage id="selectordinal" values={{order: 2}} />
        <br />
        <FormattedMessage id="selectordinal" values={{order: 3}} />
        <br />
        <FormattedMessage id="selectordinal" values={{order: 4}} />
        <br />
        <FormattedMessage
          id="richtext"
          values={{num: 99, bold: chunks => <strong>{chunks}</strong>}}
        />
      </p>
    </IntlProvider>
  );
};

export async function bootstrapApplication(locale: string) {
  const messages = await loadLocaleData(locale);
  return <App locale={locale} messages={messages.default} />;
}
