import React from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';
import App from './App';

ReactDOM.render(
    <IntlProvider locale="en" defaultFormats={{
        time: {
            timeZone: 'Asia/Tokyo'
        }
    }}>
        <App />
    </IntlProvider>,
    document.getElementById('root')
);
