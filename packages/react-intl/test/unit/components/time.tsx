import * as React from 'react';
import {mount} from 'enzyme';
import {FormattedTime, FormattedTimeParts} from '../../../src';
import {mountFormattedComponentWithProvider} from '../testUtils';
import {createIntl} from '../../../src/components/provider';

const mountWithProvider = mountFormattedComponentWithProvider(FormattedTime);
const mountPartsWithProvider = mountFormattedComponentWithProvider(
  FormattedTimeParts
);

describe('<FormattedTime>', () => {
  let intl;
  const onError = jest.fn();
  beforeEach(() => {
    onError.mockClear();
    intl = createIntl({
      locale: 'en',
      onError,
    });
  });

  it('has a `displayName`', () => {
    expect(typeof FormattedTime.displayName).toBe('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() => mount(<FormattedTime value={0} />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('requires a finite `value` prop', () => {
    const injectIntlContext = mountWithProvider({value: 0}, intl);
    expect(onError).not.toHaveBeenCalled();

    injectIntlContext.setProps({
      ...injectIntlContext.props(),
      value: NaN,
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
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
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
    expect(onError).toHaveBeenCalledTimes(1);
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

describe('<FormattedTimeParts>', () => {
  let intl;
  const children = jest.fn();
  const onError = jest.fn();
  beforeEach(() => {
    onError.mockClear();
    intl = createIntl({
      locale: 'en',
      onError,
    });
    children.mockClear();
  });

  it('has a `displayName`', () => {
    expect(FormattedTimeParts.displayName).toBe('FormattedTimeParts');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() =>
      mount(<FormattedTimeParts value={0} children={children} />)
    ).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('requires a finite `value` prop', () => {
    const injectIntlContext = mountPartsWithProvider(
      {value: 0, children},
      intl
    );
    expect(onError).not.toHaveBeenCalled();

    injectIntlContext.setProps({
      ...injectIntlContext.props(),
      value: NaN,
    });
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('accepts valid Intl.DateTimeFormat options as props', () => {
    const date = new Date(1567130870626);
    const options = {hour: '2-digit', children};

    mountPartsWithProvider({value: date, ...options}, intl);

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatTimeToParts(date, options)
    );
  });

  it('renders a string date', () => {
    const date = new Date();

    mountPartsWithProvider({value: date.toISOString(), children}, intl);

    expect(children.mock.calls[0][0]).toEqual(intl.formatTimeToParts(date));
  });

  it('renders date 0 if value is ""', () => {
    const date = new Date(0);

    mountPartsWithProvider({value: '', children}, intl);

    expect(children.mock.calls[0][0]).toEqual(intl.formatTimeToParts(date));
  });

  it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
    const date = new Date(1567130870626);

    mountPartsWithProvider({value: date, hour: 'invalid', children}, intl);

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatTimeToParts(date, {hour: 'invalid'})
    );
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
    expect(onError).toHaveBeenCalledTimes(2);
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

    const date = new Date(1567130870626);
    const format = 'hour-only';

    mountPartsWithProvider({value: date, format, children}, intl);

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatTimeToParts(date, {format})
    );
  });
});
