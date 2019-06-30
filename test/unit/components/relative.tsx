import * as React from 'react';

jest.useFakeTimers();

import {mount, ReactWrapper, render} from 'enzyme';
import {generateIntlContext} from '../testUtils';
import FormattedRelativeTime, {
  Props,
  BaseFormattedRelativeTime,
} from '../../../src/components/relative';
import Provider from '../../../src/components/provider';

function mountWithProvider(
  props: Partial<Props>,
  providerProps: any = {locale: 'en'}
) {
  return mount(
    <FormattedRelativeTime {...props} />,
    {
      wrappingComponent: Provider,
      wrappingComponentProps: providerProps,
    } as any // Seems like DefinitelyTyped types are outdated
  );
}

describe('<FormattedRelative>', () => {
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
    expect(FormattedRelativeTime.displayName).toBe(
      'injectIntl(FormattedRelativeTime)'
    );
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() => mount(<FormattedRelativeTime />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('should re-render when props change', () => {
    const spy = jest.fn().mockImplementation(() => null);
    mountWithProvider({value: 0, children: spy}, intl);
    mountWithProvider({value: 1, children: spy}, intl);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should re-render when context changes', () => {
    const otherIntl = generateIntlContext({
      locale: 'en-US',
    });
    const spy = jest.fn().mockImplementation(() => null);
    mountWithProvider({value: 0, children: spy}, intl);
    mountWithProvider({value: 0, children: spy}, {otherIntl});

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('accepts valid IntlRelativeTimeFormat options as props', () => {
    const options = {style: 'narrow' as 'narrow'};
    const rendered = mountWithProvider({value: -60, ...options});

    expect(rendered.text()).toBe(
      intl.formatRelativeTime(-60, 'second', options)
    );
  });

  it('throws an error for invalid unit', () => {
    const rendered = mountWithProvider({value: 0, unit: 'invalid' as any});
    expect(rendered.text()).toBe('0');
    expect(consoleError.mock.calls.length).toBeGreaterThan(0);
  });

  it('accepts `format` prop', () => {
    const format = 'seconds';
    intl = generateIntlContext({
      locale: 'en',
      formats: {
        relative: {
          [format]: {
            style: 'narrow',
          },
        },
      },
    });

    const rendered = mountWithProvider({value: -60, format}, intl);

    expect(rendered.text()).toBe(
      intl.formatRelativeTime(-60, 'second', {format})
    );
  });

  it('supports function-as-child pattern', () => {
    const spy = jest.fn().mockImplementation(() => <b>Jest</b>);
    const rendered = mountWithProvider({value: 0, children: spy}, intl);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatRelativeTime(0)]);

    expect(
      rendered
        .children()
        .children()
        .type()
    ).toBe('b');
    expect(rendered.text()).toBe('Jest');
  });

  it('updates automatically', () => {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: 0, updateIntervalInSeconds: 1},
      {intl, textComponent: 'span'}
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
      {intl, textComponent: 'span'}
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
      {intl, textComponent: 'span'}
    );
    jest.advanceTimersByTime(1010);
    expect(rendered.text()).toBe(intl.formatRelativeTime(-1, 'minute'));
  });
  it('should adjust unit to min correctly even if updateIntervalInSeconds goes past that ts', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: -59, updateIntervalInSeconds: 2},
      {intl, textComponent: 'span'}
    );
    jest.advanceTimersByTime(1010);
    expect(rendered.text()).toBe(intl.formatRelativeTime(-1, 'minute'));
  });
  it('should adjust unit to hour correctly', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: -59, unit: 'minute', updateIntervalInSeconds: 1},
      {intl, textComponent: 'span'}
    );
    // Advance 1 min
    jest.advanceTimersByTime(1000 * 60);
    expect(rendered.text()).toBe(intl.formatRelativeTime(-1, 'hour'));
  });
  it('should adjust unit to day correctly and stop', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: -23, unit: 'hour', updateIntervalInSeconds: 1},
      {intl, textComponent: 'span'}
    ).find(BaseFormattedRelativeTime);
    expect(
      (rendered.find(BaseFormattedRelativeTime).instance() as any)._updateTimer
    ).not.toBeNull();
    // Advance 1 hour
    jest.advanceTimersByTime(1000 * 60 * 60);
    expect(rendered.text()).toBe(intl.formatRelativeTime(-1, 'day'));
    expect(
      (rendered.find(BaseFormattedRelativeTime).instance() as any)._updateTimer
    ).toBeNull();
  });
  it('should throw if try to increment in day', function() {
    // span bc enzyme support for </> seems buggy
    expect(() =>
      mountWithProvider(
        {value: 5, unit: 'day', updateIntervalInSeconds: 1},
        {intl, textComponent: 'span'}
      ).find(BaseFormattedRelativeTime)
    ).toThrow('Cannot schedule update with unit longer than hour');
  });
  it('should clear timer on unmount', function() {
    // span bc enzyme support for </> seems buggy
    const rendered = mountWithProvider(
      {value: 0, updateIntervalInSeconds: 1},
      {intl, textComponent: 'span'}
    );
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
    const comp = rendered.find(BaseFormattedRelativeTime);
    const updateTimer = (comp.instance() as any)._updateTimer;
    expect(updateTimer).not.toBeNull();
    rendered.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(updateTimer);
  });
});
