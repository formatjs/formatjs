import React from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';
import App from './App';

ReactDOM.render(
    <IntlProvider locale="en" timeZone="Asia/Tokyo">
        <App currentTime={new Date()} />
    </IntlProvider>,
    document.getElementById('root')
);
