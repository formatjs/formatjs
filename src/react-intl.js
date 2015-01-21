/* jshint esnext: true */

import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';

import defaultLocale from './en';

import IntlMixin from './mixin';
import FormattedDate from './components/date';
import FormattedTime from './components/time';
import FormattedRelative from './components/relative';
import FormattedNumber from './components/number';
import FormattedMessage from './components/message';
import FormattedHTMLMessage from './components/html-message';

export {
    IntlMixin,
    FormattedDate,
    FormattedTime,
    FormattedRelative,
    FormattedNumber,
    FormattedMessage,
    FormattedHTMLMessage
};

export function __addLocaleData(data) {
    IntlMessageFormat.__addLocaleData(data);
    IntlRelativeFormat.__addLocaleData(data);
}

__addLocaleData(defaultLocale);
