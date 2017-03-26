import React from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';
import App from './App';

ReactDOM.render(<div>
    Timezone Explicitly set to Asia/Tokyo:
    &nbsp;
    <IntlProvider locale="en" timeZone="Asia/Tokyo">
        <App currentTime={new Date()} />
    </IntlProvider>
    <br />
    Timezone Explicitly set to UTC:
    &nbsp;
    <IntlProvider locale="en" timeZone="UTC">
        <App currentTime={new Date()} />
    </IntlProvider>
    <br />
    Timezone NOT Explicitly Set:
    &nbsp;
    <IntlProvider locale="en">
        <App currentTime={new Date()} />
    </IntlProvider>
</div>,
document.getElementById('root')
);
