import expect, {createSpy, spyOn} from 'expect';
import React from 'react';
import {mount} from 'enzyme';
import {generateIntlContext, makeMockContext, shallowDeep} from '../testUtils';
import FormattedTime from '../../../src/components/time';

const mockContext = makeMockContext(
  require.resolve('../../../src/components/time')
);

describe('<FormattedTime>', () => {
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
        expect(FormattedTime.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        const FormattedTime = mockContext();
        expect(() => shallowDeep(<FormattedTime />, 2)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('requires a finite `value` prop', () => {
        const FormattedTime = mockContext(intl);

        const withIntlContext = mount(
          <FormattedTime value={0} />
        );
        expect(consoleError.calls.length).toBe(0);

        withIntlContext.setProps({
          ...withIntlContext.props(),
          value: undefined
        });
        expect(consoleError.calls.length).toBe(2);
        expect(consoleError.calls[0].arguments[0]).toContain(
          'Warning: Failed prop type: The prop `value` is marked as required in `FormattedTime`, but its value is `undefined`.'
      );
        expect(consoleError.calls[1].arguments[0]).toContain(
            '[React Intl] Error formatting time.\nRangeError'
        );
    });

    it('renders a formatted time in a <span>', () => {
        const FormattedTime = mockContext(intl);
        const date = new Date();

        const rendered = shallowDeep(
          <FormattedTime value={date} />,
          2
        );

        expect(rendered.type()).toBe('span');
        expect(rendered.text()).toBe(intl.formatTime(date));
    });

    it('should re-render when props change', () => {
      const FormattedTime = mockContext(intl);
      const date = Date.now();

      const spy = createSpy().andReturn(null);
      const withIntlContext = mount(
        <FormattedTime value={date}>
          { spy }
        </FormattedTime>
      );

      withIntlContext.setProps({
        ...withIntlContext.props(),
        value: date + 1
      });

      expect(spy.calls.length).toBe(2);
    });

    it('should re-render when context changes', () => {
      const FormattedTime = mockContext(intl);
      const date = Date.now();

      const spy = createSpy().andReturn(null);
      const withIntlContext = mount(
        <FormattedTime value={date}>
          { spy }
        </FormattedTime>
      );

      const otherIntl = generateIntlContext({ locale: 'en-US' });
      withIntlContext.instance().mockContext(otherIntl);

      expect(spy.calls.length).toBe(2);
    });

    it('accepts valid Intl.DateTimeFormat options as props', () => {
        const FormattedTime = mockContext(intl);
        const date = Date.now();
        const options = {hour: '2-digit'};

        const rendered = shallowDeep(
          <FormattedTime value={date} {...options} />,
          2
        );

        expect(rendered.text()).toBe(
          intl.formatTime(date, options)
        );
    });

    it('fallsback and warns on invalid Intl.DateTimeFormat options', () => {
        const FormattedTime = mockContext(intl);
        const date = new Date();

        const rendered = shallowDeep(
          <FormattedTime value={date} hour="invalid" />,
          2
        );

        expect(rendered.text()).toBe(String(date));
        expect(consoleError.calls.length).toBeGreaterThan(0);
    });

    it('accepts `format` prop', () => {
        intl = generateIntlContext({
            locale: 'en',
            formats: {
                time: {
                    'hour-only': {
                        hour: '2-digit',
                        hour12: false,
                    },
                },
            },
        }, {});

        const FormattedTime = mockContext(intl);
        const date = Date.now();
        const format = 'hour-only';

        const rendered = shallowDeep(
          <FormattedTime value={date} format={format} />,
          2
        );

        expect(rendered.text()).toBe(
          intl.formatTime(date, {format})
        );
    });

    it('supports function-as-child pattern', () => {
        const FormattedTime = mockContext(intl);
        const date = Date.now();

        const spy = createSpy().andReturn(<b>Jest</b>);
        const rendered = shallowDeep(
          <FormattedTime value={date}>
            { spy }
          </FormattedTime>,
          2
        );

        expect(rendered.type()).toBe('b');
        expect(rendered.text()).toBe('Jest');

        expect(spy.calls.length).toBe(1);
        expect(spy.calls[0].arguments).toEqual([
          intl.formatTime(date)
        ]);
    });
});
