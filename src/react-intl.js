/* jslint esnext: true */

import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';

import Mixin from './mixin';
import Date from './date';
import Time from './time';
import Relative from './relative';
import Number from './number';
import Message from './message';

import defaultLocale from './en';

export {Mixin, Date, Time, Relative, Number, Message};

export function __addLocaleData(data) {
    IntlMessageFormat.__addLocaleData(data);
    IntlRelativeFormat.__addLocaleData(data);
}

__addLocaleData(defaultLocale);
