import React from 'react';
import getDisplayName from 'react-display-name';
import createContext from 'create-react-context';

const IntlContext = createContext(null);
const {
  Consumer: IntlConsumer,
  Provider: IntlProvider
} = IntlContext

export const Provider = IntlProvider

export default function withIntlContext(Component) {
  const componentWithIntl = function (props) {
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

  componentWithIntl.displayName = `withIntl(${getDisplayName(Component)})`

  return componentWithIntl
}
