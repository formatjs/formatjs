import React from 'react';
import ReactDOM from 'react-dom';
import {addLocaleData, IntlProvider} from 'react-intl';
import enLocaleData from 'react-intl/locale-data/en';
import App from './components/app';

addLocaleData(enLocaleData);

const {locale, messages} = window.App;

ReactDOM.render(
    <IntlProvider
        locale={locale}
        messages={messages.app}
    >
        <App getIntlMessages={(namespace) => messages[namespace]} />
    </IntlProvider>,
    document.getElementById('container')
);
