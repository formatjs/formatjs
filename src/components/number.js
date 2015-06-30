/* jshint esnext:true */

// TODO: Use `import React from "react";` when external modules are supported.
import React from '../react';

import IntlMixin from '../mixin';

var FormattedNumber = React.createClass({
    displayName: 'FormattedNumber',
    mixins     : [IntlMixin],

    statics: {
        formatOptions: [
            'localeMatcher', 'style', 'currency', 'currencyDisplay',
            'useGrouping', 'minimumIntegerDigits', 'minimumFractionDigits',
            'maximumFractionDigits', 'minimumSignificantDigits',
            'maximumSignificantDigits'
        ]
    },

    propTypes: {
        format   : React.PropTypes.string,
        value    : React.PropTypes.any.isRequired,
        className: React.PropTypes.string,
        style    : React.PropTypes.object
    },

    render: function () {
        var props     = this.props;
        var value     = props.value;
        var format    = props.format;
        var className = props.className;
        var style     = props.style;
        var defaults  = format && this.getNamedFormat('number', format);
        var options   = FormattedNumber.filterFormatOptions(props, defaults);

        return React.DOM.span({
            className: className,
            style    : style
        }, this.formatNumber(value, options));
    }
});

export default FormattedNumber;
