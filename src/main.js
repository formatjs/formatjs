/* jslint esnext: true */

import {
    Mixin,
    Date,
    Time,
    Relative,
    Number,
    Message,
    HTMLMessage,
    __addLocaleData
} from './react-intl';

export default {
    Mixin      : Mixin,
    Date       : Date,
    Time       : Time,
    Relative   : Relative,
    Number     : Number,
    Message    : Message,
    HTMLMessage: HTMLMessage,

    __addLocaleData: __addLocaleData
};

// Back-compat for v1.0.0. This adds a `ReactIntlMixin` global that references
// the mixin directly. This will be deprecated in v2.0.0.
if (typeof window !== 'undefined') {
    window.ReactIntlMixin = Mixin;
    Mixin.__addLocaleData = __addLocaleData;
}
