import React from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';
import App from './components/app';

const {locale, messages} = window.App;

ReactDOM.render(
    <IntlProvider locale={locale} messages={messages}>
        <App />
    </IntlProvider>,
    document.getElementById('container')
);
