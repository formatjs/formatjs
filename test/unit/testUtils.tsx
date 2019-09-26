import * as React from 'react';
import {mount} from 'enzyme';
import Provider, {OptionalIntlConfig} from '../../src/components/provider';

function StrictProvider(props: OptionalIntlConfig) {
  return (
    <React.StrictMode>
      <Provider {...props} />
    </React.StrictMode>
  );
}

export function mountFormattedComponentWithProvider<P>(
  Comp: React.ComponentType<P>
) {
  return (props: P, providerProps: OptionalIntlConfig = {locale: 'en'}) => {
    return mount(<Comp {...props} />, {
      wrappingComponent: StrictProvider,
      wrappingComponentProps: providerProps,
    });
  };
}
