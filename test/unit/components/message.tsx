import * as React from 'react';
import FormattedMessage from '../../../src/components/message';
import IntlProvider, {
  Props,
  createIntl,
} from '../../../src/components/provider';
import {mountFormattedComponentWithProvider} from '../testUtils';
import {mount, shallow, render} from 'enzyme';
import {IntlShape} from '../../../src';

const mountWithProvider = mountFormattedComponentWithProvider(FormattedMessage);

const dummyContext = React.createContext('');
const {Provider: DummyProvider, Consumer: DummyConsumer} = dummyContext;

describe('<FormattedMessage>', () => {
  let providerProps: Props;
  let intl: IntlShape;

  beforeEach(() => {
    providerProps = {
      locale: 'en',
      defaultLocale: 'en',
    };
    intl = createIntl(providerProps);
    console.error = jest.fn();
  });

  it('has a `displayName`', () => {
    expect(FormattedMessage.displayName).toBeA('string');
  });

  it('should work with shallow enzyme', function() {
    const wrapper = shallow(
      <span>
        <FormattedMessage id="foo" />
      </span>,
      {
        wrappingComponent: IntlProvider,
        wrappingComponentProps: {locale: 'en', messages: {foo: 'hello foo'}},
      }
    );
    expect(wrapper.find(FormattedMessage).dive()).toMatchSnapshot();
    expect(
      wrapper
        .find(FormattedMessage)
        .dive()
        .dive()
    ).toMatchSnapshot();
  });
  it('should work with mount enzyme', function() {
    const wrapper = mount(
      <span>
        <FormattedMessage id="foo" />
      </span>,
      {
        wrappingComponent: IntlProvider,
        wrappingComponentProps: {locale: 'en', messages: {foo: 'hello foo'}},
      }
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('throws when <IntlProvider> is missing from ancestry and there is no defaultMessage', () => {
    expect(() => mount(<FormattedMessage id="foo" />)).toThrow(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
    );
  });

  it('should work if <IntlProvider> is missing from ancestry but there is defaultMessage', () => {
    const rendered = mount(
      <FormattedMessage id="hello" defaultMessage="Hello" />
    );

    expect(rendered.text()).toBe('Hello');
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('should work w/ multiple context', function() {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'hello world',
    };
    function Foo() {
      return (
        <DummyConsumer>{id => <FormattedMessage id={id} />}</DummyConsumer>
      );
    }
    const rendered = mount(
      <DummyProvider value={descriptor.id}>
        <Foo />
      </DummyProvider>,
      {
        wrappingComponent: IntlProvider,
        wrappingComponentProps: {
          locale: 'en',
          messages: {
            [descriptor.id]: descriptor.defaultMessage,
          },
        },
      }
    );

    expect(rendered.text()).toBe(intl.formatMessage(descriptor));
  });

  it('renders a formatted message in a <>', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, World!',
    };
    const rendered = mountWithProvider(descriptor, providerProps);

    expect(rendered.text()).toBe(intl.formatMessage(descriptor));
  });

  it('accepts `values` prop', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, {name}!',
    };
    const values = {name: 'Jest'};
    const rendered = mountWithProvider({...descriptor, values}, providerProps);

    expect(rendered.text()).toBe(intl.formatMessage(descriptor, values));
  });

  it('accepts string as `tagName` prop', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, World!',
    };
    const tagName = 'p';

    const rendered = mountWithProvider(
      {...descriptor, tagName},
      providerProps
    ).find('p');

    expect(rendered.type()).toBe(tagName);
  });

  it('accepts an react element as `tagName` prop', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, World!',
    };

    const H1 = ({children}) => <h1>{children}</h1>;
    const rendered = mountWithProvider(
      {...descriptor, tagName: H1},
      providerProps
    ).find(H1);

    expect(rendered.type()).toBe(H1);
    expect(rendered.text()).toBe(intl.formatMessage(descriptor));
  });

  it('supports function-as-child pattern', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, World!',
    };

    const spy = jest.fn().mockImplementation(() => <p>Jest</p>);

    const rendered = mountWithProvider(
      {...descriptor, children: spy},
      providerProps
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([intl.formatMessage(descriptor)]);

    expect(rendered.text()).toBe('Jest');
  });

  describe('rich text', function() {
    it('supports legacy behavior', () => {
      const rendered = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, {name}!',
          values: {
            name: <b>Jest</b>,
          },
        },
        providerProps
      );

      const nameNode = rendered.find('b');
      expect(nameNode.type()).toBe('b');
      expect(nameNode.text()).toBe('Jest');
    });
    it('supports rich-text message formatting', () => {
      const rendered = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, <b>{name}</b>!',
          values: {
            name: 'Jest',
            b: (name: string) => <b>{name}</b>,
          },
        },
        providerProps
      );

      const nameNode = rendered.find('b');
      expect(nameNode.type()).toBe('b');
      expect(nameNode.text()).toBe('Jest');
    });

    it('supports rich-text message formatting w/ nested tag', () => {
      const rendered = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, <b>{name}<i>!</i></b>',
          values: {
            name: 'Jest',
            b: (...chunks: any[]) => <b>{...chunks}</b>,
            i: (msg: string) => <i>{msg}</i>,
          },
        },
        providerProps
      );
      expect(rendered).toMatchSnapshot();
    });

    it('supports rich-text message formatting in function-as-child pattern', () => {
      const rendered = mountWithProvider(
        {
          id: 'hello',
          defaultMessage: 'Hello, {name}',
          values: {
            name: <b>Jest</b>,
          },
          children: (...chunks) => <strong>{chunks}</strong>,
        },
        providerProps
      );

      const nameNode = rendered.find('b');
      expect(nameNode.type()).toBe('b');
      expect(nameNode.text()).toBe('Jest');
    });
  });

  it('should re-render when `values` are different', () => {
    const descriptor = {
      id: 'hello',
      defaultMessage: 'Hello, {name}!',
    };
    const values = {
      name: 'Jest',
    };

    const spy = jest.fn().mockImplementation(() => null);
    const injectIntlContext = mountWithProvider(
      {
        ...descriptor,
        values,
        children: spy,
      },
      providerProps
    );

    expect(spy).toHaveBeenCalled();
    spy.mockClear();
    injectIntlContext.setProps({
      ...descriptor,
      values: {
        ...values, // create new object instance with same values to test shallow equality check
      },
    });
    expect(spy).not.toHaveBeenCalled();

    injectIntlContext.setProps({
      ...descriptor,
      values: {
        name: 'Enzyme',
      },
    });
    expect(spy).toHaveBeenCalled();
  });
});
