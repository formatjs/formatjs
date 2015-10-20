import React from 'react';
import ReactDOM from 'react-dom';
import {addLocaleData, IntlProvider} from 'react-intl';
import enLocaleData from 'react-intl/locale-data/en';
import App from './components/app';

// This example app only uses English. A fake `"en-UPPER"` locale is created so
// translations can be emulated.
addLocaleData(enLocaleData);
addLocaleData({
    locale: 'en-UPPER',
    parentLocale: 'en',
});

const {locale, messages} = window.App;

ReactDOM.render(
    <IntlProvider locale={locale} messages={messages}>
        <App />
    </IntlProvider>,
    document.getElementById('container')
);
