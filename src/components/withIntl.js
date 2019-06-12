import React, {createContext} from 'react';
import {isValidElementType} from 'react-is';
import hoistNonReactStatics from 'hoist-non-react-statics';
import invariant from 'invariant';
import {invariantIntlContext} from '../utils';

function getDisplayName(Component) {
  return Component.displayName || Component.name || 'Component';
}

const IntlContext = createContext(null);
const {Consumer: IntlConsumer, Provider: IntlProvider} = IntlContext;

export const Provider = IntlProvider;
export const Context = IntlContext;

export default function withIntl(componentOrOptions, options) {
  if (isValidElementType(componentOrOptions)) {
    // use call to make `options` available on `this`
    return createWrapper.call({options}, componentOrOptions);
  }
  // return a function with `options` bound to `this`
  return createWrapper.bind({options: componentOrOptions});
}

function createWrapper(WrappedComponent) {
  let options = (this && this.options) || {};
  const {
    intlPropName = 'intl',
    forwardRef = false,
    // DEPRECATED - use forwardRef and ref on injected component
    withRef = false,
    enforceContext = true,
  } = options;

  invariant(
    !withRef,
    '[React Intl] withRef and getWrappedInstance() are deprecated, ' +
      "instead use the 'forwardRef' option and create a ref directly on the wrapped component."
  );

  function WithIntl(props) {
    return (
      <IntlConsumer>
        {intl => {
          if (enforceContext) {
            invariantIntlContext({intl});
          }

          return (
            <WrappedComponent
              {...{
                ...props,
                [intlPropName]: intl,
              }}
              ref={forwardRef ? props.forwardedRef : null}
            />
          );
        }}
      </IntlConsumer>
    );
  }

  WithIntl.displayName = `withIntl(${getDisplayName(WrappedComponent)})`;
  WithIntl.WrappedComponent = WrappedComponent;

  if (forwardRef) {
    return hoistNonReactStatics(
      React.forwardRef((props, ref) => (
        <WithIntl {...props} forwardedRef={ref} />
      )),
      WrappedComponent
    );
  }

  return hoistNonReactStatics(WithIntl, WrappedComponent);
}
