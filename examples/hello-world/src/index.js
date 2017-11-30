import React from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider} from '../../../lib/index.js';
import App from './App';

ReactDOM.render(
    <IntlProvider locale="en" textComponent={null}>
        <App />
    </IntlProvider>,
    document.getElementById('root')
);
