import expect, {spyOn} from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from '../../react-compat';
import IntlProvider from '../../../src/components/provider';
import FormattedNumber from '../../../src/components/number';

expect.extend(expectJSX);

describe('<FormattedNumber>', () => {
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
        expect(FormattedNumber.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        expect(() => renderer.render(<FormattedNumber />)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('renders "NaN" in a <span> when no `value` prop is provided', () => {
        renderer.render(<FormattedNumber />, intlProvider.getChildContext());
        expect(renderer.getRenderOutput()).toEqualJSX(<span>NaN</span>);
    });

    it('renders a formatted number in a <span>', () => {
        const {intl} = intlProvider.getChildContext();
        const num = 1000;

        const el = <FormattedNumber value={num} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatNumber(num)}</span>
        );
    });

    it('should not re-render when props and context are the same', () => {
        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedNumber value={1000} />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedNumber value={1000} />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toBe(renderedTwo);
    });

    it('should re-render when props change', () => {
        renderer.render(<FormattedNumber value={1000} />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        renderer.render(<FormattedNumber value={2000} />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('should re-render when context changes', () => {
        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedNumber value={1000} />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en-US'}, {});
        renderer.render(<FormattedNumber value={1000} />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('accepts valid Intl.NumberFormat options as props', () => {
        const {intl} = intlProvider.getChildContext();
        const num = 0.5;
        const options = {style: 'percent'};

        const el = <FormattedNumber value={num} {...options} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatNumber(num, options)}</span>
        );
    });

    it('fallsback and warns on invalid Intl.NumberFormat options', () => {
        const {intl} = intlProvider.getChildContext();
        const el = <FormattedNumber value={0} style="invalid" />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{String(0)}</span>
        );

        expect(consoleError.calls.length).toBeGreaterThan(0);
    });

    it('accepts `format` prop', () => {
        intlProvider = new IntlProvider({
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

        const {intl} = intlProvider.getChildContext();
        const num   = 0.505;
        const format = 'percent';

        const el = <FormattedNumber value={num} format={format} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatNumber(num, {format})}</span>
        );
    });

    it('supports function-as-child pattern', () => {
        const {intl} = intlProvider.getChildContext();
        const num   = new Date();

        const el = (
            <FormattedNumber value={num}>
                {(formattedNumber) => (
                    <b>{formattedNumber}</b>
                )}
            </FormattedNumber>
        );

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <b>{intl.formatNumber(num)}</b>
        );
    });
});
