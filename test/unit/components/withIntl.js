import expect, {spyOn} from 'expect';
import React from 'react';
import {mount} from 'enzyme';
import {intlShape} from '../../../src/types';
import IntlProvider from '../../../src/components/provider'
import withIntl from '../../../src/components/withIntl';

const mountWithProvider = (el) => mount(
  <IntlProvider locale='en'>
    { el }
  </IntlProvider>
)

describe('withIntl()', () => {
    let Wrapped;
    let rendered;

    beforeEach(() => {
        Wrapped = () => <div />;
        Wrapped.displayName = 'Wrapped';
        Wrapped.propTypes = {
            intl: intlShape.isRequired,
        };
        Wrapped.someNonReactStatic = {
            foo: true
        };
        rendered = null;
    });

    afterEach(() => {
      rendered && rendered.unmount();
    })

    it('allows introspection access to the wrapped component', () => {
        expect(withIntl(Wrapped).WrappedComponent).toBe(Wrapped);
    });

    it('hoists non-react statics',() => {
        expect(withIntl(Wrapped).someNonReactStatic.foo).toBe(true)
    })

    describe('displayName', () => {
        it('is descriptive by default', () => {
            expect(withIntl(() => null).displayName).toBe('withIntl(Component)');
        });

        it('includes `WrappedComponent`\'s `displayName`', () => {
            Wrapped.displayName = 'Foo';
            expect(withIntl(Wrapped).displayName).toBe('withIntl(Foo)');
        });
    });

    it('throws when <IntlProvider> is missing from ancestry', () => {
        const Injected = withIntl(Wrapped);

        const consoleError = spyOn(console, 'error'); // surpress console error from JSDom
        expect(() => rendered = mount(<Injected />)).toThrow(
            '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
        consoleError.restore();
    });

    it('renders <WrappedComponent> with `intl` prop', () => {
        const Injected = withIntl(Wrapped);

        rendered = mountWithProvider(<Injected />);
        const intlProvider = rendered.find(IntlProvider).childAt(0);
        const wrappedComponent = rendered.find(Wrapped);

        expect(
          wrappedComponent.prop('intl')
        ).toBe(intlProvider.instance().getContext());
    });

    it('propagates all props to <WrappedComponent>', () => {
        const Injected = withIntl(Wrapped);
        const props = {
          foo: 'bar'
        }

        rendered = mountWithProvider(<Injected {...props} />);
        const wrappedComponent = rendered.find(Wrapped);

        Object.keys(props).forEach((key) => {
          expect(wrappedComponent.prop(key)).toBe(props[key]);
        })
    });

    describe('options', () => {
        describe('intlPropName', () => {
            it('sets <WrappedComponent>\'s `props[intlPropName]` to `context.intl`', () => {
                const propName = 'myIntl';
                Wrapped.propTypes = {
                  [propName]: intlShape.isRequired
                };
                const Injected = withIntl(Wrapped, {
                  intlPropName: propName
                });

                rendered = mountWithProvider(<Injected />);
                const intlProvider = rendered.find(IntlProvider).childAt(0);
                const wrapped = rendered.find(Wrapped);

                expect(wrapped.prop(propName)).toBe(
                  intlProvider.instance().getContext()
                );
            });
        });

        describe('withRef', () => {
            it('throws when `false` and getWrappedInstance() is called', () => {
                const Injected = withIntl(Wrapped);

                rendered = mountWithProvider(<Injected />);
                const wrapper = rendered.find(Injected);

                expect(() => wrapper.instance().getWrappedInstance()).toThrow(
                    '[React Intl] To access the wrapped instance, the `{withRef: true}` option must be set when calling: `withIntl()`'
                );
            });

            it('does not throw when `true` getWrappedInstance() is called', () => {
              Wrapped = class extends React.Component {
                render () {
                  return null
                }
              }

              const Injected = withIntl(Wrapped, { withRef: true });

              rendered = mountWithProvider(<Injected />);
              const wrapper = rendered.find(Injected);
              const wrapped = rendered.find(Wrapped);

                expect(() => wrapper.instance().getWrappedInstance())
                  .toNotThrow();
                expect(wrapper.instance().getWrappedInstance())
                  .toBe(wrapped.instance());
            });
        });
    });
});
