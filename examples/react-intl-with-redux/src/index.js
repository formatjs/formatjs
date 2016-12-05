import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { addLocaleData } from 'react-intl';
import { createStore, applyMiddleware } from 'redux';
import en from 'react-intl/locale-data/en';
import es from 'react-intl/locale-data/es';
import fr from 'react-intl/locale-data/fr';

import './index.css';
import App from './App';
import reducers from './reducers';
import ReduxConnectedIntlProvider from './reduxConnectedIntlProvider';

const createStoreWithMiddleware = applyMiddleware()(createStore);

addLocaleData([...es, ...en, ...fr]);

ReactDOM.render(
  <Provider store={createStoreWithMiddleware(reducers)}>
    <ReduxConnectedIntlProvider>
      <App />
    </ReduxConnectedIntlProvider>
  </Provider>,
    document.getElementById('root')
);
