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
    intl = createIntl({
      locale: 'en',
    });
  });

  it('has a `displayName`', () => {
    expect(typeof FormattedDate.displayName).toBe('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() => mount(<FormattedDate value={Date.now()} />)).toThrow(Error);
  });

  it('requires a finite `value` prop', () => {
    const value = Date.now();
    const onError = jest.fn();
    mountWithProvider({value}, {...intl, onError});
    expect(isFinite(value)).toBe(true);
    expect(onError).toHaveBeenCalledTimes(0);

    mountWithProvider({value: NaN}, {...intl, onError});
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
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
      {...intl, textComponent: '' as any}
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
    const onError = jest.fn();
    const rendered = mountWithProvider(
      {value: date, year: 'invalid'},
      {...intl, onError}
    );

    expect(rendered.text()).toBe(String(date));
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
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

    const spyChildren = jest.fn().mockImplementation(() => <b>Jest</b>);
    const rendered = mountWithProvider(
      {
        value: date,
        children: spyChildren,
      },
      intl
    ).find('b');

    expect(spyChildren).toHaveBeenCalledTimes(1);
    expect(spyChildren.mock.calls[0]).toEqual([intl.formatDate(date)]);

    expect(rendered.type()).toBe('b');
    expect(rendered.text()).toBe('Jest');
  });
});

describe('<FormattedDateParts>', () => {
  let intl: IntlShape;
  const children = jest.fn();

  beforeEach(() => {
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
    const onError = jest.fn();
    mountPartsWithProvider({value, children}, {...intl, onError});
    expect(isFinite(value)).toBe(true);
    expect(onError).toHaveBeenCalledTimes(0);

    mountPartsWithProvider({value: NaN, children}, {...intl, onError});
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
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
    const onError = jest.fn();
    mountPartsWithProvider(
      {value: date, year: 'invalid', children},
      {...intl, onError}
    );

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatDateToParts(date, {year: 'invalid'})
    );
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
  });

  it('renders a string date', () => {
    const date = new Date();

    mountPartsWithProvider({value: date + '', children}, intl);

    expect(children.mock.calls[0][0]).toEqual(intl.formatDateToParts(date));
  });

  it('renders date 0 if value is ""', () => {
    const date = new Date(0);

    mountPartsWithProvider({value: '', children}, intl);

    expect(children.mock.calls[0][0]).toEqual(intl.formatDateToParts(date));
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
