import expect, {spyOn} from 'expect';
import expectJSX from 'expect-jsx';
import React from 'react';
import {createRenderer} from '../../react-compat';
import {intlConfigPropTypes, intlFormatPropTypes} from '../../../src/types';
import IntlProvider from '../../../src/components/provider';

expect.extend(expectJSX);

const skipWhen = (shouldSkip, callback) => {
    if (shouldSkip) {
        callback(it.skip);
    } else {
        callback(it);
    }
};

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
    let IntlProviderRender;

    let renderer;

    beforeEach(() => {
        consoleError       = spyOn(console, 'error');
        dateNow            = spyOn(Date, 'now').andReturn(now);
        IntlProviderRender = spyOn(IntlProvider.prototype, 'render').andCallThrough();

        renderer = createRenderer();

        // TODO: Remove when this feature is released to react-addons-test-utils
        // https://github.com/facebook/react/pull/4918
        if (!renderer.getMountedInstance) {
            renderer.getMountedInstance = function () {
                return this._instance ? this._instance._instance : null;
            };
        }
    });

    afterEach(() => {
        if (!immutableIntl) {
            global.Intl = INTL;
        }

        consoleError.restore();
        dateNow.restore();
        IntlProviderRender.restore();
    });

    it('has a `displayName`', () => {
        expect(IntlProvider.displayName).toBeA('string');
    });

    // If global.Intl is immutable, then skip this test.
    skipWhen(immutableIntl, (it) => {
        it('throws when `Intl` is missing from runtime', () => {
            global.Intl = undefined;
            expect(() => renderer.render(<IntlProvider />)).toThrow(
                '[React Intl] The `Intl` APIs must be available in the runtime, and do not appear to be built-in. An `Intl` polyfill should be loaded.'
            );
        });
    });

    it('throws when no `children`', () => {
        expect(() => renderer.render(<IntlProvider />)).toThrow();
    });

    it('throws when more than one `children`', () => {
        const el = (
            <IntlProvider>
                <Child />
                <Child />
            </IntlProvider>
        );

        expect(() => renderer.render(el)).toThrow();
    });

    it('warns when no `locale` prop is provided', () => {
        const el = (
            <IntlProvider>
                <Child />
            </IntlProvider>
        );

        renderer.render(el);
        expect(consoleError.calls.length).toBe(1);
        expect(consoleError.calls[0].arguments[0]).toContain(
            '[React Intl] Missing locale data for locale: "undefined". Using default locale: "en" as fallback.'
        );
    });

    it('warns when `locale` prop provided has no locale data', () => {
        const el = (
            <IntlProvider locale="missing">
                <Child />
            </IntlProvider>
        );

        const {locale} = el.props;

        renderer.render(el);
        expect(consoleError.calls.length).toBe(1);
        expect(consoleError.calls[0].arguments[0]).toContain(
            `[React Intl] Missing locale data for locale: "${locale}". Using default locale: "en" as fallback.`
        );
    });

    it('renderes its `children`', () => {
        const el = (
            <IntlProvider locale="en">
                <Child />
            </IntlProvider>
        );

        renderer.render(el);
        expect(renderer.getRenderOutput()).toEqualJSX(
            <Child />
        );
    });

    it('provides `context.intl` with `intlShape` props', () => {
        const el = (
            <IntlProvider locale="en">
                <Child />
            </IntlProvider>
        );

        renderer.render(el);
        const {intl} = renderer.getMountedInstance().getChildContext();

        INTL_SHAPE_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toExist(`Missing context.intl prop: ${propName}`);
        });
    });

    it('provides `context.intl` with values from intl config props', () => {
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

        renderer.render(el);
        const {intl} = renderer.getMountedInstance().getChildContext();

        INTL_CONFIG_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toBe(props[propName]);
        });
    });

    it('provides `context.intl` with values from `defaultProps` for missing or undefined props', () => {
        const props = {
            locale: 'en-US',
            defaultLocale: undefined,
        };

        const el = (
            <IntlProvider {...props}>
                <Child />
            </IntlProvider>
        );

        renderer.render(el);
        const {intl} = renderer.getMountedInstance().getChildContext();

        expect(intl.defaultLocale).toNotBe(undefined);
        expect(intl.defaultLocale).toBe('en');
        expect(intl.messages).toNotBe(undefined);
        expect(intl.messages).toBeAn('object');
    });

    it('provides `context.intl` with format methods bound to intl config props', () => {
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

        renderer.render(el);
        const {intl} = renderer.getMountedInstance().getChildContext();

        INTL_FORMAT_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toExist(`Missing context.intl prop: ${propName}`);
            expect(intl[propName]).toBeA('function');
        });

        const date = new Date();
        const df   = new Intl.DateTimeFormat('en', {year: 'numeric'});

        expect(intl.formatDate(date, {format: 'year-only'})).toBe(df.format(date));
    });

    it('inherits from an <IntlProvider> ancestor', () => {
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

        const parentIntlProvider = new IntlProvider(props, {});

        const el = (
            <IntlProvider>
                <Child />
            </IntlProvider>
        );

        renderer.render(el, parentIntlProvider.getChildContext());
        const {intl} = renderer.getMountedInstance().getChildContext();

        expect(consoleError.calls.length).toBe(0);

        INTL_CONFIG_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toBe(props[propName]);
        });
    });

    it('shadows inherited intl config props from an <IntlProvider> ancestor', () => {
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

        const parentIntlProvider = new IntlProvider(props, {});

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

        renderer.render(el, parentIntlProvider.getChildContext());
        const {intl} = renderer.getMountedInstance().getChildContext();

        expect(consoleError.calls.length).toBe(0);

        INTL_CONFIG_PROP_NAMES.forEach((propName) => {
            expect(intl[propName]).toNotBe(props[propName]);
        });
    });

    it('should not re-render when props and context are the same', () => {
        const parentIntlProvider = new IntlProvider({locale: 'en'}, {});

        const el = (
            <IntlProvider>
                <Child />
            </IntlProvider>
        );

        renderer.render(el, parentIntlProvider.getChildContext());
        renderer.render(el, parentIntlProvider.getChildContext());

        expect(IntlProviderRender.calls.length).toBe(1);
    });

    it('should re-render when props change', () => {
        const parentIntlProvider = new IntlProvider({locale: 'en'}, {});

        const child = <Child />;

        renderer.render(
            <IntlProvider locale="en">
                {child}
            </IntlProvider>,
            parentIntlProvider.getChildContext()
        );

        renderer.render(
            <IntlProvider locale="en-US">
                {child}
            </IntlProvider>,
            parentIntlProvider.getChildContext()
        );

        expect(IntlProviderRender.calls.length).toBe(2);
    });

    it('should re-render when context changes', () => {
        const el = (
            <IntlProvider>
                <Child />
            </IntlProvider>
        );

        let parentIntlProvider;

        parentIntlProvider = new IntlProvider({locale: 'en'}, {});
        renderer.render(el, parentIntlProvider.getChildContext());

        parentIntlProvider = new IntlProvider({locale: 'en-US'}, {});
        renderer.render(el, parentIntlProvider.getChildContext());

        expect(IntlProviderRender.calls.length).toBe(2);
    });

    it('accepts `initialNow` prop', () => {
        const initialNow = 1234;

        renderer.render(
            <IntlProvider
                locale="en"
                initialNow={initialNow}
            >
                <Child />
            </IntlProvider>
        );

        const {intl} = renderer.getMountedInstance().getChildContext();

        expect(intl.now()).toBe(initialNow);
    });

    it('defaults `initialNow` to `Date.now()`', () => {
        renderer.render(
            <IntlProvider locale="en">
                <Child />
            </IntlProvider>
        );

        const {intl} = renderer.getMountedInstance().getChildContext();

        expect(intl.now()).toBe(now);
    });

    it('inherits `initialNow` from an <IntlProvider> ancestor', () => {
        const initialNow = 1234;
        const parentIntlProvider = new IntlProvider({
            locale: 'en',
            initialNow,
        }, {});

        const el = (
            <IntlProvider >
                <Child />
            </IntlProvider>
        );

        renderer.render(el, parentIntlProvider.getChildContext());
        const {intl} = renderer.getMountedInstance().getChildContext();

        expect(intl.now()).toBe(initialNow);
    });

    it('updates `now()` to return the current date when mounted', (done) => {
        const initialNow = 1234;

        renderer.render(
            <IntlProvider
                locale="en"
                initialNow={initialNow}
            >
                <Child />
            </IntlProvider>
        );

        const instance = renderer.getMountedInstance();
        const {intl}   = instance.getChildContext();

        const nowOne = intl.now();

        // Shallow Renderer doesn't call `componentDidMount()`.
        instance.componentDidMount();

        setTimeout(() => {
            const nowTwo = intl.now();

            expect(nowTwo).toNotEqual(nowOne);
            expect(nowOne).toBe(initialNow);
            expect(nowTwo).toBe(now);

            renderer.unmount();
            done();
        }, 10);
    });
});
