import expect from 'expect';
import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';
import * as registry from '../../src/locale-data-registry';
import allLocaleData from '../../locale-data';
import defaultLocaleData from '../../src/en';

describe('locale data registry', () => {
    const IMF_LOCALE_DATA = {...IntlMessageFormat.__localeData__};
    const IRF_LOCALE_DATA = {...IntlRelativeFormat.__localeData__};

    const emptyLocaleData = () => {
        const emptyObject = (obj) => {
            Object.keys(obj).forEach((prop) => delete obj[prop]);
        };

        emptyObject(IntlMessageFormat.__localeData__);
        emptyObject(IntlRelativeFormat.__localeData__);
    };

    const restoreLocaleData = () => {
        emptyLocaleData();
        Object.assign(IntlMessageFormat.__localeData__, IMF_LOCALE_DATA);
        Object.assign(IntlRelativeFormat.__localeData__, IRF_LOCALE_DATA);
    };

    afterEach(() => {
        restoreLocaleData();
    });

    describe('exports', () => {
        it('exports `addLocaleData`', () => {
            expect(registry.addLocaleData).toBeA('function');
        });

        it('exports `hasLocaleData`', () => {
            expect(registry.hasLocaleData).toBeA('function');
        });
    });

    describe('hasLocaleData()', () => {
        beforeEach(() => {
            emptyLocaleData();
            // "en" is guaranteed to be included by default.
            IntlMessageFormat.__addLocaleData(IMF_LOCALE_DATA.en);
            IntlRelativeFormat.__addLocaleData(IRF_LOCALE_DATA.en);
        });

        it('does not throw when called with no arguments', () => {
            expect(() => registry.hasLocaleData()).toNotThrow();
        });

        it('returns `false` when called with no arguments', () => {
            expect(registry.hasLocaleData()).toBe(false);
        });

        it('returns `true` for built-in "en" locale', () => {
            expect(registry.hasLocaleData('en')).toBe(true);
        });

        it('normalizes the passed-in locale', () => {
            expect(registry.hasLocaleData('EN')).toBe(true);
            expect(registry.hasLocaleData('eN')).toBe(true);
            expect(registry.hasLocaleData('En')).toBe(true);
        });

        it('delegates to IntlMessageFormat and IntlRelativeFormat', () => {
            emptyLocaleData();
            expect(registry.hasLocaleData('en')).toBe(false);

            IntlMessageFormat.__addLocaleData(IMF_LOCALE_DATA.en);
            IntlRelativeFormat.__addLocaleData(IRF_LOCALE_DATA.en);
            expect(registry.hasLocaleData('en')).toBe(true);
        });

        it('requires both IntlMessageFormat and IntlRelativeFormat to have locale data', () => {
            emptyLocaleData();
            IntlMessageFormat.__addLocaleData(IMF_LOCALE_DATA.en);
            expect(registry.hasLocaleData('en')).toBe(false);
        });
    });

    describe('addLocaleData()', () => {
        beforeEach(() => {
            emptyLocaleData();
        });

        it('does not throw when called with no arguments', () => {
            expect(() => registry.addLocaleData()).toNotThrow();
        });

        it('adds locale data to the registry', () => {
            expect(registry.hasLocaleData(defaultLocaleData.locale)).toBe(false);

            registry.addLocaleData(defaultLocaleData);
            expect(registry.hasLocaleData(defaultLocaleData.locale)).toBe(true);
        });

        it('accepts an array of locale data', () => {
            expect(allLocaleData).toBeAn('array');

            const {locale} = allLocaleData[0];
            expect(registry.hasLocaleData(locale)).toBe(false);

            registry.addLocaleData(allLocaleData);
            expect(registry.hasLocaleData(locale)).toBe(true);
        });
    });
});
