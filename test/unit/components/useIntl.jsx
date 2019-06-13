import * as React from 'react';
import {mount} from 'enzyme';
import {IntlProvider} from '../../../src';
import useIntl from '../../../src/components/useIntl';

const FunctionComponent = ({spy}) => {
  const hookReturns = useIntl();
  spy(hookReturns);
  return null;
};

describe('useIntl() hook', () => {
  it('throws when <IntlProvider> is missing from ancestry', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {}); // surpress console error from JSDom
    expect(() => mount(<FunctionComponent />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
    consoleError.mockRestore();
  });

  it('hooks onto the intl context', () => {
    const spy = jest.fn();
    const rendered = mount(
      <IntlProvider locale="en">
        <FunctionComponent spy={spy} />
      </IntlProvider>
    );
    const intl = rendered
      .find(IntlProvider)
      .childAt(0)
      .instance()
      .getContext();
    expect(spy).toHaveBeenCalledWith(intl);
  });
});
