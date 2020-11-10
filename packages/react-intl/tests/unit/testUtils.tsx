import * as React from 'react';
import Provider, {OptionalIntlConfig} from '../../src/components/provider';
import {render} from '@testing-library/react';

export function mountFormattedComponentWithProvider<P>(
  Comp: React.ComponentType<P>
) {
  return (
    props: P & {children?(...nodes: React.ReactNodeArray): React.ReactNode},
    providerProps: OptionalIntlConfig = {locale: 'en'}
  ) => {
    const result = render(
      <React.StrictMode>
        <Provider {...providerProps}>
          <span data-testid="comp">
            <Comp {...props} />
          </span>
        </Provider>
      </React.StrictMode>
    );

    const {rerender} = result;
    const rerenderProps = (
      props: P & {children?(...nodes: React.ReactNodeArray): React.ReactNode},
      providerProps: OptionalIntlConfig = {locale: 'en'}
    ) =>
      rerender(
        <React.StrictMode>
          <Provider {...providerProps}>
            <span data-testid="comp">
              <Comp {...props} />
            </span>
          </Provider>
        </React.StrictMode>
      );

    return {...result, rerenderProps};
  };
}
