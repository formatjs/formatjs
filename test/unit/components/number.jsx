import * as React from 'react';
import {mount} from 'enzyme';
import {generateIntlContext, makeMockContext, shallowDeep} from '../testUtils';
import FormattedNumber from '../../../src/components/number';

const mockContext = makeMockContext(
  require.resolve('../../../src/components/number')
);

describe('<FormattedNumber>', () => {
  let consoleError;
  let intl;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error');
    intl = generateIntlContext({
      locale: 'en',
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('has a `displayName`', () => {
    expect(FormattedNumber.displayName).toBeA('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    const FormattedNumber = mockContext();
    expect(() => shallowDeep(<FormattedNumber />, 2)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('renders "NaN" in a <span> when no `value` prop is provided', () => {
    const FormattedNumber = mockContext(intl);

    const rendered = shallowDeep(<FormattedNumber />, 2);

    expect(typeof rendered.type()).toBe('symbol');
    expect(rendered.text()).toBe('NaN');
  });

  it('renders a formatted number in a <span>', () => {
    const FormattedNumber = mockContext(intl);
    const num = 1000;

    const rendered = shallowDeep(<FormattedNumber value={num} />, 2);

    expect(typeof rendered.type()).toBe('symbol');
    expect(rendered.text()).toBe(intl.formatNumber(num));
  });

  it('should re-render when props change', () => {
    const FormattedNumber = mockContext(intl);
    const num = 1000;

    const spy = jest.fn().mockImplementation(() => null);
    const injectIntlContext = mount(
      <FormattedNumber value={num}>{spy}</FormattedNumber>
    );

    injectIntlContext.setProps({
      ...injectIntlContext.props(),
      value: num + 1,
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should re-render when context changes', () => {
    const FormattedNumber = mockContext(intl);
    const num = 1000;

    const spy = jest.fn().mockImplementation(() => null);
    const injectIntlContext = mount(
      <FormattedNumber value={num}>{spy}</FormattedNumber>
    );

    const otherIntl = generateIntlContext({locale: 'en-US'});
    injectIntlContext.instance().mockContext(otherIntl);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('accepts valid Intl.NumberFormat options as props', () => {
    const FormattedNumber = mockContext(intl);
    const num = 0.5;
    const options = {style: 'percent'};

    const rendered = shallowDeep(
      <FormattedNumber value={num} {...options} />,
      2
    );

    expect(rendered.text()).toBe(intl.formatNumber(num, options));
  });

  it('fallsback and warns on invalid Intl.NumberFormat options', () => {
    const FormattedNumber = mockContext(intl);
    const rendered = shallowDeep(
      <FormattedNumber value={0} style="invalid" />,
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
          number: {
            percent: {
              style: 'percent',
              minimumFractionDigits: 2,
            },
          },
        },
      },
      {}
    );

    const FormattedNumber = mockContext(intl);
    const num = 0.505;
    const format = 'percent';

    const rendered = shallowDeep(
      <FormattedNumber value={num} format={format} />,
      2
    );

    expect(rendered.text()).toBe(intl.formatNumber(num, {format}));
  });

  it('supports function-as-child pattern', () => {
    const FormattedNumber = mockContext(intl);
    const num = new Date();

    const spy = jest.fn().mockImplementation(() => <span>Jest</span>);
    const rendered = shallowDeep(
      <FormattedNumber value={num}>{spy}</FormattedNumber>,
      2
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatNumber(num)]);

    expect(rendered.type()).toBe('span');
    expect(rendered.text()).toBe('Jest');
  });
});
