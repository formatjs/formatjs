import expect from 'expect';
import IntlRelativeFormat from 'intl-relativeformat';
import * as registry from '../../src/locale-data-registry';
import allLocaleData from '../../locale-data';
import defaultLocaleData from '../../src/en';

describe('locale data registry', () => {
    const IRF_LOCALE_DATA = {...IntlRelativeFormat.__localeData__};

    const emptyLocaleData = () => {
        const emptyObject = (obj) => {
            Object.keys(obj).forEach((prop) => delete obj[prop]);
        };

        emptyObject(IntlRelativeFormat.__localeData__);
    };

    const restoreLocaleData = () => {
        emptyLocaleData();
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

        it('delegates to IntlRelativeFormat', () => {
            emptyLocaleData();
            expect(registry.hasLocaleData('en')).toBe(false);

            IntlRelativeFormat.__addLocaleData(IRF_LOCALE_DATA.en);
            expect(registry.hasLocaleData('en')).toBe(true);
        });

        it('requires IntlRelativeFormat to have locale data', () => {
            emptyLocaleData();
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
