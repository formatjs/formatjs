/* jshint esnext:true */

// TODO: Use `import React from "react";` when external modules are supported.
import React from '../react';

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
        var props    = this.props;
        var value    = props.children;
        var defaults = props.format && this.getNamedFormat('number', props.format);
        var options  = IntlNumber.filterFormatOptions(props, defaults);

        return React.DOM.span(null, this.formatNumber(value, options));
    }
});

export default IntlNumber;
