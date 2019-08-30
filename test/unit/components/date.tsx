import * as React from 'react';
import {mount} from 'enzyme';
import {FormattedDate, FormattedDateParts} from '../../../src';
import {mountFormattedComponentWithProvider} from '../testUtils';
import {createIntl} from '../../../src/components/provider';
import {IntlShape} from '../../../src';

const mountWithProvider = mountFormattedComponentWithProvider(FormattedDate);
const mountPartsWithProvider = mountFormattedComponentWithProvider(
  FormattedDateParts
);

describe('<FormattedDate>', () => {
  let intl: IntlShape;

  beforeEach(() => {
    console.error = jest.fn();
    intl = createIntl({
      locale: 'en',
    });
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
    expect(console.error).toHaveBeenCalledTimes(0);

    mountWithProvider({value: NaN}, intl);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[React Intl] Error formatting date.\nRangeError')
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

  it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
    const date = new Date();
    const rendered = mountWithProvider({value: date, year: 'invalid'}, intl);

    expect(rendered.text()).toBe(String(date));
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /Error formatting date.\nRangeError: Value invalid out of range for (.*) options property year/
      )
    );
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

describe('<FormattedDateParts>', () => {
  let intl: IntlShape;
  const children = jest.fn();

  beforeEach(() => {
    console.error = jest.fn();
    intl = createIntl({
      locale: 'en',
    });
    children.mockClear();
  });

  it('has a `displayName`', () => {
    expect(FormattedDateParts.displayName).toBe('FormattedDateParts');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() =>
      mount(<FormattedDateParts children={children} value={Date.now()} />)
    ).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('requires a finite `value` prop', () => {
    const value = Date.now();

    mountPartsWithProvider({value, children}, intl);
    expect(isFinite(value)).toBe(true);
    expect(console.error).toHaveBeenCalledTimes(0);

    mountPartsWithProvider({value: NaN, children}, intl);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[React Intl] Error formatting date.\nRangeError')
    );
  });

  it('accepts valid Intl.DateTimeFormat options as props', () => {
    const date = new Date(1567130870626);
    const options = {year: 'numeric', children};

    mountPartsWithProvider({value: date, ...options}, intl);

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatDateToParts(date, options)
    );
  });

  it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
    const date = new Date(1567130870626);
    mountPartsWithProvider({value: date, year: 'invalid', children}, intl);

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatDateToParts(date, {year: 'invalid'})
    );
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /Error formatting date.\nRangeError: Value invalid out of range for (.*) options property year/
      )
    );
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

    const date = new Date(1567130870626);
    const format = 'year-only';

    mountPartsWithProvider({value: date, format, children}, intl);

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatDateToParts(date, {format})
    );
  });
});
