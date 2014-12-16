/* jshint esnext: true */

import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';

import defaultLocale from './en';
import Mixin from './mixin';

import Date from './components/date';
import Time from './components/time';
import Relative from './components/relative';
import Number from './components/number';
import Message from './components/message';
import HTMLMessage from './components/html-message';

export {Mixin, Date, Time, Relative, Number, Message, HTMLMessage};

export function __addLocaleData(data) {
    IntlMessageFormat.__addLocaleData(data);
    IntlRelativeFormat.__addLocaleData(data);
}

__addLocaleData(defaultLocale);
