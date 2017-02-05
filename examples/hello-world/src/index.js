import React from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider,addLocaleData} from 'react-intl';
import App from './App';
import fr from 'react-intl/locale-data/fr';
addLocaleData(fr);
ReactDOM.render(
    <IntlProvider locale="fr">
        <App />
    </IntlProvider>,
    document.getElementById('root')
);
