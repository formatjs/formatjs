/* global React */
/* jslint esnext:true */

import IntlMixin from '../mixin';

var IntlNumber = React.createClass({
    displayName: 'IntlNumber',
    mixins     : [IntlMixin],

    statics: {
        formatOptions: [
            'localeMatcher', 'style', 'currency', 'currencyDisplay',
            'useGrouping', 'minimumIntegerDigits', 'minimumFractionDigits',
            'maximumFractionDigits', 'minimumSignificantDigits',
            'maximumSignificantDigits'
        ]
    },

    render: function () {
        var props      = this.props;
        var num        = props.children;
        var formatOpts = props.format || IntlNumber.filterFormatOptions(props);

        return React.DOM.span(null, this.formatNumber(num, formatOpts));
    }
});

export default IntlNumber;
