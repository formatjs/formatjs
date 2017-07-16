import expect, {spyOn} from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from '../../react-compat';
import IntlProvider from '../../../src/components/provider';
import FormattedMessage from '../../../src/components/message';

expect.extend(expectJSX);

describe('<FormattedMessage>', () => {
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
        expect(FormattedMessage.displayName).toBeA('string');
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        expect(() => renderer.render(<FormattedMessage />)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('renders a formatted message in a <span>', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, World!',
        };

        const el = <FormattedMessage {...descriptor} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatMessage(descriptor)}</span>
        );
    });

    it('should not cause a unique "key" prop warning', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, {name}!',
        };

        const el = <FormattedMessage {...descriptor} values={{name: <b>Eric</b>}} />;

        renderer.render(el, {intl});
        expect(consoleError.calls.length).toBe(0);
    });

    it('should not cause a prop warning when description is a string', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            description: 'Greeting',
            defaultMessage: 'Hello, {name}!',
        };

        const el = <FormattedMessage {...descriptor} values={{name: <b>Eric</b>}} />;

        renderer.render(el, {intl});
        expect(consoleError.calls.length).toBe(0);
    });

    it('should not cause a prop warning when description is an object', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            description: {
                text: 'Greeting',
                ticket: 'GTP-1234',
            },
            defaultMessage: 'Hello, {name}!',
        };

        const el = <FormattedMessage {...descriptor} values={{name: <b>Eric</b>}} />;

        renderer.render(el, {intl});
        expect(consoleError.calls.length).toBe(0);
    });

    it('should not re-render when props and context are the same', () => {
        intlProvider = new IntlProvider({locale: 'en', defaultLocale: 'en'}, {});
        renderer.render(
            <FormattedMessage id="hello" defaultMessage="Hello, World!" />,
            intlProvider.getChildContext()
        );
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en', defaultLocale: 'en'}, {});
        renderer.render(
            <FormattedMessage id="hello" defaultMessage="Hello, World!" />,
            intlProvider.getChildContext()
        );
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toBe(renderedTwo);
    });

    it('should re-render when props change', () => {
        renderer.render(
            <FormattedMessage id="hello" defaultMessage="Hello, World!" />,
            intlProvider.getChildContext()
        );
        const renderedOne = renderer.getRenderOutput();

        renderer.render(
            <FormattedMessage id="hello" defaultMessage="Hello, Galaxy!" />,
            intlProvider.getChildContext()
        );
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('should re-render when context changes', () => {
        intlProvider = new IntlProvider({locale: 'en', defaultLocale: 'en'}, {});
        renderer.render(
            <FormattedMessage id="hello" defaultMessage="Hello, World!" />,
            intlProvider.getChildContext()
        );
        const renderedOne = renderer.getRenderOutput();

        intlProvider = new IntlProvider({locale: 'en-US', defaultLocale: 'en-US'}, {});
        renderer.render(
            <FormattedMessage id="hello" defaultMessage="Hello, World!" />,
            intlProvider.getChildContext()
        );
        const renderedTwo = renderer.getRenderOutput();

        expect(renderedOne).toNotBe(renderedTwo);
    });

    it('accepts `values` prop', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, {name}!',
        };
        const values = {name: 'Eric'};

        const el = <FormattedMessage {...descriptor} values={values} />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <span>{intl.formatMessage(descriptor, values)}</span>
        );
    });

    it('should re-render when `values` are different', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, {name}!',
        };

        renderer.render(<FormattedMessage {...descriptor} values={{name: 'Eric'}} />, {intl});
        const renderedOne = renderer.getRenderOutput();

        renderer.render(<FormattedMessage {...descriptor} values={{name: 'Eric'}} />, {intl});
        const renderedTwo = renderer.getRenderOutput();

        renderer.render(<FormattedMessage {...descriptor} values={{name: 'Marissa'}} />, {intl});
        const renderedThree = renderer.getRenderOutput();

        expect(renderedOne).toBe(renderedTwo);
        expect(renderedThree).toNotBe(renderedOne);
    });

    it('accepts `tagName` prop', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, World!',
        };

        const el = <FormattedMessage {...descriptor} tagName="p" />;

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <p>{intl.formatMessage(descriptor)}</p>
        );
    });

    it('supports function-as-child pattern', () => {
        const {intl} = intlProvider.getChildContext();
        const descriptor = {
            id: 'hello',
            defaultMessage: 'Hello, World!',
        };

        const el = (
            <FormattedMessage {...descriptor}>
                {(formattedMessage) => (
                    <b>{formattedMessage}</b>
                )}
            </FormattedMessage>
        );

        renderer.render(el, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(
            <b>{intl.formatMessage(descriptor)}</b>
        );
    });

    it('supports rich-text message formatting', () => {
        const {intl} = intlProvider.getChildContext();

        const el = (
            <FormattedMessage
                id="hello"
                defaultMessage="Hello, {name}!"
                values={{
                    name: <b>Eric</b>,
                }}
            />
        );

        renderer.render(el, {intl});
        const rendered = renderer.getRenderOutput();

        expect(rendered.props.children).toBeAn('array');
        expect(rendered).toEqualJSX(
            <span>Hello, <b>Eric</b>!</span>
        );
    });

    it('supports rich-text message formatting in function-as-child pattern', () => {
        const {intl} = intlProvider.getChildContext();

        const el = (
            <FormattedMessage
                id="hello"
                defaultMessage="Hello, {name}!"
                values={{
                    name: <b>Prem</b>,
                }}
            >
                {(...formattedMessage) => (
                    <strong>{formattedMessage}</strong>
                )}

            </FormattedMessage>
        );

        renderer.render(el, {intl});
        const rendered = renderer.getRenderOutput();

        expect(rendered.props.children).toBeAn('array');
        expect(rendered).toEqualJSX(
            <strong>Hello, <b>Prem</b>!</strong>
        );
    });
});
