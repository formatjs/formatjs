import React from 'react';
import createContext from 'create-react-context';

const IntlContext = createContext();
const {
  Consumer: IntlConsumer,
  Provider: IntlProvider
} = IntlContext

export const Provider = IntlProvider

export default function withIntlContext(Component) {
  return function (props) {
    return (
      <IntlConsumer>
        {(intl) => (
          <Component
            {...props}
            intl={intl}
          />
        )}
      </IntlConsumer>
    )
  }
}
