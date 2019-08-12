import * as React from 'react';
import {mount} from 'enzyme';
import {FormattedNumber} from '../../../src';
import {createIntl} from '../../../src/components/provider';
import {mountFormattedComponentWithProvider} from '../testUtils';
const mountWithProvider = mountFormattedComponentWithProvider(FormattedNumber);

describe('<FormattedNumber>', () => {
  let intl;

  beforeEach(() => {
    console.error = jest.fn();
    intl = createIntl({
      locale: 'en',
    });
  });

  it('has a `displayName`', () => {
    expect(FormattedNumber.displayName).toBeA('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() => mount(<FormattedNumber value={0} />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('renders "NaN" in a <span> when no `value` prop is provided', () => {
    const rendered = mountWithProvider({value: undefined}, intl);

    expect(rendered.text()).toBe('NaN');
  });

  it('renders a formatted number in a <>', () => {
    const num = 1000;

    const rendered = mountWithProvider({value: num}, intl);

    expect(rendered.text()).toBe(intl.formatNumber(num));
  });

  it('renders a formatted number w/o textComponent', () => {
    const num = 1000;

    const rendered = mountWithProvider(
      {value: num},
      {...intl, textComponent: null}
    );

    expect(rendered.text()).toBe(intl.formatNumber(num));
  });

  it('accepts valid Intl.NumberFormat options as props', () => {
    const num = 0.5;
    const options = {style: 'percent'};

    const rendered = mountWithProvider({value: num, ...options}, intl);

    expect(rendered.text()).toBe(intl.formatNumber(num, options));
  });

  it('falls back and warns on invalid Intl.NumberFormat options', () => {
    const rendered = mountWithProvider({value: 0, style: 'invalid'}, intl);

    expect(rendered.text()).toBe('0');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(
        '[React Intl] Error formatting number.\nRangeError: Value invalid out of range for numberformat options property style'
      )
    );
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('accepts `format` prop', () => {
    intl = createIntl({
      locale: 'en',
      formats: {
        number: {
          percent: {
            style: 'percent',
            minimumFractionDigits: 2,
          },
        },
      },
    });

    const num = 0.505;
    const format = 'percent';

    const rendered = mountWithProvider({value: num, format}, intl);

    expect(rendered.text()).toBe(intl.formatNumber(num, {format}));
  });

  it('supports function-as-child pattern', () => {
    const num = Date.now();

    const spy = jest.fn().mockImplementation(() => <span>Jest</span>);
    const rendered = mountWithProvider({value: num, children: spy}, intl).find(
      'span'
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatNumber(num)]);

    expect(rendered.type()).toBe('span');
    expect(rendered.text()).toBe('Jest');
  });
});
