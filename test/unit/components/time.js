import expect, {spyOn} from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from '../../react-compat';
import IntlProvider from '../../../src/components/provider';
import FormattedTime from '../../../src/components/time';

expect.extend(expectJSX);

describe('<FormattedTime>', () => {
    let consoleError;
    let renderer;
    let intlProvider;

    beforeEach(() => {
        consoleError = spyOn(console, 'error');
        renderer     = createRenderer();
        intlProvider = new IntlProvider({locale: 'en'}, {});
    });

    afterEach(() => {
        consoleError.restore();
    });

    it('has a `displayName`', () => {
        expect(FormattedTime.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        expect(() => renderer.render(<FormattedTime />)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('requires a finite `value` prop', () => {
        const {intl} = intlProvider.getChildContext();

        renderer.render(<FormattedTime value={0} />, {intl});
        expect(isFinite(0)).toBe(true);
        expect(consoleError.calls.length).toBe(0);

        renderer.render(<FormattedTime />, {intl});
        expect(consoleError.calls.length).toBe(1);
        expect(consoleError.calls[0].arguments[0]).toContain(
            '[React Intl] Error formatting time.\nRangeError'
        );
    });

    it('renders a formatted time in a <span>', () => {
        const {intl} = intlProvider.getChildContext();
        const date = new Date();

        const el = <FormattedTime value={date} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatTime(date)}</span>
        );
    });

    it('should not re-render when props and context are the same', () => {
        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedTime value={0} />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedTime value={0} />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toBe(renderedTwo);
    });

    it('should re-render when props change', () => {
        renderer.render(<FormattedTime value={0} />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        renderer.render(<FormattedTime value={1} />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('should re-render when context changes', () => {
        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedTime value={0} />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en-US'}, {});
        renderer.render(<FormattedTime value={0} />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('accepts valid Intl.DateTimeFormat options as props', () => {
        const {intl} = intlProvider.getChildContext();
        const date = new Date();
        const options = {hour: '2-digit'};

        const el = <FormattedTime value={date} {...options} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatTime(date, options)}</span>
        );
    });

    it('fallsback and warns on invalid Intl.DateTimeFormat options', () => {
        const {intl} = intlProvider.getChildContext();
        const el = <FormattedTime value={0} hour="invalid" />;

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
                time: {
                    'hour-only': {
                        hour: '2-digit',
                        hour12: false,
                    },
                },
            },
        }, {});

        const {intl} = intlProvider.getChildContext();
        const date   = new Date();
        const format = 'hour-only';

        const el = <FormattedTime value={date} format={format} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatTime(date, {format})}</span>
        );
    });

    it('supports function-as-child pattern', () => {
        const {intl} = intlProvider.getChildContext();
        const date   = new Date();

        const el = (
            <FormattedTime value={date}>
                {(formattedTime) => (
                    <b>{formattedTime}</b>
                )}
            </FormattedTime>
        );

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <b>{intl.formatTime(date)}</b>
        );
    });
});
