import * as React from 'react';
import {mount} from 'enzyme';
import {generateIntlContext, makeMockContext, shallowDeep} from '../testUtils';
import FormattedRelativeTime from '../../../src/components/relativeTime';

const mockContext = makeMockContext(
  require.resolve('../../../src/components/relativeTime')
);

describe('<FormattedRelativeTime>', () => {
  let consoleError;
  let intl;
  let getDerivedStateFromProps;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error');
    intl = generateIntlContext({
      locale: 'en',
    });
    getDerivedStateFromProps = null;
  });

  afterEach(() => {
    consoleError.mockRestore();
    getDerivedStateFromProps && getDerivedStateFromProps.mockRestore();
  });

  it('has a `displayName`', () => {
    expect(FormattedRelativeTime.displayName).toBeA('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    const FormattedRelativeTime = mockContext();
    expect(() => shallowDeep(<FormattedRelativeTime />, 2)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('renders a formatted relative time in a <span>', () => {
    const FormattedRelativeTime = mockContext(intl);

    const rendered = shallowDeep(
      <FormattedRelativeTime value={0} unit="second" />,
      2
    );

    expect(rendered.type()).toBe('span');
    expect(rendered.text()).toBe(intl.formatRelativeTime(0, 'second'));
  });

  it('should re-render when props change', () => {
    const FormattedRelativeTime = mockContext(intl);

    const spy = jest.fn().mockImplementation(() => null);
    const injectIntlContext = mount(
      <FormattedRelativeTime value={0} unit="second">
        {spy}
      </FormattedRelativeTime>
    );

    injectIntlContext.setProps({
      ...injectIntlContext.props(),
      value: injectIntlContext.prop('value') + 1,
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should re-render when context changes', () => {
    const FormattedRelativeTime = mockContext(intl);

    const spy = jest.fn().mockImplementation(() => null);
    const injectIntlContext = mount(
      <FormattedRelativeTime value={0} unit="second">
        {spy}
      </FormattedRelativeTime>
    );

    const otherIntl = generateIntlContext({
      locale: 'en-US',
    });
    injectIntlContext.instance().mockContext(otherIntl);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('accepts valid IntlRelativeTimeFormat options as props', () => {
    const FormattedRelativeTime = mockContext(intl);
    const options = {units: 'second'};

    const rendered = shallowDeep(
      <FormattedRelativeTime value={60} unit="minute" {...options} />,
      2
    );

    expect(rendered.text()).toBe(
      intl.formatRelativeTime(60, 'minute', options)
    );
  });

  it('accepts `format` prop', () => {
    intl = generateIntlContext(
      {
        locale: 'en',
        formats: {
          relativeTime: {
            seconds: {
              style: 'narrow',
            },
          },
        },
      },
      {}
    );

    const FormattedRelativeTime = mockContext(intl);

    const rendered = shallowDeep(
      <FormattedRelativeTime value={-5} unit="second" format="seconds" />,
      2
    );

    expect(rendered.text()).toBe(
      intl.formatRelativeTime(-5, 'second', {format: 'seconds'})
    );
  });

  it('supports function-as-child pattern', () => {
    const FormattedRelativeTime = mockContext(intl);

    const spy = jest.fn().mockImplementation(() => <b>Jest</b>);
    const rendered = shallowDeep(
      <FormattedRelativeTime value={0} unit="second">
        {spy}
      </FormattedRelativeTime>,
      2
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatRelativeTime(0, 'second')]);

    expect(rendered.type()).toBe('b');
    expect(rendered.text()).toBe('Jest');
  });
});
