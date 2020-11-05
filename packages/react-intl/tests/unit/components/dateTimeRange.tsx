import * as React from 'react';
import {mount} from 'enzyme';
import {FormattedDateTimeRange} from '../../../';
import {mountFormattedComponentWithProvider} from '../testUtils';
import {createIntl} from '../../../src/components/provider';
import {IntlShape} from '../../../';

const mountWithProvider = mountFormattedComponentWithProvider(
  FormattedDateTimeRange
);

describe('<FormattedDateTimeRange>', () => {
  let intl: IntlShape;
  beforeEach(() => {
    intl = createIntl({
      locale: 'en',
    });
  });

  it('has a `displayName`', () => {
    expect(typeof FormattedDateTimeRange.displayName).toBe('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() =>
      mount(<FormattedDateTimeRange from={Date.now()} to={Date.now()} />)
    ).toThrow(Error);
  });

  it('renders a formatted date in a <>', () => {
    const from = new Date('2020-01-01');
    const to = new Date('2020-01-15');

    const rendered = mountWithProvider({from, to}, intl);

    expect(rendered.text()).toBe(intl.formatDateTimeRange(from, to));
  });
  it('renders a formatted date w/o textComponent', () => {
    const from = new Date('2020-01-01');
    const to = new Date('2020-01-15');
    const rendered = mountWithProvider(
      {from, to},
      {...intl, textComponent: '' as any}
    );

    expect(rendered.text()).toBe(intl.formatDateTimeRange(from, to));
  });

  it('accepts valid Intl.DateTimeFormat options as props', () => {
    const from = new Date('2020-01-01');
    const to = new Date('2020-01-15');
    const options = {year: 'numeric'};

    const rendered = mountWithProvider({from, to, ...options}, intl);

    expect(rendered.text()).toBe(intl.formatDateTimeRange(from, to, options));
  });

  it('falls back and warns on invalid Intl.DateTimeFormat options', () => {
    const from = new Date();
    const onError = jest.fn();
    const rendered = mountWithProvider(
      // @ts-ignore
      {from, to: undefined, year: 'invalid'},
      {...intl, onError}
    );

    expect(rendered.text()).toBe(String(from));
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
  });

  it('supports function-as-child pattern', () => {
    const from = new Date('2020-01-01');
    const to = new Date('2020-01-15');
    const spyChildren = jest.fn().mockImplementation(() => <b>Jest</b>);
    const rendered = mountWithProvider(
      {
        from,
        to,
        children: spyChildren,
      },
      intl
    ).find('b');

    expect(spyChildren).toHaveBeenCalledTimes(1);
    expect(spyChildren.mock.calls[0]).toEqual([
      intl.formatDateTimeRange(from, to),
    ]);

    expect(rendered.type()).toBe('b');
    expect(rendered.text()).toBe('Jest');
  });
});
