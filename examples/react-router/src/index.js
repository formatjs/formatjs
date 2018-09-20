import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';

import App from './components/App';

ReactDOM.render(
    <IntlProvider locale="en">
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </IntlProvider>,
    document.getElementById('root')
);
