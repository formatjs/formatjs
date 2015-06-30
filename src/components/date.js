/* jshint esnext:true */

// TODO: Use `import React from "react";` when external modules are supported.
import React from '../react';

import IntlMixin from '../mixin';

var FormattedDate = React.createClass({
    displayName: 'FormattedDate',
    mixins     : [IntlMixin],

    statics: {
        formatOptions: [
            'localeMatcher', 'timeZone', 'hour12', 'formatMatcher', 'weekday',
            'era', 'year', 'month', 'day', 'hour', 'minute', 'second',
            'timeZoneName'
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
        var defaults  = format && this.getNamedFormat('date', format);
        var options   = FormattedDate.filterFormatOptions(props, defaults);

        return React.DOM.span({
            className: className,
            style    : style
        }, this.formatDate(value, options));
    }
});

export default FormattedDate;
