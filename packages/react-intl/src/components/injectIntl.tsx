import * as React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'
import {invariantIntlContext} from '../utils'
import {IntlShape} from '../types'

function getDisplayName(Component: React.ComponentType<any>): string {
  return Component.displayName || Component.name || 'Component'
}

declare global {
  interface Window {
    /**
     * Set this to `true` prior to mounting to bypass using a globally-exposed context.
     */
    __REACT_INTL_BYPASS_GLOBAL_CONTEXT__: boolean | undefined

    __REACT_INTL_CONTEXT__: React.Context<IntlShape> | undefined
  }
}

// This is primarily dealing with packaging systems where multiple copies of react-intl
// might exist
const IntlContext =
  typeof window !== 'undefined' && !window.__REACT_INTL_BYPASS_GLOBAL_CONTEXT__
    ? window.__REACT_INTL_CONTEXT__ ||
      (window.__REACT_INTL_CONTEXT__ = React.createContext<IntlShape>(
        null as any
      ))
    : React.createContext<IntlShape>(null as any)
const {Consumer: IntlConsumer, Provider: IntlProvider} = IntlContext

export const Provider = IntlProvider
export const Context = IntlContext

export interface Opts<
  IntlPropName extends string = 'intl',
  ForwardRef extends boolean = false
> {
  intlPropName?: IntlPropName
  forwardRef?: ForwardRef
  enforceContext?: boolean
}

export type WrappedComponentProps<IntlPropName extends string = 'intl'> = {
  [k in IntlPropName]: IntlShape
}

/**
 * Utility type to help deal with the fact that `Omit` doesn't play well with unions:
 * - https://github.com/microsoft/TypeScript/issues/31501
 * - https://github.com/microsoft/TypeScript/issues/28339
 *
 * @example
 *      DistributedOmit<X | Y, K>  -->  Omit<X, K> | Omit<Y, K>
 */
export type DistributedOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

export type WithIntlProps<P> = DistributedOmit<
  P,
  keyof WrappedComponentProps
> & {
  forwardedRef?: React.Ref<any>
}

// TODO: type hoisted static methods.
// Non ref forwarding overload
export default function injectIntl<
  IntlPropName extends string = 'intl',
  P extends WrappedComponentProps<IntlPropName> = WrappedComponentProps<any>
>(
  WrappedComponent: React.ComponentType<P>,
  options?: Opts<IntlPropName, false>
): React.FC<WithIntlProps<P>> & {
  WrappedComponent: React.ComponentType<P>
}
// Ref forwarding overload.
export default function injectIntl<
  IntlPropName extends string = 'intl',
  P extends WrappedComponentProps<IntlPropName> = WrappedComponentProps<any>,
  T extends React.ComponentType<P> = any
>(
  WrappedComponent: React.ComponentType<P>,
  options?: Opts<IntlPropName, true>
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<WithIntlProps<React.PropsWithChildren<P>>> &
    React.RefAttributes<T>
> & {
  WrappedComponent: React.ComponentType<P>
}
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
  WrappedComponent: React.ComponentType<P>
} {
  const {
    intlPropName = 'intl',
    forwardRef = false,
    enforceContext = true,
  } = options || {}

  const WithIntl: React.FC<P & {forwardedRef?: React.Ref<any>}> & {
    WrappedComponent: React.ComponentType<P>
  } = props => (
    <IntlConsumer>
      {(intl): React.ReactNode => {
        if (enforceContext) {
          invariantIntlContext(intl)
        }
        const intlProp = {[intlPropName]: intl}

        return (
          <WrappedComponent
            {...props}
            {...intlProp}
            ref={forwardRef ? props.forwardedRef : null}
          />
        )
      }}
    </IntlConsumer>
  )
  WithIntl.displayName = `injectIntl(${getDisplayName(WrappedComponent)})`
  WithIntl.WrappedComponent = WrappedComponent

  if (forwardRef) {
    return hoistNonReactStatics(
      React.forwardRef<T, P>((props: P, ref) => (
        <WithIntl {...props} forwardedRef={ref} />
      )),
      WrappedComponent
    ) as any
  }

  return hoistNonReactStatics(WithIntl, WrappedComponent) as any
}
