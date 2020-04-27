import * as React from 'react';
import {mount} from 'enzyme';
import FormattedPlural from '../../../src/components/plural';
import {mountFormattedComponentWithProvider} from '../testUtils';
import {createIntl} from '../../../src/components/provider';

const mountWithProvider = mountFormattedComponentWithProvider(FormattedPlural);

describe('<FormattedPlural>', () => {
  let intl;

  beforeEach(() => {
    console.error = jest.fn();
    intl = createIntl({
      locale: 'en',
    });
  });

  it('has a `displayName`', () => {
    expect(typeof FormattedPlural.displayName).toBe('string');
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    expect(() => mount(<FormattedPlural value={1} other="" />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('renders an empty <> when no `other` prop is provided', () => {
    const rendered = mountWithProvider(
      {value: undefined, other: undefined},
      intl
    );

    expect(rendered.text()).toBe('');

    const renderedWithValue = mountWithProvider(
      {value: 1, other: undefined},
      intl
    );
    expect(renderedWithValue.text()).toBe('');
  });

  it('renders `other` in a <> when no `value` prop is provided', () => {
    const other = 'Jest';

    const rendered = mountWithProvider({value: undefined, other}, intl);
    expect(rendered.text()).toBe(other);
  });

  it('renders a formatted plural in a <>', () => {
    const num = 1;
    const one = 'foo';
    const other = 'bar';

    const rendered = mountWithProvider({value: num, one, other}, intl);
    expect(rendered.text()).toBe(num === 1 ? one : other);
  });

  it('renders a formatted plural w/o textComponent', () => {
    const num = 1;
    const one = 'foo';
    const other = 'bar';

    const rendered = mountWithProvider(
      {value: num, one, other},
      {...intl, textComponent: null}
    );
    expect(rendered.text()).toBe(num === 1 ? one : other);
  });

  it('accepts valid IntlPluralFormat options as props', () => {
    const num = 22;
    const props = {two: 'nd'} as any;
    const options = {type: 'ordinal'};

    const rendered = mountWithProvider(
      {value: num, ...props, ...options},
      intl
    );

    expect(rendered.text()).toBe(props[intl.formatPlural(num, options)]);
  });

  it('supports function-as-child pattern', () => {
    const props = {one: 'foo'};
    const num = 1;

    const spy = jest.fn().mockImplementation(() => <b>Jest</b>);
    const rendered = mountWithProvider(
      {...props, other: undefined, value: num, children: spy},
      intl
    ).find('b');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([props[intl.formatPlural(num)]]);

    expect(rendered.type()).toBe('b');
    expect(rendered.text()).toBe('Jest');
  });
});
