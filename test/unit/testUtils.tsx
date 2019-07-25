import * as React from 'react';
import {mount} from 'enzyme';
import {WithIntlProps} from '../../src/components/injectIntl';
import Provider, {Props as ProviderProps} from '../../src/components/provider';

export function mountFormattedComponentWithProvider<P>(
  Comp: React.ComponentType<P>
) {
  return (
    props: P,
    providerProps: WithIntlProps<ProviderProps> = {locale: 'en'}
  ) => {
    return mount(
      <Comp {...props} />,
      {
        wrappingComponent: Provider,
        wrappingComponentProps: providerProps,
      } as any // Seems like DefinitelyTyped types are outdated
    );
  };
}
