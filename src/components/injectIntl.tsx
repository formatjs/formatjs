import * as React from 'react';
import * as hoistNonReactStatics_ from 'hoist-non-react-statics';
// Since rollup cannot deal with namespace being a function,
// this is to interop with TypeScript since `invariant`
// does not export a default
// https://github.com/rollup/rollup/issues/1267
const hoistNonReactStatics: typeof hoistNonReactStatics_ =
  (hoistNonReactStatics_ as any).default || hoistNonReactStatics_;
import {invariantIntlContext} from '../utils';
import {IntlShape, Omit} from '../types';

function getDisplayName(Component: React.ComponentType<any>): string {
  return Component.displayName || Component.name || 'Component';
}

// TODO: We should provide initial value here
const IntlContext = React.createContext<IntlShape>(null as any);
const {Consumer: IntlConsumer, Provider: IntlProvider} = IntlContext;

export const Provider = IntlProvider;
export const Context = IntlContext;

export interface Opts<
  IntlPropName extends string = 'intl',
  ForwardRef extends boolean = false
> {
  intlPropName?: IntlPropName;
  forwardRef?: ForwardRef;
  enforceContext?: boolean;
}

export type WrappedComponentProps<IntlPropName extends string = 'intl'> = {
  [k in IntlPropName]: IntlShape;
};

export type WithIntlProps<P> = Omit<P, keyof WrappedComponentProps> & {
  forwardedRef?: React.Ref<any>;
};

export default function injectIntl<
  IntlPropName extends string,
  P extends WrappedComponentProps<IntlPropName> = WrappedComponentProps<any>
>(
  WrappedComponent: React.ComponentType<P>,
  options?: Opts<IntlPropName, false>
): React.FC<WithIntlProps<P>> & {
  WrappedComponent: React.ComponentType<P>;
};
export default function injectIntl<
  IntlPropName extends string = 'intl',
  P extends WrappedComponentProps<IntlPropName> = WrappedComponentProps<any>,
  T extends React.ComponentType<P> = any
>(
  WrappedComponent: React.ComponentType<P>,
  options?: Opts<IntlPropName, true>
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<WithIntlProps<P>> & React.RefAttributes<T>
> & {
  WrappedComponent: React.ComponentType<P>;
};
export default function injectIntl<
  IntlPropName extends string = 'intl',
  P extends WrappedComponentProps<IntlPropName> = WrappedComponentProps<any>,
  ForwardRef extends boolean = false,
  T extends React.ComponentType<P> = any
>(
  WrappedComponent: React.ComponentType<P>,
  options?: Opts<IntlPropName, ForwardRef>
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<WithIntlProps<P>> & React.RefAttributes<T>
> & {
  WrappedComponent: React.ComponentType<P>;
} {
  const {intlPropName = 'intl', forwardRef = false, enforceContext = true} =
    options || {};

  const WithIntl: React.FC<P & {forwardedRef?: React.Ref<any>}> & {
    WrappedComponent: React.ComponentType<P>;
  } = props => (
    <IntlConsumer>
      {(intl): React.ReactNode => {
        if (enforceContext) {
          invariantIntlContext(intl);
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
  WithIntl.displayName = `injectIntl(${getDisplayName(WrappedComponent)})`;
  WithIntl.WrappedComponent = WrappedComponent;

  if (forwardRef) {
    return hoistNonReactStatics(
      React.forwardRef<T, P>((props: P, ref) => (
        <WithIntl {...props} forwardedRef={ref} />
      )),
      WrappedComponent
    ) as any;
  }

  return hoistNonReactStatics(WithIntl, WrappedComponent) as any;
}
