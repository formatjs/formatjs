import expect, {spyOn} from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from '../../react-compat';
import IntlProvider from '../../../src/components/provider';
import FormattedHTMLMessage from '../../../src/components/html-message';

expect.extend(expectJSX);

describe('<FormattedHTMLMessage>', () => {
    let consoleError;
    let renderer;
    let intlProvider;

    beforeEach(() => {
        consoleError = spyOn(console, 'error');
        renderer     = createRenderer();
        intlProvider = new IntlProvider({
            locale       : 'en',
            defaultLocale: 'en',
        }, {});
    });

    afterEach(() => {
        consoleError.restore();
    });

    it('has a `displayName`', () => {
        expect(FormattedHTMLMessage.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        expect(() => renderer.render(<FormattedHTMLMessage />)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('renders a formatted HTML message in a <span>', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, <b>World</b>!',
        };

        const el = <FormattedHTMLMessage {...descriptor} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span
                dangerouslySetInnerHTML={{
                    __html: intl.formatHTMLMessage(descriptor),
                }}
            />
        );
    });

    it('should not re-render when props and context are the same', () => {
        intlProvider = new IntlProvider({locale: 'en', defaultLocale: 'en'}, {});
        renderer.render(
            <FormattedHTMLMessage id="hello" defaultMessage="Hello, <b>World</b>!" />,
            intlProvider.getChildContext()
        );
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en', defaultLocale: 'en'}, {});
        renderer.render(
            <FormattedHTMLMessage id="hello" defaultMessage="Hello, <b>World</b>!" />,
            intlProvider.getChildContext()
        );
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toBe(renderedTwo);
    });

    it('should re-render when props change', () => {
        renderer.render(
            <FormattedHTMLMessage id="hello" defaultMessage="Hello, <b>World</b>!" />,
            intlProvider.getChildContext()
        );
        const renderedOne = renderer.getRenderOutput();

        renderer.render(
            <FormattedHTMLMessage id="hello" defaultMessage="Hello, <b>Galaxy</b>!" />,
            intlProvider.getChildContext()
        );
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('should re-render when context changes', () => {
        intlProvider = new IntlProvider({locale: 'en', defaultLocale: 'en'}, {});
        renderer.render(
            <FormattedHTMLMessage id="hello" defaultMessage="Hello, <b>World</b>!" />,
            intlProvider.getChildContext()
        );
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en-US', defaultLocale: 'en-US'}, {});
        renderer.render(
            <FormattedHTMLMessage id="hello" defaultMessage="Hello, <b>World</b>!" />,
            intlProvider.getChildContext()
        );
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('accepts `values` prop', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, <b>{name}</b>!',
        };
        const values = {name: 'Eric'};

        const el = <FormattedHTMLMessage {...descriptor} values={values} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span
                dangerouslySetInnerHTML={{
                    __html: intl.formatHTMLMessage(descriptor, values),
                }}
            />
        );
    });

    it('should re-render when `values` are different', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, <b>{name}</b>!',
        };

        renderer.render(<FormattedHTMLMessage {...descriptor} values={{name: 'Eric'}} />, {intl});
        const renderedOne = renderer.getRenderOutput();

        renderer.render(<FormattedHTMLMessage {...descriptor} values={{name: 'Eric'}} />, {intl});
        const renderedTwo = renderer.getRenderOutput();

        renderer.render(<FormattedHTMLMessage {...descriptor} values={{name: 'Marissa'}} />, {intl});
        const renderedThree = renderer.getRenderOutput();

        expect(renderedOne).toBe(renderedTwo);
        expect(renderedThree).toNotBe(renderedOne);
    });

    it('should HTML-escape `vlaues`', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, <b>{name}</b>!',
        };
        const values = {name: '<i>Eric</i>'};

        const el = <FormattedHTMLMessage {...descriptor} values={values} />;

        renderer.render(el, {intl});
        const rendered = renderer.getRenderOutput();

        expect(rendered.props.dangerouslySetInnerHTML.__html).toBe(
            'Hello, <b>&lt;i&gt;Eric&lt;/i&gt;</b>!'
        );
        expect(rendered).toEqualJSX(
            <span
                dangerouslySetInnerHTML={{
                    __html: intl.formatHTMLMessage(descriptor, values),
                }}
            />
        );
    });

    it('accepts `tagName` prop', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, <b>World</b>!',
        };

        const el = <FormattedHTMLMessage {...descriptor} tagName="p" />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <p
                dangerouslySetInnerHTML={{
                    __html: intl.formatHTMLMessage(descriptor),
                }}
            />
        );
    });

    it('supports function-as-child pattern', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, <b>World</b>!',
        };

        const el = (
            <FormattedHTMLMessage {...descriptor}>
                {(formattedHTMLMessage) => (
                    <i dangerouslySetInnerHTML={{__html: formattedHTMLMessage}} />
                )}
            </FormattedHTMLMessage>
        );

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <i
                dangerouslySetInnerHTML={{
                    __html: intl.formatHTMLMessage(descriptor),
                }}
            />
        );
    });

    it('does not support rich-text message formatting', () => {
        const {intl} = intlProvider.getChildContext();

        const el = (
            <FormattedHTMLMessage
                id="hello"
                defaultMessage="Hello, <b>{name}</b>!"
                values={{
                    name: <i>Eric</i>,
                }}
            />
        );

        renderer.render(el, {intl});
        const rendered = renderer.getRenderOutput();

        expect(rendered).toEqualJSX(
            <span
                dangerouslySetInnerHTML={{
                    __html: 'Hello, <b>[object Object]</b>!',
                }}
            />
        );
    });
});
