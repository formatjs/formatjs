import * as React from 'react';
import {mount} from 'enzyme';
import {generateIntlContext, makeMockContext, shallowDeep} from '../testUtils';
import FormattedRelativeTime from '../../../src/components/relative';

const mockContext = makeMockContext(
  require.resolve('../../../src/components/relative')
);

const spyGetDerivedStateFromProps = () => {
  return jest.spyOn(
    require('../../../src/components/relative').BaseFormattedRelative,
    'getDerivedStateFromProps'
  );
};

describe('<FormattedRelative>', () => {
  const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

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
    const FormattedRelative = mockContext();
    expect(() => shallowDeep(<FormattedRelative />, 2)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('renders a formatted relative time in a <>', () => {
    const FormattedRelativeTime = mockContext(intl);
    
    const rendered = shallowDeep(<FormattedRelativeTime value={0} />, 2);

    expect(typeof rendered.type()).toBe('symbol');
    expect(rendered.text()).toBe(intl.formatRelativeTime(0));
  });

  it('should not re-render when props and context are the same', () => {
    const FormattedRelativeTime = mockContext(intl);

    const spy = jest.fn().mockImplementation(() => null);
    const injectIntlContext = mount(
      <FormattedRelativeTime value={0}>{spy}</FormattedRelativeTime>
    );

    injectIntlContext.setProps({
      ...injectIntlContext.props(),
    });
    injectIntlContext.instance().mockContext(intl);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should re-render when props change', () => {
    const FormattedRelativeTime = mockContext(intl);

    const spy = jest.fn().mockImplementation(() => null);
    const injectIntlContext = mount(
      <FormattedRelativeTime value={0}>{spy}</FormattedRelativeTime>
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
      <FormattedRelativeTime value={0}>{spy}</FormattedRelativeTime>
    );

    const otherIntl = generateIntlContext({
      locale: 'en-US',
    });
    injectIntlContext.instance().mockContext(otherIntl);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('accepts valid IntlRelativeTimeFormat options as props', () => {
    const FormattedRelativeTime = mockContext(intl);
    const options = {unit: 'second'};

    const rendered = shallowDeep(
      <FormattedRelativeTime value={-60} {...options} />,
      2
    );

    expect(rendered.text()).toBe(intl.formatRelativeTime(-60, 'second', options));
  });

  it('fallsback and warns on invalid IntlRelativeFormat options', () => {
    const FormattedRelativeTime = mockContext(intl);

    const rendered = shallowDeep(
      <FormattedRelativeTime value={0} unit="invalid" />,
      2
    );

    expect(rendered.text()).toBe('0');
    expect(consoleError.mock.calls.length).toBeGreaterThan(0);
  });

  it('accepts `format` prop', () => {
    intl = generateIntlContext(
      {
        locale: 'en',
        formats: {
          relative: {
            seconds: {
              style: 'narrow',
            },
          },
        },
      },
    );

    const FormattedRelativeTime = mockContext(intl);
    const format = 'seconds';

    const rendered = shallowDeep(
      <FormattedRelativeTime value={-60} format={format} />,
      2
    );

    expect(rendered.text()).toBe(intl.formatRelativeTime(-60, 'second', {format}));
  });


  it('supports function-as-child pattern', () => {
    const FormattedRelativeTime = mockContext(intl);
    
    const spy = jest.fn().mockImplementation(() => <b>Jest</b>);
    const rendered = shallowDeep(
      <FormattedRelativeTime value={0}>{spy}</FormattedRelativeTime>,
      2
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatRelativeTime(0)]);

    expect(rendered.type()).toBe('b');
    expect(rendered.text()).toBe('Jest');
  });

  it('updates automatically', done => {
    const FormattedRelativeTime = mockContext(intl);
    
    const injectIntlContext = shallowDeep(
      <FormattedRelativeTime value={0} updateIntervalInSeconds={1} />
    );
    const text = injectIntlContext.dive().text();

    setTimeout(() => {
      const textAfterUpdate = injectIntlContext.dive().text();

      expect(textAfterUpdate).not.toBe(text);
      expect(textAfterUpdate).toBe(
        intl.formatRelativeTime(-1, 'second')
      );

      done();
    }, 1000);
  });

  it('updates when the `value` prop changes', () => {
    const FormattedRelativeTime = mockContext(intl);
    
    const injectIntlContext = shallowDeep(
      <FormattedRelativeTime value={0} updateIntervalInSeconds={1} />
    );
    const textBefore = injectIntlContext.dive().text();

    injectIntlContext.setProps({
      ...injectIntlContext.props(),
      value: 10,
    });

    expect(injectIntlContext.dive().text()).toBe(textBefore);
  });
});
