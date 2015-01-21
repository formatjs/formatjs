/* jshint esnext: true */

import {
    IntlMixin,
    FormattedDate,
    FormattedTime,
    FormattedRelative,
    FormattedNumber,
    FormattedMessage,
    FormattedHTMLMessage,
    __addLocaleData
} from './react-intl';

export default {
    IntlMixin           : IntlMixin,
    FormattedDate       : FormattedDate,
    FormattedTime       : FormattedTime,
    FormattedRelative   : FormattedRelative,
    FormattedNumber     : FormattedNumber,
    FormattedMessage    : FormattedMessage,
    FormattedHTMLMessage: FormattedHTMLMessage,

    __addLocaleData: __addLocaleData
};

// Back-compat for v1.0.0. This adds a `ReactIntlMixin` global that references
// the mixin directly. This will be deprecated in v2.0.0.
if (typeof window !== 'undefined') {
    window.ReactIntlMixin     = IntlMixin;
    IntlMixin.__addLocaleData = __addLocaleData;
}
