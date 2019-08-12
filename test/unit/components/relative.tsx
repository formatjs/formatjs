import * as React from 'react';
import {mount} from 'enzyme';
import FormattedRelativeTime from '../../../src/components/relative';
import {createIntl} from '../../../src/components/provider';
import {IntlShape} from '../../../src/types';
import {mountFormattedComponentWithProvider} from '../testUtils';
import {OptionalIntlConfig} from '../../../src/components/provider';

jest.useFakeTimers();

const mountWithProvider = mountFormattedComponentWithProvider(
  FormattedRelativeTime
);

describe('<FormattedRelativeTime>', () => {
  let intl: IntlShape;
  const intlConfig: OptionalIntlConfig = {
    locale: 'en',
  };

  beforeEach(() => {
    console.error = jest.fn();
    intl = createIntl(intlConfig);
  });

  it('has a `displayName`', () => {
    expect(FormattedRelativeTime.displayName).toBe('FormattedRelativeTime');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() => mount(<FormattedRelativeTime />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('should re-render when props change', () => {
    const spy = jest.fn().mockImplementation(() => null);
    mountWithProvider({value: 0, children: spy}, intlConfig);
    mountWithProvider({value: 1, children: spy}, intlConfig);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should re-render when context changes', () => {
    const otherIntl = createIntl({
      locale: 'en-US',
    });
    const spy = jest.fn().mockImplementation(() => null);
    mountWithProvider({value: 0, children: spy}, intlConfig);
    mountWithProvider({value: 0, children: spy}, otherIntl);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('accepts valid IntlRelativeTimeFormat options as props', () => {
    const options = {style: 'narrow' as 'narrow'};
    const rendered = mountWithProvider({value: -60, ...options});

    expect(rendered.text()).toBe(
      intl.formatRelativeTime(-60, 'second', options)
    );
  });

  it('can render in null textComponent', () => {
    const options = {style: 'narrow' as 'narrow'};
    const rendered = mountWithProvider(
      {value: -60, ...options},
      {...intlConfig, textComponent: null}
    );

    expect(rendered.text()).toBe(
      intl.formatRelativeTime(-60, 'second', options)
    );
  });

  it('throws an error for invalid unit', () => {
    const rendered = mountWithProvider({value: 0, unit: 'invalid' as any});
    expect(rendered.text()).toBe('0');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(
        "Error formatting relative time.\nRangeError: Invalid unit argument for format() 'invalid'"
      )
    );
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('accepts `format` prop', () => {
    const format = 'seconds';
    const config = {
      locale: 'en',
      formats: {
        relative: {
          [format]: {
            style: 'narrow',
          },
        },
      },
    };
    intl = createIntl(config);

    const rendered = mountWithProvider({value: -60, format}, config);

    expect(rendered.text()).toBe(
      intl.formatRelativeTime(-60, 'second', {format})
    );
  });

  it('supports function-as-child pattern', () => {
    const spy = jest.fn().mockImplementation(() => <b>Jest</b>);
    const rendered = mountWithProvider({value: 0, children: spy}, intlConfig);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatRelativeTime(0)]);

    expect(rendered).toMatchSnapshot();
  });

  it('updates automatically', () => {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: 0, updateIntervalInSeconds: 1},
      {...intl, textComponent: 'span'}
    );
    const text = rendered.text();
    jest.advanceTimersByTime(1010);

    const textAfterUpdate = rendered.text();
    expect(textAfterUpdate).not.toBe(text);
    expect(textAfterUpdate).toBe(intl.formatRelativeTime(-1, 'second'));
  });

  it('updates when the `value` prop changes', () => {
    const rendered = mountWithProvider(
      {value: 0, updateIntervalInSeconds: 1},
      {...intl, textComponent: 'span'}
    );
    rendered.setProps({
      value: 10,
    });

    expect(rendered.text()).toBe('in 10 seconds');
    jest.advanceTimersByTime(1010);
    expect(rendered.text()).toBe('in 9 seconds');
  });

  it('should adjust unit to min correctly', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: -59, updateIntervalInSeconds: 1},
      {...intlConfig, textComponent: 'span'}
    );
    jest.advanceTimersByTime(1010);
    expect(rendered.text()).toBe(intl.formatRelativeTime(-1, 'minute'));
  });
  it('should adjust unit to min correctly even if updateIntervalInSeconds goes past that ts', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: -59, updateIntervalInSeconds: 2},
      {...intlConfig, textComponent: 'span'}
    );
    jest.advanceTimersByTime(1010);
    expect(rendered.text()).toBe(intl.formatRelativeTime(-1, 'minute'));
  });
  it('should adjust unit to hour correctly', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: -59, unit: 'minute', updateIntervalInSeconds: 1},
      {...intlConfig, textComponent: 'span'}
    );
    // Advance 1 min
    jest.advanceTimersByTime(1000 * 60);
    expect(rendered.text()).toBe(intl.formatRelativeTime(-1, 'hour'));
  });
  it('should adjust unit to day correctly and stop', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: -23, unit: 'hour', updateIntervalInSeconds: 1},
      {...intlConfig, textComponent: 'span'}
    ).find(FormattedRelativeTime);
    expect(
      (rendered.instance() as FormattedRelativeTime)._updateTimer
    ).not.toBeNull();
    // Advance 1 hour
    jest.advanceTimersByTime(1000 * 60 * 60);
    expect(rendered.text()).toBe(intl.formatRelativeTime(-1, 'day'));
    expect(
      (rendered.instance() as FormattedRelativeTime)._updateTimer
    ).toBeNull();
  });
  it('should show high seconds values as days with no timer', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: -(60 * 60 * 24 * 3), unit: 'second', updateIntervalInSeconds: 1},
      {...intlConfig, textComponent: 'span'}
    ).find(FormattedRelativeTime);
    expect(rendered.text()).toBe(intl.formatRelativeTime(-3, 'day'));
    expect(
      (rendered.instance() as FormattedRelativeTime)._updateTimer
    ).toBeNull();
  });
  it('should throw if try to increment in day', function() {
    // span bc enzyme support for </> seems buggy
    expect(() =>
      mountWithProvider(
        {value: 5, unit: 'day', updateIntervalInSeconds: 1},
        {...intlConfig, textComponent: 'span'}
      ).find(FormattedRelativeTime)
    ).toThrow('Cannot schedule update with unit longer than hour');
  });
  it('should clear timer on unmount', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: 0, updateIntervalInSeconds: 1},
      {...intlConfig, textComponent: 'span'}
    );
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
    const comp = rendered.find(FormattedRelativeTime);
    const updateTimer = (comp.instance() as any)._updateTimer;
    expect(updateTimer).not.toBeNull();
    rendered.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(updateTimer);
  });
});
