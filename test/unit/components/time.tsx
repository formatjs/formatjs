import * as React from 'react';
import {mount} from 'enzyme';
import {FormattedTime} from '../../../src';
import {mountFormattedComponentWithProvider} from '../testUtils';
import {createIntl} from '../../../src/components/provider';

const mountWithProvider = mountFormattedComponentWithProvider(FormattedTime);

describe('<FormattedTime>', () => {
  let intl;

  beforeEach(() => {
    console.error = jest.fn();
    intl = createIntl({
      locale: 'en',
    });
  });

  it('has a `displayName`', () => {
    expect(FormattedTime.displayName).toBeA('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() => mount(<FormattedTime value={0} />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('requires a finite `value` prop', () => {
    const injectIntlContext = mountWithProvider({value: 0}, intl);
    expect(console.error).toHaveBeenCalledTimes(0);

    injectIntlContext.setProps({
      ...injectIntlContext.props(),
      value: NaN,
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[React Intl] Error formatting time.\nRangeError')
    );
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('renders a formatted time in a <>', () => {
    const date = new Date();

    const rendered = mountWithProvider({value: date}, intl);

    expect(rendered.text()).toBe(intl.formatTime(date));
  });

  it('renders a formatted time w/o textComponent', () => {
    const date = new Date();

    const rendered = mountWithProvider(
      {value: date},
      {...intl, textComponent: null}
    );

    expect(rendered.text()).toBe(intl.formatTime(date));
  });

  it('accepts valid Intl.DateTimeFormat options as props', () => {
    const date = Date.now();
    const options = {hour: '2-digit'};

    const rendered = mountWithProvider({value: date, ...options}, intl);

    expect(rendered.text()).toBe(intl.formatTime(date, options));
  });

  it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
    const date = new Date();

    const rendered = mountWithProvider({value: date, hour: 'invalid'}, intl);

    expect(rendered.text()).toBe(String(date));
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /\[React Intl\] Error formatting time.\nRangeError: Value invalid out of range for (.*) options property hour/
      )
    );
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('accepts `format` prop', () => {
    intl = createIntl({
      locale: 'en',
      formats: {
        time: {
          'hour-only': {
            hour: '2-digit',
            hour12: false,
          },
        },
      },
    });

    const date = Date.now();
    const format = 'hour-only';

    const rendered = mountWithProvider({value: date, format}, intl);

    expect(rendered.text()).toBe(intl.formatTime(date, {format}));
  });

  it('supports function-as-child pattern', () => {
    const date = Date.now();

    const spy = jest.fn().mockImplementation(() => <b>Jest</b>);
    const rendered = mountWithProvider({value: date, children: spy}, intl).find(
      'b'
    );

    expect(rendered.type()).toBe('b');
    expect(rendered.text()).toBe('Jest');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatTime(date)]);
  });
});
