import * as expect from 'expect'
import {spyOn} from 'expect';
import * as React from 'react';
import {mount} from 'enzyme';
import {intlShape} from '../../../src/types';
import IntlProvider from '../../../src/components/provider';
import withIntl from '../../../src/components/withIntl';

const mountWithProvider = el =>
  mount(<IntlProvider locale="en">{el}</IntlProvider>);

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
      foo: true,
    };
    rendered = null;
  });

  afterEach(() => {
    rendered && rendered.unmount();
  });

  it('allows introspection access to the wrapped component', () => {
    expect(withIntl(Wrapped).WrappedComponent).toBe(Wrapped);
  });

  it('hoists non-react statics', () => {
    expect(withIntl(Wrapped).someNonReactStatic.foo).toBe(true);
  });

  describe('displayName', () => {
    it('is descriptive by default', () => {
      expect(withIntl(() => null).displayName).toBe('withIntl(Component)');
    });

    it("includes `WrappedComponent`'s `displayName`", () => {
      Wrapped.displayName = 'Foo';
      expect(withIntl(Wrapped).displayName).toBe('withIntl(Foo)');
    });
  });

  it('throws when <IntlProvider> is missing from ancestry', () => {
    const Injected = withIntl(Wrapped);

    const consoleError = spyOn(console, 'error'); // surpress console error from JSDom
    expect(() => (rendered = mount(<Injected />))).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
    consoleError.restore();
  });

  it('renders <WrappedComponent> with `intl` prop', () => {
    const Injected = withIntl(Wrapped);

    rendered = mountWithProvider(<Injected />);
    const wrappedComponent = rendered.find(Wrapped);
    // React 16 renders different in the wrapper
    const intlProvider = rendered.find(IntlProvider).childAt(0);

    expect(wrappedComponent.prop('intl')).toBe(
      intlProvider.instance().getContext()
    );
  });

  it('propagates all props to <WrappedComponent>', () => {
    const Injected = withIntl(Wrapped);
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
        Wrapped.propTypes = {
          [propName]: intlShape.isRequired,
        };
        const Injected = withIntl(Wrapped, {
          intlPropName: propName,
        });

        rendered = mountWithProvider(<Injected />);
        const wrapped = rendered.find(Wrapped);
        const intlProvider = rendered.find(IntlProvider).childAt(0);

        expect(wrapped.prop(propName)).toBe(
          intlProvider.instance().getContext()
        );
      });
    });

    describe('withRef', () => {
      it('throws when true', () => {
        expect(() => withIntl(Wrapped, {withRef: true})).toThrow(
          '[React Intl] withRef and getWrappedInstance() are deprecated, ' +
            "instead use the 'forwardRef' option and create a ref directly on the wrapped component."
        );
      });
    });

    describe('forwardRef', () => {
      it("doesn't forward the ref when forwardRef is `false`", () => {
        const Injected = withIntl(Wrapped);
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
        const Injected = withIntl(Wrapped, {forwardRef: true});
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
      const customWithIntl = withIntl({
        forwardRef: true,
        intlPropName: propName,
      });
      const wrapperRef = React.createRef();
      const Injected = customWithIntl(Wrapped);

      rendered = mountWithProvider(<Injected ref={wrapperRef} />);
      const wrapped = rendered.find(Wrapped);

      expect(wrapperRef.current).toBe(wrapped.instance());

      const intlProvider = rendered.find(IntlProvider).childAt(0);

      expect(wrapped.prop(propName)).toBe(intlProvider.instance().getContext());
    });
  });
});
