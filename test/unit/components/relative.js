import expect, {spyOn} from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from 'react-addons-test-utils';
import IntlProvider from '../../../src/components/provider';
import FormattedRelative from '../../../src/components/relative';

expect.extend(expectJSX);

describe('<FormattedRelative>', () => {
    let consoleError;
    let renderer;
    let intlProvider;

    beforeEach(() => {
        consoleError = spyOn(console, 'error');
        renderer     = createRenderer();
        intlProvider = new IntlProvider({locale: 'en'}, {});

        // TODO: Remove when this feature is released to react-addons-test-utils
        // https://github.com/facebook/react/pull/4918
        if (!renderer.getMountedInstance) {
            renderer.getMountedInstance = function () {
                return this._instance ? this._instance._instance : null;
            };
        }
    });

    afterEach(() => {
        consoleError.restore();
    });

    it('has a `displayName`', () => {
        expect(FormattedRelative.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        expect(() => renderer.render(<FormattedRelative />)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('requires a finite `value` prop', () => {
        const {intl} = intlProvider.getChildContext();

        renderer.render(<FormattedRelative value={0} />, {intl});
        expect(isFinite(0)).toBe(true);
        expect(consoleError.calls.length).toBe(0);

        renderer.render(<FormattedRelative />, {intl});
        expect(consoleError.calls.length).toBe(1);
        expect(consoleError.calls[0].arguments[0]).toContain(
            '[React Intl] Error formatting relative time.\nRangeError'
        );
    });

    it('renders a formatted relative time in a <span>', () => {
        const {intl} = intlProvider.getChildContext();
        const date = new Date();

        const el = <FormattedRelative value={date} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatRelative(date)}</span>
        );
    });

    it('should not re-render when props and context are the same', () => {
        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedRelative value={0} />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedRelative value={0} />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toBe(renderedTwo);
    });

    it('should re-render when props change', () => {
        renderer.render(<FormattedRelative value={0} />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        renderer.render(<FormattedRelative value={1000} />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('should re-render when context changes', () => {
        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedRelative value={0} />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en-US'}, {});
        renderer.render(<FormattedRelative value={0} />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('accepts valid IntlRelativeFormat options as props', () => {
        const {intl} = intlProvider.getChildContext();
        const date = intl.now() - 60 * 1000;
        const options = {units: 'second'};

        const el = <FormattedRelative value={date} {...options} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatRelative(date, options)}</span>
        );
    });

    it('fallsback and warns on invalid IntlRelativeFormat options', () => {
        const {intl} = intlProvider.getChildContext();
        const el = <FormattedRelative value={0} units="invalid" />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{String(new Date(0))}</span>
        );

        expect(consoleError.calls.length).toBeGreaterThan(0);
    });

    it('accepts `format` prop', () => {
        intlProvider = new IntlProvider({
            locale: 'en',
            formats: {
                relative: {
                    'seconds': {
                        units: 'second',
                    },
                },
            },
        }, {});

        const {intl} = intlProvider.getChildContext();
        const date   = intl.now() - 60 * 1000;
        const format = 'seconds';

        const el = <FormattedRelative value={date} format={format} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatRelative(date, {format})}</span>
        );
    });

    it('accepts `initialNow` prop', () => {
        const {intl} = intlProvider.getChildContext();
        const date = 0;
        const now = 1000;

        expect(now).toNotEqual(intl.now());

        const el = <FormattedRelative value={date} initialNow={now} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatRelative(date, {now})}</span>
        );
    });

    it('supports function-as-child pattern', () => {
        const {intl} = intlProvider.getChildContext();
        const date   = new Date();

        const el = (
            <FormattedRelative value={date}>
                {(formattedRelative) => (
                    <b>{formattedRelative}</b>
                )}
            </FormattedRelative>
        );

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <b>{intl.formatRelative(date)}</b>
        );
    });

    it('updates automatically', (done) => {
        const {intl} = intlProvider.getChildContext();
        const date = new Date();
        const now = intl.now();

        // Force scheduler by rendering twice with different props because
        renderer.render(<FormattedRelative value={date} updateInterval={1} />, {intl});
        const renderedOne = renderer.getRenderOutput();

        // Shallow Renderer doesn't call `componentDidMount()`.
        renderer.getMountedInstance().componentDidMount();

        // Update `now()` to act like the <IntlProvider> is mounted.
        intl.now = () => now + 1000;

        setTimeout(() => {
            const renderedTwo = renderer.getRenderOutput();

            expect(renderedTwo).toNotEqualJSX(renderedOne);
            expect(renderedTwo).toEqualJSX(
                <span>{intl.formatRelative(date, {now: intl.now()})}</span>
            );

            renderer.unmount();
            done();
        }, 10);
    });

    it('updates at maximum of `updateInterval` with a string `value`', (done) => {
        const {intl} = intlProvider.getChildContext();
        const date = new Date().toString();

        // `toString()` rounds the date to the nearest second, this makes sure
        // `date` and `now` are equal.
        spyOn(intl, 'now').andCall(Date.now);

        // Force scheduler by rendering twice with different props because
        renderer.render(<FormattedRelative value={date} updateInterval={10} />, {intl});

        // Shallow Renderer doesn't call `componentDidMount()`.
        renderer.getMountedInstance().componentDidMount();

        setTimeout(() => {
            // Make sure setTimeout wasn't called with `NaN`, which is like `0`.
            expect(intl.now.calls.length).toBe(1);

            renderer.unmount();
            done();
        }, 10);
    });

    it('does not update when `updateInterval` prop is falsy', (done) => {
        const {intl} = intlProvider.getChildContext();
        const date = new Date();
        const now = intl.now();

        // Force scheduler by rendering twice with different props because
        renderer.render(<FormattedRelative value={date} updateInterval={0} />, {intl});
        const renderedOne = renderer.getRenderOutput();

        // Shallow Renderer doesn't call `componentDidMount()`.
        renderer.getMountedInstance().componentDidMount();

        // Update `now()` to act like the <IntlProvider> is mounted.
        intl.now = () => now + 1000;

        setTimeout(() => {
            const renderedTwo = renderer.getRenderOutput();

            expect(renderedTwo).toEqualJSX(renderedOne);
            expect(renderedTwo).toNotEqualJSX(
                <span>{intl.formatRelative(date, {now: intl.now()})}</span>
            );

            renderer.unmount();
            done();
        }, 10);
    });
});
