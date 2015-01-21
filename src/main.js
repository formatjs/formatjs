/* jshint esnext: true */

import {
    IntlMixin,
    IntlDate,
    IntlTime,
    IntlRelative,
    IntlNumber,
    IntlMessage,
    IntlHTMLMessage,
    __addLocaleData
} from './react-intl';

export default {
    IntlMixin      : IntlMixin,
    IntlDate       : IntlDate,
    IntlTime       : IntlTime,
    IntlRelative   : IntlRelative,
    IntlNumber     : IntlNumber,
    IntlMessage    : IntlMessage,
    IntlHTMLMessage: IntlHTMLMessage,
    __addLocaleData: __addLocaleData
};

// Back-compat for v1.0.0. This adds a `ReactIntlMixin` global that references
// the mixin directly. This will be deprecated in v2.0.0.
if (typeof window !== 'undefined') {
    window.ReactIntlMixin = IntlMixin;
    IntlMixin.__addLocaleData = __addLocaleData;
}
