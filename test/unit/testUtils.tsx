import * as React from 'react';
import {shallow, mount} from 'enzyme';
import {
  invariantIntlContext,
  createDefaultFormatters,
  DEFAULT_INTL_CONFIG,
} from '../../src/utils';
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
