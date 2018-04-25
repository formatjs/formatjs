import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { addLocaleData } from 'react-intl';

import en from 'react-intl/locale-data/en';
import ar from 'react-intl/locale-data/ar';
import fr from 'react-intl/locale-data/fr';

import IntlProvider from './components/intlProvider';
import App from './components/app';
import reducers from './reducers';

addLocaleData([...en, ...ar, ...fr]);

const createStoreWithMiddleware = applyMiddleware()(createStore);

ReactDOM.render(
  <Provider store={createStoreWithMiddleware(reducers)}>
    <IntlProvider>
      <App />
    </IntlProvider>
  </Provider>
  , document.getElementById('root'));
