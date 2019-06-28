import * as React from 'react';
import {shallow, mount} from 'enzyme';
import {
  invariantIntlContext,
  createDefaultFormatters,
  DEFAULT_INTL_CONFIG,
} from '../../src/utils';
import {WithIntlProps} from '../../src/components/injectIntl';
import Provider, {
  Props as ProviderProps,
  OptionalIntlConfig,
  getBoundFormatFns,
} from '../../src/components/provider';
import {IntlShape} from '../../src/types';
export const shallowDeep = (componentInstance, depth, options) => {
  let rendered = shallow(componentInstance, options);

  for (let i = 1; i < depth; i++) {
    rendered = rendered.dive();
  }

  return rendered;
};

export class SpyComponent extends React.Component {
  private _renders: number = 0;

  getRenderCount() {
    return this._renders;
  }

  render() {
    this._renders++;

    return null;
  }
}

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
