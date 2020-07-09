import * as React from 'react';
import {mount} from 'enzyme';
import {IntlProvider} from '../../../';
import useIntl from '../../../src/components/useIntl';

const FunctionComponent = ({spy}: {spy?: Function}) => {
  const hookReturns = useIntl();
  spy!(hookReturns);
  return null;
};

const FC = () => {
  const {formatNumber} = useIntl();
  return formatNumber(10000, {style: 'currency', currency: 'USD'}) as any;
};

describe('useIntl() hook', () => {
  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() => mount(<FunctionComponent />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('hooks onto the intl context', () => {
    const spy = jest.fn();
    const rendered = mount(
      <IntlProvider locale="en">
        <FunctionComponent spy={spy} />
      </IntlProvider>
    );
    const intl = rendered.state('intl');
    expect(spy).toHaveBeenCalledWith(intl);
  });

  it('should work when switching locale on provider', () => {
    const rendered = mount(
      <IntlProvider locale="en">
        <FC />
      </IntlProvider>
    );
    expect(rendered).toMatchSnapshot();
    rendered.setProps({
      locale: 'es',
    });
    expect(rendered).toMatchSnapshot();
    rendered.setProps({
      locale: 'en',
    });
    expect(rendered).toMatchSnapshot();
  });
});
