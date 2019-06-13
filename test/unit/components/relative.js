import * as React from 'react';
import {mount} from 'enzyme';
import {generateIntlContext, makeMockContext, shallowDeep} from '../testUtils';
import FormattedRelative from '../../../src/components/relative';

const mockContext = makeMockContext(
  require.resolve('../../../src/components/relative')
);

const spyGetDerivedStateFromProps = () => {
  return jest.spyOn(
    require('../../../src/components/relative').BaseFormattedRelative,
    'getDerivedStateFromProps'
  ).andCallThrough();
}

describe('<FormattedRelative>', () => {
    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

    let consoleError;
    let intl;
    let getDerivedStateFromProps;

    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error');
        intl = generateIntlContext({
          locale: 'en'
        });
        getDerivedStateFromProps = null;
    });

    afterEach(() => {
        consoleError.mockRestore();
        getDerivedStateFromProps && getDerivedStateFromProps.mockRestore();
    });

    it('has a `displayName`', () => {
        expect(FormattedRelative.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        const FormattedRelative = mockContext();
        expect(() => shallowDeep(<FormattedRelative />, 2)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('requires a finite `value` prop', async () => {
        const FormattedRelative = mockContext(intl);
        getDerivedStateFromProps = spyGetDerivedStateFromProps();

        expect(getDerivedStateFromProps).toHaveBeenCalledTimes(0);
        const date = Date.now();

        const withIntlContext = mount(
          <FormattedRelative value={date} />
        );
        expect(consoleError).toHaveBeenCalledTimes(0);

        withIntlContext.setProps({
          ...withIntlContext.props(),
          value: NaN
        });

        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError.mock.calls[0][0]).toContain(
            '[React Intl] Error formatting relative time.\nRangeError'
        );

        // Should avoid update scheduling tight-loop.
        await sleep(10);
        // `getDerivedStateFromProps` is called on mount and when context updates.
        expect(getDerivedStateFromProps).toHaveBeenCalledTimes(2, '`getDerivedStateFromProps()` called unexpectedly');

        withIntlContext.unmount();
    });

    it('renders a formatted relative time in a <span>', () => {
        const FormattedRelative = mockContext(intl);
        const date = new Date();

        const rendered = shallowDeep(
          <FormattedRelative value={date} />,
          2
        );

        expect(rendered.type()).toBe('span');
        expect(rendered.text()).toBe(
          intl.formatRelative(date)
        );
    });

    it('should not re-render when props and context are the same', () => {
        const FormattedRelative = mockContext(intl);

        const spy = jest.fn().mockImplementation(() => null);
        const withIntlContext = mount(
          <FormattedRelative value={Date.now()}>
            { spy }
          </FormattedRelative>
        );

        withIntlContext.setProps({
          ...withIntlContext.props()
        });
        withIntlContext.instance().mockContext(intl);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should re-render when props change', () => {
        const FormattedRelative = mockContext(intl);

        const spy = jest.fn().mockImplementation(() => null);
        const withIntlContext = mount(
          <FormattedRelative value={Date.now()}>
            { spy }
          </FormattedRelative>
        );

        withIntlContext.setProps({
          ...withIntlContext.props(),
          value: withIntlContext.prop('value') + 1
        });

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should re-render when context changes', () => {
        const FormattedRelative = mockContext(intl);

        const spy = jest.fn().mockImplementation(() => null);
        const withIntlContext = mount(
          <FormattedRelative value={Date.now()}>
            { spy }
          </FormattedRelative>
        );

        const otherIntl = generateIntlContext({
          locale: 'en-US'
        });
        withIntlContext.instance().mockContext(otherIntl);

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('accepts valid IntlRelativeFormat options as props', () => {
        const FormattedRelative = mockContext(intl);
        const date = intl.now() - 60 * 1000;
        const options = {units: 'second'};

        const rendered = shallowDeep(
          <FormattedRelative value={date} {...options} />,
          2
        );

        expect(rendered.text()).toBe(
          intl.formatRelative(date, options)
        );
    });

    it('fallsback and warns on invalid IntlRelativeFormat options', () => {
        const FormattedRelative = mockContext(intl);
        const date = new Date();

        const rendered = shallowDeep(
          <FormattedRelative value={date} units="invalid" />,
          2
        );

        expect(rendered.text()).toBe(String(date));
        expect(consoleError.mock.calls.length).toBeGreaterThan(0);
    });

    it('accepts `format` prop', () => {
        intl = generateIntlContext({
            locale: 'en',
            formats: {
                relative: {
                    'seconds': {
                        units: 'second',
                    },
                },
            },
        }, {});

        const FormattedRelative = mockContext(intl);
        const date   = intl.now() - 60 * 1000;
        const format = 'seconds';

        const rendered = shallowDeep(
          <FormattedRelative value={date} format={format} />,
          2
        );

        expect(rendered.text()).toBe(
          intl.formatRelative(date, {format})
        );
    });

    it('accepts `initialNow` prop', () => {
        const FormattedRelative = mockContext(intl);
        const date = 0;
        const now = 1000;

        expect(now).not.toEqual(intl.now());

        const rendered = shallowDeep(
          <FormattedRelative value={date} initialNow={now} />,
          2
        );

        expect(rendered.text()).toBe(
          intl.formatRelative(date, {now})
        );
    });

    it('supports function-as-child pattern', () => {
        const FormattedRelative = mockContext(intl);
        const date = new Date();

        const spy = jest.fn().mockImplementation(() => <b>Jest</b>);
        const rendered = shallowDeep(
          <FormattedRelative value={date}>
            { spy }
          </FormattedRelative>,
          2
        );

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0]).toEqual([
          intl.formatRelative(date)
        ]);

        expect(rendered.type()).toBe('b');
        expect(rendered.text()).toBe('Jest');
    });

    it('updates automatically', (done) => {
        const FormattedRelative = mockContext(intl);
        const date = new Date();
        const now = intl.now();

        const withIntlContext = shallowDeep(
          <FormattedRelative value={date} updateInterval={1} />
        );
        const text = withIntlContext.dive().text();

        // Update `now()` to act like the <IntlProvider> is mounted.
        intl.now = () => now + 1000;

        setTimeout(() => {
            const textAfterUpdate = withIntlContext.dive().text();

            expect(textAfterUpdate).not.toBe(text);
            expect(textAfterUpdate).toBe(
                intl.formatRelative(date, {now: intl.now()})
            );

            done();
        }, 10);
    });

    it('updates when the `value` prop changes', () => {
        const FormattedRelative = mockContext(intl);
        const now = intl.now();

        const withIntlContext = shallowDeep(
          <FormattedRelative value={now} updateInterval={1} />
        );
        const textBefore = withIntlContext.dive().text();

        // Update `now()` to act like the <IntlProvider> is mounted.
        const nextNow = now + 10000;
        intl.now = () => nextNow;

        withIntlContext.setProps({
          ...withIntlContext.props(),
          value: nextNow
        });

        expect(
          withIntlContext.dive().text()
        ).toBe(textBefore);
    });

    it('updates at maximum of `updateInterval` with a string `value`', (done) => {
        const FormattedRelative = mockContext(intl);

        // `toString()` rounds the date to the nearest second, this makes sure
        // `date` and `now` are exactly 1000ms apart so the scheduler will wait
        // 1000ms before the next interesting moment.
        const now = 2000;
        const date = new Date(now - 1000).toString();

        jest.spyOn(intl, 'now').mockImplementation(() => now);

        shallowDeep(
          <FormattedRelative value={date} updateInterval={1} />,
          2
        );

        setTimeout(() => {
            // Make sure setTimeout wasn't called with `NaN`, which is like `0`.
            expect(intl.now).toHaveBeenCalledTimes(1);

            done();
        }, 10);
    });

    it('does not update when `updateInterval` prop is falsy', (done) => {
        const FormattedRelative = mockContext(intl);
        const date = new Date();
        const now = intl.now();

        const withIntlContext = mount(
          <FormattedRelative value={date} updateInterval={0} />
        );
        const textBefore = withIntlContext.text();

        // Update `now()` to act like the <IntlProvider> is mounted.
        intl.now = () => now + 1000;

        setTimeout(() => {
            const textAfter = withIntlContext.text();

            expect(textAfter).toBe(textBefore);
            expect(textAfter).not.toBe(
                intl.formatRelative(date, {now: intl.now()})
            );

            done();
        }, 10);
    });
});
