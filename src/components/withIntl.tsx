import * as React from 'react';
import * as invariant_ from 'invariant';
// Since rollup cannot deal with namespace being a function,
// this is to interop with TypeScript since `invariant`
// does not export a default
// https://github.com/rollup/rollup/issues/1267
const invariant = invariant_;
import * as hoistNonReactStatics_ from 'hoist-non-react-statics';
// Since rollup cannot deal with namespace being a function,
// this is to interop with TypeScript since `invariant`
// does not export a default
// https://github.com/rollup/rollup/issues/1267
const hoistNonReactStatics = hoistNonReactStatics_;
import {invariantIntlContext} from '../utils';
import {IntlShape} from '../types';

function getDisplayName(Component: React.ComponentType<any>) {
  return Component.displayName || Component.name || 'Component';
}

// TODO: We should provide initial value here
const IntlContext = React.createContext<IntlShape>(null as any);
const {Consumer: IntlConsumer, Provider: IntlProvider} = IntlContext;

export const Provider = IntlProvider;
export const Context = IntlContext;

export interface Opts {
  intlPropName?: string;
  forwardRef?: boolean;
  withRef?: boolean;
  enforceContext?: boolean;
}

export interface WrappedComponentProps {
  intl?: IntlShape;
}

type WithIntlProps<P> = Omit<P, keyof WrappedComponentProps> & {
  forwardedRef?: React.Ref<any>;
};

export default function withIntl<P extends WrappedComponentProps>(
  WrappedComponent: React.ComponentType<P>,
  options?: Opts
): React.ComponentType<WithIntlProps<P>> & {
  WrappedComponent: typeof WrappedComponent;
} {
  const {
    intlPropName = 'intl',
    forwardRef = false,
    // DEPRECATED - use forwardRef and ref on injected component
    withRef = false,
    enforceContext = true,
  } = options || {};

  invariant(
    !withRef,
    '[React Intl] withRef and getWrappedInstance() are deprecated, ' +
      "instead use the 'forwardRef' option and create a ref directly on the wrapped component."
  );

  const WithIntl: React.FC<P & {forwardedRef?: React.Ref<any>}> & {
    WrappedComponent: typeof WrappedComponent;
  } = props => {
    return (
      <IntlConsumer>
        {intl => {
          if (enforceContext) {
            invariantIntlContext({intl});
          }

          return (
            <WrappedComponent
              {...props}
              {...{
                [intlPropName]: intl,
              }}
              ref={forwardRef ? props.forwardedRef : null}
            />
          );
        }}
      </IntlConsumer>
    );
  };

  WithIntl.displayName = `withIntl(${getDisplayName(WrappedComponent)})`;
  WithIntl.WrappedComponent = WrappedComponent;

  if (forwardRef) {
    return hoistNonReactStatics(
      React.forwardRef((props: P, ref) => (
        <WithIntl {...props} forwardedRef={ref} />
      )),
      WrappedComponent
    ) as any;
  }

  return hoistNonReactStatics(WithIntl, WrappedComponent) as any;
}
