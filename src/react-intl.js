/* jshint esnext: true */

import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';

import defaultLocale from './en';

import IntlMixin from './mixin';
import IntlDate from './components/date';
import IntlTime from './components/time';
import IntlRelative from './components/relative';
import IntlNumber from './components/number';
import IntlMessage from './components/message';
import IntlHTMLMessage from './components/html-message';

export {
    IntlMixin,
    IntlDate,
    IntlTime,
    IntlRelative,
    IntlNumber,
    IntlMessage,
    IntlHTMLMessage
};

export function __addLocaleData(data) {
    IntlMessageFormat.__addLocaleData(data);
    IntlRelativeFormat.__addLocaleData(data);
}

__addLocaleData(defaultLocale);
