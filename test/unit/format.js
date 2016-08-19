import expect, {createSpy, spyOn} from 'expect';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import IntlPluralFormat from '../../src/plural';
import {intlFormatPropTypes} from '../../src/types';
import * as f from '../../src/format';

describe('format API', () => {
    const {NODE_ENV} = process.env;
    const IRF_THRESHOLDS = {...IntlRelativeFormat.thresholds};

    let consoleError;
    let config;
    let state;

    beforeEach(() => {
        consoleError = spyOn(console, 'error');

        config = {
            locale: 'en',

            messages: {
                no_args: 'Hello, World!',
                with_arg: 'Hello, {name}!',
                with_named_format: 'It is {now, date, year-only}',
                with_html: 'Hello, <b>{name}</b>!',

                missing: undefined,
                empty: '',
                invalid: 'invalid {}',
                missing_value: 'missing {arg_missing}',
                missing_named_format: 'missing {now, date, format_missing}',
            },

            formats: {
                date: {
                    'year-only': {
                        year: 'numeric',
                    },
                    missing: undefined,
                },

                time: {
                    'hour-only': {
                        hour: '2-digit',
                        hour12: false,
                    },
                    missing: undefined,
                },

                relative: {
                    'seconds': {
                        units: 'second',
                    },
                    missing: undefined,
                },

                number: {
                    'percent': {
                        style: 'percent',
                        minimumFractionDigits: 2,
                    },
                    missing: undefined,
                },
            },

            defaultLocale: 'en',
            defaultFormats: {},
        };

        state = {
            getDateTimeFormat: createSpy().andCall((...args) => new Intl.DateTimeFormat(...args)),
            getNumberFormat  : createSpy().andCall((...args) => new Intl.NumberFormat(...args)),
            getMessageFormat : createSpy().andCall((...args) => new IntlMessageFormat(...args)),
            getRelativeFormat: createSpy().andCall((...args) => new IntlRelativeFormat(...args)),
            getPluralFormat  : createSpy().andCall((...args) => new IntlPluralFormat(...args)),

            now: () => 0,
        };
    });

    afterEach(() => {
        process.env.NODE_ENV = NODE_ENV;
        consoleError.restore();
    });

    describe('exports', () => {
        Object.keys(intlFormatPropTypes).forEach((name) => {
            it(`exports \`${name}\``, () => {
                expect(f[name]).toBeA('function');
            });
        });
    });

    describe('formatDate()', () => {
        let df;
        let formatDate;

        beforeEach(() => {
            df = new Intl.DateTimeFormat(config.locale);
            formatDate = f.formatDate.bind(null, config, state);
        });

        it('fallsback and warns when no value is provided', () => {
            expect(formatDate()).toBe('Invalid Date');
            expect(consoleError.calls.length).toBe(1);
            expect(consoleError.calls[0].arguments[0]).toContain(
                '[React Intl] Error formatting date.\nRangeError'
            );
        });

        it('fallsback and warns when a non-finite value is provided', () => {
            expect(formatDate(NaN)).toBe('Invalid Date');
            expect(formatDate('')).toBe('Invalid Date');
            expect(consoleError.calls.length).toBe(2);
        });

        it('formats falsy finite values', () => {
            expect(formatDate(false)).toBe(df.format(false));
            expect(formatDate(null)).toBe(df.format(null));
            expect(formatDate(0)).toBe(df.format(0));
        });

        it('formats date instance values', () => {
            expect(formatDate(new Date(0))).toBe(df.format(new Date(0)));
        });

        it('formats date string values', () => {
            expect(formatDate(new Date(0).toString())).toBe(df.format(new Date(0)));
        });

        it('formats date ms timestamp values', () => {
            const timestamp = Date.now();
            expect(formatDate(timestamp)).toBe(df.format(timestamp));
        });

        describe('options', () => {
            it('accepts empty options', () => {
                expect(formatDate(0, {})).toBe(df.format(0));
            });

            it('accepts valid Intl.DateTimeFormat options', () => {
                expect(() => formatDate(0, {year: 'numeric'})).toNotThrow();
            });

            it('fallsback and warns on invalid Intl.DateTimeFormat options', () => {
                expect(formatDate(0, {year: 'invalid'})).toBe(String(new Date(0)));
                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    '[React Intl] Error formatting date.\nRangeError'
                );
            });

            it('uses configured named formats', () => {
                const date   = new Date();
                const format = 'year-only';

                const {locale, formats} = config;
                df = new Intl.DateTimeFormat(locale, formats.date[format]);

                expect(formatDate(date, {format})).toBe(df.format(date));
            });

            it('uses named formats as defaults', () => {
                const date   = new Date();
                const opts   = {month: 'numeric'};
                const format = 'year-only';

                const {locale, formats} = config;
                df = new Intl.DateTimeFormat(locale, {
                    ...opts,
                    ...formats.date[format],
                });

                expect(formatDate(date, {...opts, format})).toBe(df.format(date));
            });

            it('handles missing named formats and warns', () => {
                const date   = new Date();
                const format = 'missing';

                df = new Intl.DateTimeFormat(config.locale);

                expect(formatDate(date, {format})).toBe(df.format(date));
                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toBe(
                    `[React Intl] No date format named: ${format}`
                );
            });
        });
    });

    describe('formatTime()', () => {
        let df;
        let formatTime;

        beforeEach(() => {
            df = new Intl.DateTimeFormat(config.locale, {
                hour: 'numeric',
                minute: 'numeric',
            });

            formatTime = f.formatTime.bind(null, config, state);
        });

        it('fallsback and warns when no value is provided', () => {
            expect(formatTime()).toBe('Invalid Date');
            expect(consoleError.calls.length).toBe(1);
            expect(consoleError.calls[0].arguments[0]).toContain(
                '[React Intl] Error formatting time.\nRangeError'
            );
        });

        it('fallsback and warns when a non-finite value is provided', () => {
            expect(formatTime(NaN)).toBe('Invalid Date');
            expect(formatTime('')).toBe('Invalid Date');
            expect(consoleError.calls.length).toBe(2);
        });

        it('formats falsy finite values', () => {
            expect(formatTime(false)).toBe(df.format(false));
            expect(formatTime(null)).toBe(df.format(null));
            expect(formatTime(0)).toBe(df.format(0));
        });

        it('formats date instance values', () => {
            expect(formatTime(new Date(0))).toBe(df.format(new Date(0)));
        });

        it('formats date string values', () => {
            expect(formatTime(new Date(0).toString())).toBe(df.format(new Date(0)));
        });

        it('formats date ms timestamp values', () => {
            const timestamp = Date.now();
            expect(formatTime(timestamp)).toBe(df.format(timestamp));
        });

        describe('options', () => {
            it('accepts empty options', () => {
                expect(formatTime(0, {})).toBe(df.format(0));
            });

            it('accepts valid Intl.DateTimeFormat options', () => {
                expect(() => formatTime(0, {hour: '2-digit'})).toNotThrow();
            });

            it('fallsback and warns on invalid Intl.DateTimeFormat options', () => {
                expect(formatTime(0, {hour: 'invalid'})).toBe(String(new Date(0)));
                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    '[React Intl] Error formatting time.\nRangeError'
                );
            });

            it('uses configured named formats', () => {
                const date   = new Date();
                const format = 'hour-only';

                const {locale, formats} = config;
                df = new Intl.DateTimeFormat(locale, formats.time[format]);

                expect(formatTime(date, {format})).toBe(df.format(date));
            });

            it('uses named formats as defaults', () => {
                const date   = new Date();
                const opts   = {minute: '2-digit'};
                const format = 'hour-only';

                const {locale, formats} = config;
                df = new Intl.DateTimeFormat(locale, {
                    ...opts,
                    ...formats.time[format],
                });

                expect(formatTime(date, {...opts, format})).toBe(df.format(date));
            });

            it('handles missing named formats and warns', () => {
                const date   = new Date();
                const format = 'missing';

                expect(formatTime(date, {format})).toBe(df.format(date));
                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toBe(
                    `[React Intl] No time format named: ${format}`
                );
            });

            it('should set default values', () => {
                const date = new Date();
                const {locale} = config;
                const day = 'numeric';
                df = new Intl.DateTimeFormat(locale, {hour: 'numeric', minute: 'numeric', day});
                expect(formatTime(date, {day})).toBe(df.format(date));
            });

            it('should not set default values when second is provided', () => {
                const date = new Date();
                const {locale} = config;
                const second = 'numeric';
                df = new Intl.DateTimeFormat(locale, {second});
                expect(formatTime(date, {second})).toBe(df.format(date));
            });

            it('should not set default values when minute is provided', () => {
                const date = new Date();
                const {locale} = config;
                const minute = 'numeric';
                df = new Intl.DateTimeFormat(locale, {minute});
                expect(formatTime(date, {minute})).toBe(df.format(date));
            });

            it('should not set default values when hour is provided', () => {
                const date = new Date();
                const {locale} = config;
                const hour = 'numeric';
                df = new Intl.DateTimeFormat(locale, {hour});
                expect(formatTime(date, {hour})).toBe(df.format(date));
            });
        });
    });

    describe('formatRelative()', () => {
        let now;
        let rf;
        let formatRelative;

        beforeEach(() => {
            now = state.now();
            rf = new IntlRelativeFormat(config.locale);
            formatRelative = f.formatRelative.bind(null, config, state);
        });

        it('fallsback and warns when no value is provided', () => {
            expect(formatRelative()).toBe('Invalid Date');
            expect(consoleError.calls.length).toBe(1);
            expect(consoleError.calls[0].arguments[0]).toContain(
                '[React Intl] Error formatting relative time.\nRangeError'
            );
        });

        it('fallsback and warns when a non-finite value is provided', () => {
            expect(formatRelative(NaN)).toBe('Invalid Date');
            expect(formatRelative('')).toBe('Invalid Date');
            expect(consoleError.calls.length).toBe(2);
        });

        it('formats falsy finite values', () => {
            expect(formatRelative(false)).toBe(rf.format(false, {now}));
            expect(formatRelative(null)).toBe(rf.format(null, {now}));
            expect(formatRelative(0)).toBe(rf.format(0, {now}));
        });

        it('formats date instance values', () => {
            expect(formatRelative(new Date(0))).toBe(rf.format(new Date(0), {now}));
        });

        it('formats date string values', () => {
            expect(formatRelative(new Date(0).toString())).toBe(rf.format(new Date(0), {now}));
        });

        it('formats date ms timestamp values', () => {
            const timestamp = Date.now();
            expect(formatRelative(timestamp)).toBe(rf.format(timestamp, {now}));
        });

        it('formats with the expected thresholds', () => {
            const timestamp = now - (1000 * 59);
            expect(IntlRelativeFormat.thresholds).toEqual(IRF_THRESHOLDS);
            expect(formatRelative(timestamp)).toNotBe(rf.format(timestamp, {now}));
            expect(formatRelative(timestamp)).toBe('59 seconds ago');
            expect(IntlRelativeFormat.thresholds).toEqual(IRF_THRESHOLDS);
            expect(formatRelative(NaN)).toBe('Invalid Date');
            expect(IntlRelativeFormat.thresholds).toEqual(IRF_THRESHOLDS);
        });

        describe('options', () => {
            it('accepts empty options', () => {
                expect(formatRelative(0, {})).toBe(rf.format(0, {now}));
            });

            it('accepts valid IntlRelativeFormat options', () => {
                expect(() => formatRelative(0, {units: 'second'})).toNotThrow();
            });

            it('fallsback and wanrs on invalid IntlRelativeFormat options', () => {
                expect(formatRelative(0, {units: 'invalid'})).toBe(String(new Date(0)));
                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toBe(
                    '[React Intl] Error formatting relative time.\nError: "invalid" is not a valid IntlRelativeFormat `units` value, it must be one of: "second", "minute", "hour", "day", "month", "year"'
                );
            });

            it('uses configured named formats', () => {
                const date   = -(1000 * 120);
                const format = 'seconds';

                const {locale, formats} = config;
                rf = new IntlRelativeFormat(locale, formats.relative[format]);

                expect(formatRelative(date, {format})).toBe(rf.format(date, {now}));
            });

            it('uses named formats as defaults', () => {
                const date   = 0;
                const opts   = {style: 'numeric'};
                const format = 'seconds';

                const {locale, formats} = config;
                rf = new IntlRelativeFormat(locale, {
                    ...opts,
                    ...formats.relative[format],
                });

                expect(formatRelative(date, {...opts, format})).toBe(rf.format(date, {now}));
            });

            it('handles missing named formats and warns', () => {
                const date   = new Date();
                const format = 'missing';

                rf = new IntlRelativeFormat(config.locale);

                expect(formatRelative(date, {format})).toBe(rf.format(date, {now}));
                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toBe(
                    `[React Intl] No relative format named: ${format}`
                );
            });

            describe('now', () => {
                it('accepts a `now` option', () => {
                    now = 1000;
                    expect(formatRelative(0, {now})).toBe(rf.format(0, {now}));
                });

                it('defaults to `state.now()` when no value is provided', () => {
                    now = 2000;
                    state.now = () => now;

                    expect(formatRelative(1000)).toBe(rf.format(1000, {now}));
                });

                it('does not throw or warn when a non-finite value is provided', () => {
                    expect(() => formatRelative(0, {now: NaN})).toNotThrow();
                    expect(() => formatRelative(0, {now: ''})).toNotThrow();
                    expect(consoleError.calls.length).toBe(0);
                });

                it('formats falsy finite values', () => {
                    expect(formatRelative(0, {now: false})).toBe(rf.format(0, {now: false}));
                    expect(formatRelative(0, {now: null})).toBe(rf.format(0, {now: null}));
                    expect(formatRelative(0, {now: 0})).toBe(rf.format(0, {now: 0}));
                });

                it('formats date instance values', () => {
                    now = new Date(1000);
                    expect(formatRelative(0, {now})).toBe(rf.format(0, {now}));
                });

                it('formats date string values', () => {
                    now = 1000;
                    const dateString = new Date(now).toString();
                    expect(formatRelative(0, {now: dateString})).toBe(rf.format(0, {now}));
                });

                it('formats date ms timestamp values', () => {
                    now = 1000;
                    expect(formatRelative(0, {now})).toBe(rf.format(0, {now}));
                });
            });
        });
    });

    describe('formatNumber()', () => {
        let nf;
        let formatNumber;

        beforeEach(() => {
            nf = new Intl.NumberFormat(config.locale);
            formatNumber = f.formatNumber.bind(null, config, state);
        });

        it('returns "NaN" when no value is provided', () => {
            expect(nf.format()).toBe('NaN');
            expect(formatNumber()).toBe('NaN');
        });

        it('returns "NaN" when a non-number value is provided', () => {
            expect(nf.format(NaN)).toBe('NaN');
            expect(formatNumber(NaN)).toBe('NaN');
        });

        it('formats falsy values', () => {
            expect(formatNumber(false)).toBe(nf.format(false));
            expect(formatNumber(null)).toBe(nf.format(null));
            expect(formatNumber('')).toBe(nf.format(''));
            expect(formatNumber(0)).toBe(nf.format(0));
        });

        it('formats number values', () => {
            expect(formatNumber(1000)).toBe(nf.format(1000));
            expect(formatNumber(1.1)).toBe(nf.format(1.1));
        });

        it('formats string values parsed as numbers', () => {
            expect(Number('1000')).toBe(1000);
            expect(formatNumber('1000')).toBe(nf.format('1000'));
            expect(Number('1.10')).toBe(1.1);
            expect(formatNumber('1.10')).toBe(nf.format('1.10'));
        });

        describe('options', () => {
            it('accepts empty options', () => {
                expect(formatNumber(1000, {})).toBe(nf.format(1000));
            });

            it('accepts valid Intl.NumberFormat options', () => {
                expect(() => formatNumber(0, {style: 'percent'})).toNotThrow();
            });

            it('fallsback and warns on invalid Intl.NumberFormat options', () => {
                expect(formatNumber(0, {style: 'invalid'})).toBe(String(0));
                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    '[React Intl] Error formatting number.\nRangeError'
                );
            });

            it('uses configured named formats', () => {
                const num    = 0.505;
                const format = 'percent';

                const {locale, formats} = config;
                nf = new Intl.NumberFormat(locale, formats.number[format]);

                expect(formatNumber(num, {format})).toBe(nf.format(num));
            });

            it('uses named formats as defaults', () => {
                const num    = 0.500059;
                const opts   = {maximumFractionDigits: 3};
                const format = 'percent';

                const {locale, formats} = config;
                nf = new Intl.NumberFormat(locale, {
                    ...opts,
                    ...formats.number[format],
                });

                expect(formatNumber(num, {...opts, format})).toBe(nf.format(num));
            });

            it('handles missing named formats and warns', () => {
                const num    = 1000;
                const format = 'missing';

                nf = new Intl.NumberFormat(config.locale);

                expect(formatNumber(num, {format})).toBe(nf.format(num));
                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toBe(
                    `[React Intl] No number format named: ${format}`
                );
            });
        });
    });

    describe('formatPlural()', () => {
        let pf;
        let formatPlural;

        beforeEach(() => {
            pf = new IntlPluralFormat(config.locale);
            formatPlural = f.formatPlural.bind(null, config, state);
        });

        it('formats falsy values', () => {
            expect(formatPlural(undefined)).toBe(pf.format(undefined));
            expect(formatPlural(false)).toBe(pf.format(false));
            expect(formatPlural(null)).toBe(pf.format(null));
            expect(formatPlural(NaN)).toBe(pf.format(NaN));
            expect(formatPlural('')).toBe(pf.format(''));
            expect(formatPlural(0)).toBe(pf.format(0));
        });

        it('formats integer values', () => {
            expect(formatPlural(0)).toBe(pf.format(0));
            expect(formatPlural(1)).toBe(pf.format(1));
            expect(formatPlural(2)).toBe(pf.format(2));
        });

        it('formats decimal values', () => {
            expect(formatPlural(0.1)).toBe(pf.format(0.1));
            expect(formatPlural(1.0)).toBe(pf.format(1.0));
            expect(formatPlural(1.1)).toBe(pf.format(1.1));
        });

        it('formats string values parsed as numbers', () => {
            expect(Number('0')).toBe(0);
            expect(formatPlural('0')).toBe(pf.format('0'));
            expect(Number('1')).toBe(1);
            expect(formatPlural('1')).toBe(pf.format('1'));

            expect(Number('0.1')).toBe(0.1);
            expect(formatPlural('0.1')).toBe(pf.format('0.1'));
            expect(Number('1.0')).toBe(1.0);
            expect(formatPlural('1.0')).toBe(pf.format('1.0'));
        });

        describe('options', () => {
            it('accepts empty options', () => {
                expect(formatPlural(0, {})).toBe(pf.format(0));
            });

            it('accepts valid IntlPluralFormat options', () => {
                expect(() => formatPlural(22, {style: 'ordinal'})).toNotThrow();
            });

            describe('ordinals', () => {
                it('formats using ordinal plural rules', () => {
                    const opts = {style: 'ordinal'};
                    pf = new IntlPluralFormat(config.locale, opts);

                    expect(formatPlural(22, opts)).toBe(pf.format(22));
                });
            });
        });
    });

    describe('formatMessage()', () => {
        let formatMessage;

        beforeEach(() => {
            formatMessage = f.formatMessage.bind(null, config, state);
        });

        it('throws when no Message Descriptor is provided', () => {
            expect(() => formatMessage()).toThrow(
                '[React Intl] An `id` must be provided to format a message.'
            );
        });

        it('throws when Message Descriptor `id` is missing or falsy', () => {
            expect(() => formatMessage({})).toThrow(
                '[React Intl] An `id` must be provided to format a message.'
            );

            [undefined, null, false, 0, ''].forEach((id) => {
                expect(() => formatMessage({id: id})).toThrow(
                    '[React Intl] An `id` must be provided to format a message.'
                );
            });
        });

        it('formats basic messages', () => {
            const {locale, messages} = config;
            const mf = new IntlMessageFormat(messages.no_args, locale);

            expect(formatMessage({id: 'no_args'})).toBe(mf.format());
        });

        it('formats messages with placeholders', () => {
            const {locale, messages} = config;
            const mf = new IntlMessageFormat(messages.with_arg, locale);
            const values = {name: 'Eric'};

            expect(formatMessage({id: 'with_arg'}, values)).toBe(mf.format(values));
        });

        it('formats messages with named formats', () => {
            const {locale, messages, formats} = config;
            const mf = new IntlMessageFormat(messages.with_named_format, locale, formats);
            const values = {now: Date.now()};

            expect(formatMessage({id: 'with_named_format'}, values)).toBe(mf.format(values));
        });

        it('avoids formatting when no values and in production', () => {
            const {messages} = config;

            process.env.NODE_ENV = 'production';
            expect(formatMessage({id: 'no_args'})).toBe(messages.no_args);
            expect(state.getMessageFormat.calls.length).toBe(0);

            const values = {foo: 'foo'};
            expect(formatMessage({id: 'no_args'}, values)).toBe(messages.no_args);
            expect(state.getMessageFormat.calls.length).toBe(1);

            process.env.NODE_ENV = 'development';
            expect(formatMessage({id: 'no_args'})).toBe(messages.no_args);
            expect(state.getMessageFormat.calls.length).toBe(2);
        });

        describe('fallbacks', () => {
            it('formats message with missing named formats', () => {
                const {locale, messages} = config;
                const mf = new IntlMessageFormat(messages.missing_named_format, locale);
                const values = {now: Date.now()};

                expect(formatMessage({id: 'missing_named_format'}, values)).toBe(mf.format(values));
            });

            it('formats `defaultMessage` when message is missing', () => {
                const {locale, messages} = config;
                const mf = new IntlMessageFormat(messages.with_arg, locale);
                const id = 'missing';
                const values = {name: 'Eric'};

                expect(formatMessage({
                    id: id,
                    defaultMessage: messages.with_arg,
                }, values)).toBe(mf.format(values));
            });

            it('warns when `message` is missing and locales are different', () => {
                config.locale = 'fr';

                let {locale, messages, defaultLocale} = config;
                let mf = new IntlMessageFormat(messages.with_arg, locale);
                let id = 'missing';
                let values = {name: 'Eric'};

                expect(locale).toNotEqual(defaultLocale);

                expect(formatMessage({
                    id: id,
                    defaultMessage: messages.with_arg,
                }, values)).toBe(mf.format(values));

                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    `[React Intl] Missing message: "${id}" for locale: "${locale}", using default message as fallback.`
                );
            });

            it('warns when `message` and `defaultMessage` are missing', () => {
                let {locale, messages} = config;
                let id = 'missing';
                let values = {name: 'Eric'};

                expect(formatMessage({
                    id: id,
                    defaultMessage: messages.missing,
                }, values)).toBe(id);

                expect(consoleError.calls.length).toBe(2);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    `[React Intl] Missing message: "${id}" for locale: "${locale}"`
                );
                expect(consoleError.calls[1].arguments[0]).toContain(
                    `[React Intl] Cannot format message: "${id}", using message id as fallback.`
                );
            });

            it('formats `defaultMessage` when message has a syntax error', () => {
                const {locale, messages} = config;
                const mf = new IntlMessageFormat(messages.with_arg, locale);
                const id = 'invalid';
                const values = {name: 'Eric'};

                expect(formatMessage({
                    id: id,
                    defaultMessage: messages.with_arg,
                }, values)).toBe(mf.format(values));

                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    `[React Intl] Error formatting message: "${id}" for locale: "${locale}", using default message as fallback.`
                );
            });

            it('formats `defaultMessage` when message has missing values', () => {
                const {locale, messages} = config;
                const mf = new IntlMessageFormat(messages.with_arg, locale);
                const id = 'missing_value';
                const values = {name: 'Eric'};

                expect(formatMessage({
                    id: id,
                    defaultMessage: messages.with_arg,
                }, values)).toBe(mf.format(values));

                expect(consoleError.calls.length).toBe(1);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    `[React Intl] Error formatting message: "${id}" for locale: "${locale}", using default message as fallback.`
                );
            });

            it('returns message source when message and `defaultMessage` have formatting errors', () => {
                const {locale, messages} = config;
                const id = 'missing_value';

                expect(formatMessage({
                    id: id,
                    defaultMessage: messages.invalid,
                })).toBe(messages[id]);

                expect(consoleError.calls.length).toBe(3);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    `[React Intl] Error formatting message: "${id}" for locale: "${locale}"`
                );
                expect(consoleError.calls[1].arguments[0]).toContain(
                    `[React Intl] Error formatting the default message for: "${id}"`
                );
                expect(consoleError.calls[2].arguments[0]).toContain(
                    `[React Intl] Cannot format message: "${id}", using message source as fallback.`
                );
            });

            it('returns message source when formatting error and missing `defaultMessage`', () => {
                const {locale, messages} = config;
                const id = 'missing_value';

                expect(formatMessage({
                    id: id,
                    defaultMessage: messages.missing,
                })).toBe(messages[id]);

                expect(consoleError.calls.length).toBe(2);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    `[React Intl] Error formatting message: "${id}" for locale: "${locale}"`
                );
                expect(consoleError.calls[1].arguments[0]).toContain(
                    `[React Intl] Cannot format message: "${id}", using message source as fallback.`
                );
            });

            it('returns `defaultMessage` source when formatting errors and missing message', () => {
                config.locale = 'en-US';

                const {locale, messages} = config;
                const id = 'missing';

                expect(formatMessage({
                    id: id,
                    defaultMessage: messages.invalid,
                })).toBe(messages.invalid);

                expect(consoleError.calls.length).toBe(3);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    `[React Intl] Missing message: "${id}" for locale: "${locale}", using default message as fallback.`
                );
                expect(consoleError.calls[1].arguments[0]).toContain(
                    `[React Intl] Error formatting the default message for: "${id}"`
                );
                expect(consoleError.calls[2].arguments[0]).toContain(
                    `[React Intl] Cannot format message: "${id}", using message source as fallback.`
                );
            });

            it('returns message `id` when message and `defaultMessage` are missing', () => {
                const id = 'missing';

                expect(formatMessage({id: id})).toBe(id);

                expect(consoleError.calls.length).toBe(2);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    `[React Intl] Missing message: "${id}" for locale: "${config.locale}"`
                );
                expect(consoleError.calls[1].arguments[0]).toContain(
                    `[React Intl] Cannot format message: "${id}", using message id as fallback.`
                );
            });

            it('returns message `id` when message and `defaultMessage` are empty', () => {
                const {locale, messages} = config;
                const id = 'empty';

                expect(formatMessage({
                    id: id,
                    defaultMessage: messages[id],
                })).toBe(id);

                expect(consoleError.calls.length).toBe(2);
                expect(consoleError.calls[0].arguments[0]).toContain(
                    `[React Intl] Missing message: "${id}" for locale: "${locale}"`
                );
                expect(consoleError.calls[1].arguments[0]).toContain(
                    `[React Intl] Cannot format message: "${id}", using message id as fallback.`
                );
            });
        });
    });

    describe('formatHTMLMessage()', () => {
        let formatHTMLMessage;

        beforeEach(() => {
            formatHTMLMessage = f.formatHTMLMessage.bind(null, config, state);
        });

        it('formats HTML messages', () => {
            const {locale, messages} = config;
            const mf = new IntlMessageFormat(messages.with_html, locale);
            const values = {name: 'Eric'};

            expect(formatHTMLMessage({id: 'with_html'}, values)).toBe(mf.format(values));
        });

        it('html-escapes string values', () => {
            const {locale, messages} = config;
            const mf = new IntlMessageFormat(messages.with_html, locale);
            const values = {name: '<i>Eric</i>'};
            const escapedValues = {name: '&lt;i&gt;Eric&lt;/i&gt;'};

            expect(formatHTMLMessage({id: 'with_html'}, values)).toBe(mf.format(escapedValues));
        });
    });
});
