/* global React */
/* jslint esnext:true */

import IntlMixin from './mixin';

var IntlNumber = React.createClass({
    displayName: 'Number',
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
        var num = React.Children.only(this.props.children);

        var formatOpts = this.props.format ||
                IntlNumber.filterFormatOptions(this.props);

        return React.DOM.span(null, this.formatNumber(num, formatOpts));
    }
});

export default IntlNumber;
