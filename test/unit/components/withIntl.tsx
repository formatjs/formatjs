import * as React from 'react';
import {mount} from 'enzyme';
import IntlProvider from '../../../src/components/provider';
import injectIntl from '../../../src/components/injectIntl';

const mountWithProvider = el =>
  mount(<IntlProvider locale="en">{el}</IntlProvider>);

describe('injectIntl()', () => {
  let Wrapped;
  let rendered;

  beforeEach(() => {
    Wrapped = () => <div />;
    Wrapped.displayName = 'Wrapped';
    Wrapped.someNonReactStatic = {
      foo: true,
    };
    rendered = null;
  });

  afterEach(() => {
    rendered && rendered.unmount();
  });

  it('allows introspection access to the wrapped component', () => {
    expect(injectIntl(Wrapped).WrappedComponent).toBe(Wrapped);
  });

  it('hoists non-react statics', () => {
    expect((injectIntl(Wrapped) as any).someNonReactStatic.foo).toBe(true);
  });

  describe('displayName', () => {
    it('is descriptive by default', () => {
      expect(injectIntl(() => null).displayName).toBe('injectIntl(Component)');
    });

    it("includes `WrappedComponent`'s `displayName`", () => {
      Wrapped.displayName = 'Foo';
      expect(injectIntl(Wrapped).displayName).toBe('injectIntl(Foo)');
    });
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    const Injected = injectIntl(Wrapped);

    const consoleError = jest.spyOn(console, 'error'); // surpress console error from JSDom
    expect(() => (rendered = mount(<Injected />))).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
    consoleError.mockRestore();
  });

  it('renders <WrappedComponent> with `intl` prop', () => {
    const Injected = injectIntl(Wrapped);

    rendered = mountWithProvider(<Injected />);
    const wrappedComponent = rendered.find(Wrapped);
    // React 16 renders different in the wrapper
    const intl = rendered.state('intl');

    expect(wrappedComponent.prop('intl')).toBe(intl);
  });

  it('propagates all props to <WrappedComponent>', () => {
    const Injected = injectIntl(Wrapped) as any;
    const props = {
      foo: 'bar',
    };

    rendered = mountWithProvider(<Injected {...props} />);
    const wrappedComponent = rendered.find(Wrapped);

    Object.keys(props).forEach(key => {
      expect(wrappedComponent.prop(key)).toBe(props[key]);
    });
  });

  describe('options', () => {
    describe('intlPropName', () => {
      it("sets <WrappedComponent>'s `props[intlPropName]` to `context.intl`", () => {
        const propName = 'myIntl';
        const Injected = injectIntl(Wrapped, {
          intlPropName: propName,
        });

        rendered = mountWithProvider(<Injected />);
        const wrapped = rendered.find(Wrapped);
        const intl = rendered.state('intl');

        expect(wrapped.prop(propName)).toBe(intl);
      });
    });

    describe('forwardRef', () => {
      it("doesn't forward the ref when forwardRef is `false`", () => {
        const Injected = injectIntl(Wrapped) as any;
        const wrapperRef = React.createRef();

        rendered = mountWithProvider(<Injected ref={wrapperRef} />);
        const wrapper = rendered.find(Injected);

        expect(wrapperRef.current).toBe(wrapper.instance());
      });

      it('forwards the ref properly to the wrapped component', () => {
        Wrapped = class extends React.Component {
          render() {
            return null;
          }
        };
        const Injected = injectIntl(Wrapped, {forwardRef: true}) as any;
        const wrapperRef = React.createRef();

        rendered = mountWithProvider(<Injected ref={wrapperRef} />);
        const wrapped = rendered.find(Wrapped);

        expect(wrapperRef.current).toBe(wrapped.instance());
      });
    });

    it('can also be used with a bound function', () => {
      Wrapped = class extends React.Component {
        render() {
          return null;
        }
      };
      const propName = 'myPropName';
      const wrapperRef = React.createRef();
      const Injected = injectIntl(Wrapped, {
        forwardRef: true,
        intlPropName: propName,
      }) as any;

      rendered = mountWithProvider(<Injected ref={wrapperRef} />);
      const wrapped = rendered.find(Wrapped);

      expect(wrapperRef.current).toBe(wrapped.instance());

      const intl = rendered.state('intl');

      expect(wrapped.prop(propName)).toBe(intl);
    });
  });
});
