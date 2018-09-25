import expect, {createSpy, spyOn} from 'expect';
import React from 'react';
import {mount} from 'enzyme';
import {shallowDeep, mockIntlContext, SpyComponent} from '../utils'
import {intlConfigPropTypes, intlFormatPropTypes} from '../../../src/types';
import IntlProvider from '../../../src/components/provider';

const skipWhen = (shouldSkip, callback) => {
    if (shouldSkip) {
        callback(it.skip);
    } else {
        callback(it);
    }
};

const mockContext = (intl) => {
  mockIntlContext(intl);
  return require('../../../src/components/provider').default;
}

const getIntlContext = (el) => {
  const provider = shallowDeep(el, 2).first();
  return provider.prop('value');
}

describe('<IntlProvider>', () => {
    let immutableIntl = false;
    try {
        global.Intl = global.Intl;
    } catch (e) {
        immutableIntl = true;
    }

    const now = Date.now();

    const INTL = global.Intl;

    const INTL_CONFIG_PROP_NAMES = Object.keys(intlConfigPropTypes);
    const INTL_FORMAT_PROP_NAMES = Object.keys(intlFormatPropTypes);

    const INTL_SHAPE_PROP_NAMES = [
        ...INTL_CONFIG_PROP_NAMES,
        ...INTL_FORMAT_PROP_NAMES,
        'now',
    ];

    const Child = () => null;

    let consoleError;
    let dateNow;

    beforeEach(() => {
        jest.resetModules()

        consoleError       = spyOn(console, 'error');
        dateNow            = spyOn(Date, 'now').andReturn(now);
    });

    afterEach(() => {
        if (!immutableIntl) {
            global.Intl = INTL;
        }

        consoleError.restore();
        dateNow.restore();
    });

    it('has a `displayName`', () => {
        expect(IntlProvider.displayName).toBeA('string');
    });

    // If global.Intl is immutable, then skip this test.
    skipWhen(immutableIntl, (it) => {
        it('throws when `Intl` is missing from runtime', () => {
            const IntlProvider = mockContext();
            global.Intl = undefined;

            expect(() => shallowDeep(<IntlProvider />, 2)).toThrow(
                '[React Intl] The `Intl` APIs must be available in the runtime, and do not appear to be built-in. An `Intl` polyfill should be loaded.'
            );
        });
    });

    it('throws when no `children`', () => {
        const IntlProvider = mockContext();

        expect(() => shallowDeep(<IntlProvider />, 2)).toThrow();
    });

    it('throws when more than one `children`', () => {
        const IntlProvider = mockContext();
        const el = (
            <IntlProvider>
                <Child />
                <Child />
            </IntlProvider>
        );

        expect(() => shallowDeep(el, 2)).toThrow();
    });

    it('warns when no `locale` prop is provided', () => {
        const IntlProvider = mockContext();
        const el = (
            <IntlProvider>
                <Child />
            </IntlProvider>
        );

        shallowDeep(el, 2);
        expect(consoleError.calls.length).toBe(1);
        expect(consoleError.calls[0].arguments[0]).toContain(
            '[React Intl] Missing locale data for locale: "undefined". Using default locale: "en" as fallback.'
        );
    });

    it('warns when `locale` prop provided has no locale data', () => {
        const IntlProvider = mockContext();
        const el = (
            <IntlProvider locale="missing">
                <Child />
            </IntlProvider>
        );

        const {locale} = el.props;

        shallowDeep(el, 2);
        expect(consoleError.calls.length).toBe(1);
        expect(consoleError.calls[0].arguments[0]).toContain(
            `[React Intl] Missing locale data for locale: "${locale}". Using default locale: "en" as fallback.`
        );
    });

    it('renderes its `children`', () => {
        const IntlProvider = mockContext();
        const el = (
            <IntlProvider locale="en">
                <Child />
            </IntlProvider>
        );

        const rendered = shallowDeep(el, 2);
        expect(rendered.children().length).toBe(1);
        expect(rendered.children().contains(<Child />)).toBe(true);
    });

    it('provides `context.intl` with `intlShape` props', () => {
        const IntlProvider = mockContext();
        const el = (
            <IntlProvider locale="en">
                <Child />
            </IntlProvider>
        );

        const intl = getIntlContext(el);

        INTL_SHAPE_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toExist(`Missing context.intl prop: ${propName}`);
        });
    });

    it('provides `context.intl` with values from intl config props', () => {
        const IntlProvider = mockContext();
        const props = {
            locale       : 'fr-FR',
            formats      : {},
            messages     : {},
            textComponent: 'span',

            defaultLocale : 'en-US',
            defaultFormats: {},
        };

        const el = (
            <IntlProvider {...props}>
                <Child />
            </IntlProvider>
        );

        const intl = getIntlContext(el);

        INTL_CONFIG_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toBe(props[propName]);
        });
    });

    it('provides `context.intl` with values from `defaultProps` for missing or undefined props', () => {
        const IntlProvider = mockContext();
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

        expect(intl.defaultLocale).toNotBe(undefined);
        expect(intl.defaultLocale).toBe('en');
        expect(intl.messages).toNotBe(undefined);
        expect(intl.messages).toBeAn('object');
    });

    it('provides `context.intl` with format methods bound to intl config props', () => {
        const IntlProvider = mockContext();
        const el = (
            <IntlProvider
                locale="en"
                formats={{
                    date: {
                        'year-only': {
                            year: 'numeric'
                        }
                    }
                }}
            >
                <Child />
            </IntlProvider>
        );

        const intl = getIntlContext(el);

        INTL_FORMAT_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toExist(`Missing context.intl prop: ${propName}`);
            expect(intl[propName]).toBeA('function');
        });

        const date = new Date();
        const df   = new Intl.DateTimeFormat('en', {year: 'numeric'});

        expect(intl.formatDate(date, {format: 'year-only'})).toBe(df.format(date));
    });

    it('inherits from an <IntlProvider> ancestor', () => {
        let IntlProvider = mockContext();
        const props = {
            locale  : 'en',
            formats : {
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

            defaultLocale : 'fr',
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

        jest.resetModules(); // to make mockContext() work again
        IntlProvider = mockContext(parentContext);
        const el = (
            <IntlProvider>
                <Child />
            </IntlProvider>
        );

        const intl = getIntlContext(el);

        expect(consoleError.calls.length).toBe(0);

        INTL_CONFIG_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toBe(props[propName]);
        });
    });

    it('shadows inherited intl config props from an <IntlProvider> ancestor', () => {
        let IntlProvider = mockContext()
        const props = {
            locale  : 'en',
            formats : {
                date: {
                    'year-only': {
                        year: 'numeric',
                    },
                },
            },
            messages: {
                hello: 'Hello, World!',
            },

            defaultLocale : 'fr',
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

        jest.resetModules();
        IntlProvider = mockContext(parentContext);
        const el = (
            <IntlProvider
                locale="fr"
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

        expect(consoleError.calls.length).toBe(0);

        INTL_CONFIG_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toNotBe(props[propName]);
        });
    });

    it('should not re-render when props and context are the same', () => {
        let IntlProvider = mockContext()
        const parentContext = getIntlContext(
          <IntlProvider locale='en'>
            <Child />
          </IntlProvider>
        );

        jest.resetModules();
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
        let IntlProvider = mockContext()
        const parentContext = getIntlContext(
          <IntlProvider locale='en'>
            <Child />
          </IntlProvider>
        );

        jest.resetModules();
        IntlProvider = mockContext(parentContext);

        const Child = createSpy().andReturn(null);

        const intlProvider = mount(
            <IntlProvider locale="en">
                <SpyComponent />
            </IntlProvider>
        );
        intlProvider.setProps({
          locale: 'en-US'
        })

        const spy = intlProvider.find(SpyComponent).instance();
        expect(spy.getRenderCount()).toBe(2);
    });

    it('should re-render when context changes', () => {
        let IntlProvider = mockContext()
        const initialParentContext = getIntlContext(
          <IntlProvider locale='en'>
            <Child />
          </IntlProvider>
        );
        const changedParentContext = getIntlContext(
          <IntlProvider locale='en-US'>
            <Child />
          </IntlProvider>
        );

        jest.resetModules();
        IntlProvider = mockContext(initialParentContext);

        const Child = createSpy().andReturn(null);

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
        const IntlProvider = mockContext();
        const initialNow = 1234;

        // doing this to get the actual "now" at render time
        const Child = ({ intl }) => ( // mocked provider injects context as 'intl' into children
          <div>
            { intl.now() }
          </div>
        )

        const el = (
            <IntlProvider
                locale="en"
                initialNow={initialNow}
            >
                <Child />
            </IntlProvider>
        );

        // can't do shallow rendering as this first mounts the Provider and then the children, bypassing initialNow
        const now = +mount(el).find(Child).text();
        expect(now).toBe(initialNow);
    });

    it('defaults `initialNow` to `Date.now()`', () => {
        const IntlProvider = mockContext();
        const Child = ({ intl }) => ( // see above
          <div>
            { intl.now() }
          </div>
        )

        const el = (
            <IntlProvider
                locale="en"
            >
                <Child />
            </IntlProvider>
        );

        const now = +mount(el).find(Child).text(); // see above
        expect(now).toBe(now);
    });

    it('inherits `initialNow` from an <IntlProvider> ancestor', () => {
        const initialNow = 1234;
        const IntlProvider = mockContext({
          now: () => initialNow
        });

        // see above
        const Child = ({ intl }) => (
          <div>
            { intl.now() }
          </div>
        )

        const el = (
            <IntlProvider locale="en">
                <Child />
            </IntlProvider>
        );

        const now = +mount(el).find(Child).text(); // see above
        expect(now).toBe(initialNow);
    });

    it('updates `now()` to return the current date when mounted', () => {
        const IntlProvider = mockContext();
        const initialNow = 1234;

        const intl = getIntlContext(
          <IntlProvider
              locale="en"
              initialNow={initialNow}
          >
              <Child />
          </IntlProvider>
        )

        expect(intl.now()).toBe(now)
    });
});
