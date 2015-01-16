/* jshint esnext:true */

// TODO: Use `import React from "react";` when external modules are supported.
import React from '../react';

import IntlMixin from '../mixin';

var IntlDate = React.createClass({
    displayName: 'IntlDate',
    mixins     : [IntlMixin],

    statics: {
        formatOptions: [
            'localeMatcher', 'timeZone', 'hour12', 'formatMatcher', 'weekday',
            'era', 'year', 'month', 'day', 'hour', 'minute', 'second',
            'timeZoneName'
        ]
    },

    render: function () {
        var props    = this.props;
        var value    = props.children;
        var defaults = props.format && this.getNamedFormat('date', props.format);
        var options  = IntlDate.filterFormatOptions(props, defaults);

        return React.DOM.span(null, this.formatDate(value, options));
    }
});

export default IntlDate;
