import * as React from 'react';
import {mount} from 'enzyme';
import {FormattedNumber, FormattedNumberParts} from '../../../src';
import {createIntl} from '../../../src/components/provider';
import {mountFormattedComponentWithProvider} from '../testUtils';
import {UnifiedNumberFormatOptions} from '@formatjs/intl-unified-numberformat';
const mountWithProvider = mountFormattedComponentWithProvider(FormattedNumber);
const mountPartsWithProvider = mountFormattedComponentWithProvider(
  FormattedNumberParts
);

describe('<FormattedNumber>', () => {
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
    expect(typeof FormattedNumber.displayName).toBe('string');
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
    const options = {style: 'percent' as UnifiedNumberFormatOptions['style']};

    const rendered = mountWithProvider({value: num, ...options}, intl);

    expect(rendered.text()).toBe(intl.formatNumber(num, options));
  });

  it('falls back and warns on invalid Intl.NumberFormat options', () => {
    const rendered = mountWithProvider(
      {value: 0, style: 'invalid' as any},
      intl
    );

    expect(rendered.text()).toBe('0');
    expect(onError.mock.calls[0][0].code).toMatchSnapshot();
    expect(onError).toHaveBeenCalledTimes(1);
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

function NOOP(_: Intl.NumberFormatPart[]) {
  return null;
}

describe('<FormattedNumberParts>', function() {
  let intl;
  const children = jest.fn();

  beforeEach(() => {
    console.error = jest.fn();
    intl = createIntl({
      locale: 'en',
    });
    children.mockClear();
  });

  it('has a `displayName`', () => {
    expect(typeof FormattedNumberParts.displayName).toBe('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() =>
      mount(<FormattedNumberParts value={0} children={NOOP} />)
    ).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('accepts valid Intl.NumberFormat options as props', () => {
    const num = 0.5;
    const options = {
      style: 'percent' as UnifiedNumberFormatOptions['style'],
      children,
    };

    mountPartsWithProvider({value: num, ...options}, intl);

    expect(children.mock.calls[0][0]).toEqual(
      intl.formatNumberToParts(num, options)
    );
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

    mountPartsWithProvider({value: num, format, children}, intl);
    expect(children.mock.calls[0][0]).toEqual(
      intl.formatNumberToParts(num, {format})
    );
  });
});
