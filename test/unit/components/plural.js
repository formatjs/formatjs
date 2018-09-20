import expect, {spyOn} from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from '../../react-compat';
import IntlProvider from '../../../src/components/provider';
import FormattedPlural from '../../../src/components/plural';

expect.extend(expectJSX);

describe('<FormattedPlural>', () => {
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
        expect(FormattedPlural.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        expect(() => renderer.render(<FormattedPlural />)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('renders an empty <span> when no `other` prop is provided', () => {
        const {intl} = intlProvider.getChildContext();

        renderer.render(<FormattedPlural />, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(<span />);

        renderer.render(<FormattedPlural value={1} />, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(<span />);
    });

    it('renders `other` in a <span> when no `value` prop is provided', () => {
        renderer.render(<FormattedPlural other="foo" />, intlProvider.getChildContext());
        expect(renderer.getRenderOutput()).toEqualJSX(<span>foo</span>);
    });

    it('renders a formatted plural in a <span>', () => {
        const {intl} = intlProvider.getChildContext();
        const num = 1;

        const el = <FormattedPlural value={num} one="foo" other="bar" />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{el.props[intl.formatPlural(num)]}</span>
        );
    });

    it('should not re-render when props and context are the same', () => {
        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedPlural value={0} other="foo" />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedPlural value={0} other="foo" />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toBe(renderedTwo);
    });

    it('should re-render when props change', () => {
        renderer.render(<FormattedPlural value={0} one="foo" other="bar" />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        renderer.render(<FormattedPlural value={1} one="foo" other="bar" />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('should re-render when context changes', () => {
        intlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(<FormattedPlural value={0} other="foo" />, intlProvider.getChildContext());
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en-US'}, {});
        renderer.render(<FormattedPlural value={0} other="foo" />, intlProvider.getChildContext());
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('accepts valid IntlPluralFormat options as props', () => {
        const {intl} = intlProvider.getChildContext();
        const num = 22;
        const options = {style: 'ordinal'};

        const el = <FormattedPlural value={num} two="nd" {...options} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{el.props[intl.formatPlural(num, options)]}</span>
        );
    });

    it('supports function-as-child pattern', () => {
        const {intl} = intlProvider.getChildContext();
        const num = 1;

        const el = (
            <FormattedPlural value={num} one="foo">
                {(formattedPlural) => (
                    <b>{formattedPlural}</b>
                )}
            </FormattedPlural>
        );

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <b>{el.props[intl.formatPlural(num)]}</b>
        );
    });
});
