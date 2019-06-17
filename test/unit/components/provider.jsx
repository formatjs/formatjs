import * as React from 'react';
import {mount} from 'enzyme';
import {makeMockContext, shallowDeep, SpyComponent} from '../testUtils';
import IntlProvider from '../../../src/components/provider';

const mockContext = makeMockContext(
  require.resolve('../../../src/components/provider')
);

const getIntlContext = el => {
  const provider = shallowDeep(el, 2).first();
  return provider.prop('value');
};

describe('<IntlProvider>', () => {
  const now = Date.now();

  const INTL_CONFIG_PROP_NAMES = [
    'locale',
    'timeZone',
    'formats',
    'textComponent',
    'messages',
    'defaultLocale',
    'defaultFormats',
    'onError',
  ];
  const INTL_FORMAT_PROP_NAMES = [
    'formatDate',
    'formatTime',
    'formatRelative',
    'formatNumber',
    'formatPlural',
    'formatMessage',
    'formatHTMLMessage',
  ];

  const Child = () => null;

  let consoleError;
  let dateNow;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error');
    dateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    consoleError.mockRestore();
    dateNow.mockRestore();
  });

  it('has a `displayName`', () => {
    expect(IntlProvider.displayName).toBeA('string');
  });

  it('throws when no `children`', () => {
    const IntlProvider = mockContext(null, false);

    expect(() => shallowDeep(<IntlProvider />, 2)).toThrow();
  });

  it('throws when more than one `children`', () => {
    const IntlProvider = mockContext(null, false);
    const el = (
      <IntlProvider>
        <Child />
        <Child />
      </IntlProvider>
    );

    expect(() => shallowDeep(el, 2)).toThrow();
  });

  it('warns when no `locale` prop is provided', () => {
    const IntlProvider = mockContext(null, false);
    const el = (
      <IntlProvider>
        <Child />
      </IntlProvider>
    );

    shallowDeep(el, 2);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain(
      '[React Intl] Missing locale data for locale: "undefined". Using default locale: "en" as fallback.'
    );
  });

  it('warns when `locale` prop provided has no locale data', () => {
    const IntlProvider = mockContext(null, false);
    const el = (
      <IntlProvider locale="missing">
        <Child />
      </IntlProvider>
    );

    const {locale} = el.props;

    shallowDeep(el, 2);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain(
      `[React Intl] Missing locale data for locale: "${locale}". Using default locale: "en" as fallback.`
    );
  });

  it('renders its `children`', () => {
    const IntlProvider = mockContext(null, false);
    const el = (
      <IntlProvider locale="en">
        <Child />
      </IntlProvider>
    );

    const rendered = shallowDeep(el, 2);
    expect(rendered.children().length).toBe(1);
    expect(rendered.children().contains(<Child />)).toBe(true);
  });

  it('provides `context.intl` with values from intl config props', () => {
    const IntlProvider = mockContext(null, false);
    const props = {
      locale: 'fr-FR',
      timeZone: 'UTC',
      formats: {},
      messages: {},
      textComponent: 'span',

      defaultLocale: 'en-US',
      defaultFormats: {},

      onError: consoleError,
    };

    const el = (
      <IntlProvider {...props}>
        <Child />
      </IntlProvider>
    );

    const intl = getIntlContext(el);

    INTL_CONFIG_PROP_NAMES.forEach(propName => {
      expect(intl[propName]).toBe(props[propName]);
    });
  });

  it('provides `context.intl` with timeZone from intl config props when it is specified', () => {
    const IntlProvider = mockContext(null, false);
    const props = {
      timeZone: 'Europe/Paris',
    };

    const el = (
      <IntlProvider {...props}>
        <Child />
      </IntlProvider>
    );

    const intl = getIntlContext(el);

    expect(intl.timeZone).toBe('Europe/Paris');
  });

  it('provides `context.intl` with values from `defaultProps` for missing or undefined props', () => {
    const IntlProvider = mockContext(null, false);
    const props = {
      locale: 'en-US',
      defaultLocale: undefined,
    };

    const el = (
      <IntlProvider {...props}>
        <Child />
      </IntlProvider>
    );

    const intl = getIntlContext(el);

    expect(intl.defaultLocale).not.toBe(undefined);
    expect(intl.defaultLocale).toBe('en');
    expect(intl.messages).not.toBe(undefined);
    expect(intl.messages).toBeAn('object');
  });

  it('provides `context.intl` with format methods bound to intl config props', () => {
    const IntlProvider = mockContext(null, false);
    const el = (
      <IntlProvider
        locale="en"
        formats={{
          date: {
            'year-only': {
              year: 'numeric',
            },
          },
        }}
      >
        <Child />
      </IntlProvider>
    );

    const intl = getIntlContext(el);

    INTL_FORMAT_PROP_NAMES.forEach(propName => {
      expect(intl[propName]).toBeDefined();
      expect(intl[propName]).toBeA('function');
    });

    const date = new Date();
    const df = new Intl.DateTimeFormat('en', {year: 'numeric'});

    expect(intl.formatDate(date, {format: 'year-only'})).toBe(df.format(date));
  });

  it('inherits from an <IntlProvider> ancestor', () => {
    let IntlProvider = mockContext(null, false);
    const props = {
      locale: 'en',
      timeZone: 'UTC',
      formats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },
      messages: {
        hello: 'Hello, World!',
      },
      textComponent: 'span',

      defaultLocale: 'fr',
      defaultFormats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },

      onError: consoleError,
    };

    const parentContext = getIntlContext(
      <IntlProvider {...props}>
        <Child />
      </IntlProvider>
    );

    IntlProvider = mockContext(parentContext);
    const el = (
      <IntlProvider>
        <Child />
      </IntlProvider>
    );

    const intl = getIntlContext(el);

    expect(consoleError).toHaveBeenCalledTimes(0);

    INTL_CONFIG_PROP_NAMES.forEach(propName => {
      expect(intl[propName]).toBe(props[propName]);
    });
  });

  it('shadows inherited intl config props from an <IntlProvider> ancestor', () => {
    let IntlProvider = mockContext(null, false);
    const props = {
      locale: 'en',
      timeZone: 'Australia/Adelaide',
      formats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },
      messages: {
        hello: 'Hello, World!',
      },

      defaultLocale: 'fr',
      defaultFormats: {
        date: {
          'year-only': {
            year: 'numeric',
          },
        },
      },
    };

    const parentContext = getIntlContext(
      <IntlProvider {...props}>
        <Child />
      </IntlProvider>
    );

    IntlProvider = mockContext(parentContext);
    const el = (
      <IntlProvider
        locale="fr"
        timeZone="Atlantic/Azores"
        formats={{}}
        messages={{}}
        defaultLocale="en"
        defaultFormats={{}}
        textComponent="span"
      >
        <Child />
      </IntlProvider>
    );

    const intl = getIntlContext(el);

    expect(consoleError).toHaveBeenCalledTimes(0);

    INTL_CONFIG_PROP_NAMES.forEach(propName => {
      expect(intl[propName]).not.toBe(props[propName]);
    });
  });

  it('should not re-render when props and context are the same', () => {
    let IntlProvider = mockContext(null, false);
    const parentContext = getIntlContext(
      <IntlProvider locale="en">
        <Child />
      </IntlProvider>
    );

    IntlProvider = mockContext(parentContext);
    const el = (
      <IntlProvider>
        <SpyComponent />
      </IntlProvider>
    );

    const intlProvider = mount(el);
    intlProvider.setProps({}); // set props in order to test wether it rerenders
    intlProvider.instance().mockContext(parentContext); // mock context with same value to see if it rerenders

    const spy = intlProvider.find(SpyComponent).instance();
    expect(spy.getRenderCount()).toBe(1);
  });

  it('should re-render when props change', () => {
    let IntlProvider = mockContext(null, false);
    const Child = jest.fn().mockImplementation(() => null);
    const parentContext = getIntlContext(
      <IntlProvider locale="en">
        <Child />
      </IntlProvider>
    );

    IntlProvider = mockContext(parentContext);

    const intlProvider = mount(
      <IntlProvider locale="en">
        <SpyComponent />
      </IntlProvider>
    );
    intlProvider.setProps({
      locale: 'en-US',
    });

    const spy = intlProvider.find(SpyComponent).instance();
    expect(spy.getRenderCount()).toBe(2);
  });

  it('should re-render when context changes', () => {
    let IntlProvider = mockContext(null, false);
    const Child = jest.fn().mockImplementation(() => null);
    const initialParentContext = getIntlContext(
      <IntlProvider locale="en">
        <Child />
      </IntlProvider>
    );
    const changedParentContext = getIntlContext(
      <IntlProvider locale="en-US">
        <Child />
      </IntlProvider>
    );

    IntlProvider = mockContext(initialParentContext);

    const el = (
      <IntlProvider>
        <SpyComponent />
      </IntlProvider>
    );

    const intlProvider = mount(el);
    intlProvider.instance().mockContext(changedParentContext);

    const spy = intlProvider.find(SpyComponent).instance();
    expect(spy.getRenderCount()).toBe(2);
  });

  it('accepts `initialNow` prop', () => {
    const IntlProvider = mockContext(null, false);
    const initialNow = 1234;

    // doing this to get the actual "now" at render time
    const Child = (
      {intl} // mocked provider injects context as 'intl' into children
    ) => <div>{intl.now()}</div>;

    const el = (
      <IntlProvider locale="en" initialNow={initialNow}>
        <Child />
      </IntlProvider>
    );

    // can't do shallow rendering as this first mounts the Provider and then the children, bypassing initialNow
    const now = +mount(el)
      .find(Child)
      .text();
    expect(now).toBe(initialNow);
  });

  it('defaults `initialNow` to `Date.now()`', () => {
    const IntlProvider = mockContext(null, false);
    const Child = (
      {intl} // see above
    ) => <div>{intl.now()}</div>;

    const el = (
      <IntlProvider locale="en">
        <Child />
      </IntlProvider>
    );

    const now = +mount(el)
      .find(Child)
      .text(); // see above
    expect(now).toBe(now);
  });

  it('inherits `initialNow` from an <IntlProvider> ancestor', () => {
    const initialNow = 1234;
    const IntlProvider = mockContext({
      now: () => initialNow,
    });

    // see above
    const Child = ({intl}) => <div>{intl.now()}</div>;

    const el = (
      <IntlProvider locale="en">
        <Child />
      </IntlProvider>
    );

    const now = +mount(el)
      .find(Child)
      .text(); // see above
    expect(now).toBe(initialNow);
  });

  it('updates `now()` to return the current date when mounted', () => {
    const IntlProvider = mockContext(null, false);
    const initialNow = 1234;

    const intl = getIntlContext(
      <IntlProvider locale="en" initialNow={initialNow}>
        <Child />
      </IntlProvider>
    );

    expect(intl.now()).toBe(now);
  });
});
