import React from 'react';
import {Provider as IntlProvider} from './provider.js';

export default function withIntlContext(Component) {
  return function WithIntlContext(props) {
    return (
      <IntlProvider>
        {(intl) => (
          <Component
            {...props}
            intl={intl}
          />
        )}
      </IntlProvider>
    )
  }
}
