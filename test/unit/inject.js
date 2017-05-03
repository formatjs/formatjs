import expect from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from '../react-compat';
import {intlShape} from '../../src/types';
import IntlProvider from '../../src/components/provider';
import injectIntl from '../../src/inject';

expect.extend(expectJSX);

describe('injectIntl()', () => {
    let Wrapped;
    let renderer;
    let intlProvider;

    beforeEach(() => {
        Wrapped = () => <div />;
        Wrapped.displayName = 'Wrapped';
        Wrapped.propTypes = {
            intl: intlShape.isRequired,
        };

        renderer     = createRenderer();
        intlProvider = new IntlProvider({locale: 'en'}, {});
    });

    it('allows introspection access to the wrapped component', () => {
        expect(injectIntl(Wrapped).WrappedComponent).toBe(Wrapped);
    });

    describe('displayName', () => {
        it('is descriptive by default', () => {
            expect(injectIntl(() => null).displayName).toBe('InjectIntl(Component)');
        });

        it('includes `WrappedComponent`\'s `displayName`', () => {
            Wrapped.displayName = 'Foo';
            expect(injectIntl(Wrapped).displayName).toBe('InjectIntl(Foo)');
        });
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        const Injected = injectIntl(Wrapped);

        expect(() => renderer.render(<Injected />)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
    });

    it('renders <WrappedComponent> with `intl` prop', () => {
        const Injected = injectIntl(Wrapped);
        const {intl} = intlProvider.getChildContext();

        renderer.render(<Injected />, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(<Wrapped intl={intl} />);
    });

    it('propagates all props to <WrappedComponent>', () => {
        const Injected = injectIntl(Wrapped);
        const {intl} = intlProvider.getChildContext();

        renderer.render(<Injected foo="foo" />, {intl});
        expect(renderer.getRenderOutput()).toEqualJSX(<Wrapped foo="foo" intl={intl} />);
    });

    describe('options', () => {
        describe('intlPropName', () => {
            it('sets <WrappedComponent>\'s `props[intlPropName]` to `context.intl`', () => {
                Wrapped.propTypes = {myIntl: intlShape.isRequired};
                const Injected = injectIntl(Wrapped, {intlPropName: 'myIntl'});
                const {intl} = intlProvider.getChildContext();

                renderer.render(<Injected />, {intl});
                expect(renderer.getRenderOutput()).toEqualJSX(<Wrapped myIntl={intl} />);
            });
        });

        describe('withRef', () => {
            it('throws when `false` and getWrappedInstance() is called', () => {
                const Injected = injectIntl(Wrapped);
                const instance = new Injected({}, intlProvider.getChildContext());

                expect(() => instance.getWrappedInstance()).toThrow(
                    '[React Intl] To access the wrapped instance, the `{withRef: true}` option must be set when calling: `injectIntl()`'
                );
            });

            it('does not throw when `true` getWrappedInstance() is called', () => {
                const Injected = injectIntl(Wrapped, {withRef: true});
                const instance = new Injected({}, intlProvider.getChildContext());

                expect(() => instance.getWrappedInstance()).toNotThrow();
            });
        });
    });
});
