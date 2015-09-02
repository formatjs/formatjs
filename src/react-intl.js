import {__addLocaleData as addIMFLocaleData} from 'intl-messageformat';
import {__addLocaleData as addIRFLocaleData} from 'intl-relativeformat';
import defaultLocaleData from './en';

export {default as IntlProvider} from './components/intl';
export {default as FormattedGroup} from './components/group';
export {default as FormattedDate} from './components/date';
export {default as FormattedTime} from './components/time';
export {default as FormattedRelative} from './components/relative';
export {default as FormattedNumber} from './components/number';
export {default as FormattedPlural} from './components/plural';
export {default as FormattedMessage} from './components/message';
export {default as FormattedHTMLMessage} from './components/html-message';

export {intlShape} from './types';

export function defineMessage(messageDescriptor) {
    // TODO: Type check in dev? Return something different?
    return messageDescriptor;
}

export function addLocaleData(data = []) {
    let locales = Array.isArray(data) ? data : [data];

    locales.forEach((localeData) => {
        addIMFLocaleData(localeData);
        addIRFLocaleData(localeData);
    });
}

addLocaleData(defaultLocaleData);
