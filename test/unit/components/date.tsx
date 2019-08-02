import * as React from 'react';
import {mount} from 'enzyme';
import {FormattedDate} from '../../../src';
import {mountFormattedComponentWithProvider} from '../testUtils';
import {createIntl} from '../../../src/components/provider';
import {IntlShape} from '../../../src';

const mountWithProvider = mountFormattedComponentWithProvider(FormattedDate);

describe('<FormattedDate>', () => {
  let consoleError;
  let intl: IntlShape;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error');
    intl = createIntl({
      locale: 'en',
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('has a `displayName`', () => {
    expect(FormattedDate.displayName).toBeA('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() => mount(<FormattedDate value={Date.now()} />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('requires a finite `value` prop', () => {
    const value = Date.now();

    mountWithProvider({value}, intl);
    expect(isFinite(value)).toBe(true);
    expect(consoleError).toHaveBeenCalledTimes(0);

    mountWithProvider({value: NaN}, intl);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain(
      '[React Intl] Error formatting date.\nRangeError'
    );
  });

  it('renders a formatted date in a <>', () => {
    const date = Date.now();

    const rendered = mountWithProvider({value: date}, intl);

    expect(rendered.text()).toBe(intl.formatDate(date));
  });
  it('renders a formatted date w/o textComponent', () => {
    const date = Date.now();

    const rendered = mountWithProvider(
      {value: date},
      {...intl, textComponent: ''}
    );

    expect(rendered.text()).toBe(intl.formatDate(date));
  });

  it('accepts valid Intl.DateTimeFormat options as props', () => {
    const date = new Date();
    const options = {year: 'numeric'};

    const rendered = mountWithProvider({value: date, ...options}, intl);

    expect(rendered.text()).toBe(intl.formatDate(date, options));
  });

  it('fallsback and warns on invalid Intl.DateTimeFormat options', () => {
    const date = new Date();
    const rendered = mountWithProvider({value: date, year: 'invalid'}, intl);

    expect(rendered.text()).toBe(String(date));
    expect(consoleError.mock.calls.length).toBeGreaterThan(0);
  });

  it('accepts `format` prop', () => {
    intl = createIntl({
      locale: 'en',
      formats: {
        date: {
          'year-only': {year: 'numeric'},
        },
      },
    });

    const date = new Date();
    const format = 'year-only';

    const rendered = mountWithProvider({value: date, format}, intl);

    expect(rendered.text()).toBe(intl.formatDate(date, {format}));
  });

  it('supports function-as-child pattern', () => {
    const date = Date.now();

    const spy = jest.fn().mockImplementation(() => <b>Jest</b>);
    const rendered = mountWithProvider({value: date, children: spy}, intl).find(
      'b'
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatDate(date)]);

    expect(rendered.type()).toBe('b');
    expect(rendered.text()).toBe('Jest');
  });
});
