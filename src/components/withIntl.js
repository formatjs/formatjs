import React, {Component} from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import invariant from 'invariant';
import createContext from 'create-react-context';
import {invariantIntlContext} from '../utils';

function getDisplayName(Component) {
  return Component.displayName || Component.name || 'Component';
}

const IntlContext = createContext(null);
const {
  Consumer: IntlConsumer,
  Provider: IntlProvider
} = IntlContext

export const Provider = IntlProvider

export default function withIntl(WrappedComponent, options = {}) {
  const {
    intlPropName = 'intl',
    withRef = false,
    enforceContext = true
  } = options;

  class withIntl extends Component {
    static displayName = `withIntl(${getDisplayName(WrappedComponent)})`;
    static WrappedComponent = WrappedComponent;

    wrappedInstance = (ref) => {
      this.wrappedInstance.current = ref;
    }

    getWrappedInstance() {
      invariant(
        withRef,
        '[React Intl] To access the wrapped instance, ' +
          'the `{withRef: true}` option must be set when calling: ' +
          '`withIntl()`'
      );

      return this.wrappedInstance.current;
    }

    render () {
      return (
        <IntlConsumer>
          {(intl) => {
            if (enforceContext) {
              invariantIntlContext({ intl });
            }

            return (
              <WrappedComponent
                {...{
                  ...this.props,
                  [intlPropName]: intl
                }}
                ref={withRef ? this.wrappedInstance : null}
              />
            );
          }}
        </IntlConsumer>
      )
    }
  }

  return hoistNonReactStatics(withIntl, WrappedComponent);
}
