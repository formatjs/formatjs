import * as React from 'react';
import {createIntl, createIntlCache, RawIntlProvider} from '../';

const messages: Record<string, Record<string, string>> = {
  'en-US': {selectalanguage: 'Select a language'},
  'pt-BR': {selectalanguage: 'Selecione uma linguagem'},
};

const initialLocale = 'en-US';
export const cache = createIntlCache();
/** You can use this variable in other files even after reassigning it. */
export let intl = createIntl(
  {locale: initialLocale, messages: messages[initialLocale]},
  cache
);
export let fmt = intl.formatMessage;

const App: React.FC = () => {
  // You could use redux to get the locale or get it from the url.
  const [locale, setLocale] = React.useState(initialLocale);

  const changeLanguage = (newLocale: string): void => {
    intl = createIntl(
      {locale: newLocale, messages: messages[newLocale]},
      cache
    );
    fmt = intl.formatMessage;
    document.documentElement.lang = newLocale;
    setLocale(newLocale);
  };

  return (
    <RawIntlProvider value={intl}>
      <h1>{fmt({id: 'selectalanguage'})}</h1>
      <select
        name="locale"
        defaultValue={locale}
        id="locale"
        onChange={(event): void => changeLanguage(event.target.value)}
      >
        {Object.keys(messages).map(locale => (
          <option key={locale} value={locale}>{locale}</option>
        ))}
      </select>
    </RawIntlProvider>
  );
};

export default App;
