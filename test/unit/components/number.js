import expect, {createSpy, spyOn} from 'expect';
import React from 'react';
import {mount} from 'enzyme';
import {generateIntlContext, makeMockContext, shallowDeep} from '../utils';
import FormattedNumber from '../../../src/components/number';

const mockContext = makeMockContext(
  require.resolve('../../../src/components/number')
);

describe('<FormattedNumber>', () => {
    let consoleError;
    let intl;

    beforeEach(() => {
        consoleError = spyOn(console, 'error');
        intl = generateIntlContext({
          locale: 'en'
        });
    });

    afterEach(() => {
        consoleError.restore();
    });

    it('has a `displayName`', () => {
        expect(FormattedNumber.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        const FormattedNumber = mockContext();
        expect(() => shallowDeep(<FormattedNumber />, 2)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('renders "NaN" in a <span> when no `value` prop is provided', () => {
        const FormattedNumber = mockContext(intl);

        const rendered = shallowDeep(
          <FormattedNumber />,
          2
        );

        expect(rendered.type()).toBe('span');
        expect(rendered.text()).toBe('NaN');
    });

    it('renders a formatted number in a <span>', () => {
        const FormattedNumber = mockContext(intl);
        const num = 1000;

        const rendered = shallowDeep(
          <FormattedNumber value={num} />,
          2
        );

        expect(rendered.type()).toBe('span');
        expect(rendered.text()).toBe(intl.formatNumber(num));
    });

    it('should not re-render when props and context are the same', () => {
        const FormattedNumber = mockContext(intl);
        const num = 1000;

        const spy = createSpy().andReturn(null);
        const withIntlContext = mount(
          <FormattedNumber value={num}>
            { spy }
          </FormattedNumber>
        );

        withIntlContext.setProps({
          ...withIntlContext.props()
        });
        withIntlContext.instance().mockContext(intl);

        expect(spy.calls.length).toBe(1);
    });

    it('should re-render when props change', () => {
      const FormattedNumber = mockContext(intl);
      const num = 1000;

      const spy = createSpy().andReturn(null);
      const withIntlContext = mount(
        <FormattedNumber value={num}>
          { spy }
        </FormattedNumber>
      );

      withIntlContext.setProps({
        ...withIntlContext.props(),
        value: num + 1
      });

      expect(spy.calls.length).toBe(2);
    });

    it('should re-render when context changes', () => {
      const FormattedNumber = mockContext(intl);
      const num = 1000;

      const spy = createSpy().andReturn(null);
      const withIntlContext = mount(
        <FormattedNumber value={num}>
          { spy }
        </FormattedNumber>
      );

      const otherIntl = generateIntlContext({ locale: 'en-US' });
      withIntlContext.instance().mockContext(otherIntl);

      expect(spy.calls.length).toBe(2);
    });

    it('accepts valid Intl.NumberFormat options as props', () => {
        const FormattedNumber = mockContext(intl);
        const num = 0.5;
        const options = {style: 'percent'};

        const rendered = shallowDeep(
          <FormattedNumber value={num} {...options} />,
          2
        );

        expect(rendered.text()).toBe(
          intl.formatNumber(num, options)
        );
    });

    it('fallsback and warns on invalid Intl.NumberFormat options', () => {
        const FormattedNumber = mockContext(intl);
        const rendered = shallowDeep(
          <FormattedNumber value={0} style="invalid" />,
          2
        );

        expect(rendered.text()).toBe('0');
        expect(consoleError.calls.length).toBeGreaterThan(0);
    });

    it('accepts `format` prop', () => {
        intl = generateIntlContext({
            locale: 'en',
            formats: {
                number: {
                    'percent': {
                        style: 'percent',
                        minimumFractionDigits: 2,
                    },
                },
            },
        }, {});

        const FormattedNumber = mockContext(intl);
        const num   = 0.505;
        const format = 'percent';

        const rendered = shallowDeep(
          <FormattedNumber value={num} format={format} />,
          2
        );

        expect(rendered.text()).toBe(
          intl.formatNumber(num, {format})
        );
    });

    it('supports function-as-child pattern', () => {
        const FormattedNumber = mockContext(intl);
        const num = new Date();

        const spy = createSpy().andReturn(<span>Jest</span>);
        const rendered = shallowDeep(
          <FormattedNumber value={num}>
            { spy }
          </FormattedNumber>,
          2
        );

        expect(spy.calls.length).toBe(1);
        expect(spy.calls[0].arguments).toEqual([
          intl.formatNumber(num)
        ]);

        expect(rendered.type()).toBe('span');
        expect(rendered.text()).toBe('Jest');
    });
});
