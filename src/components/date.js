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
        var props      = this.props;
        var date       = props.children;
        var formatOpts = props.format || IntlDate.filterFormatOptions(props);

        return React.DOM.span(null, this.formatDate(date, formatOpts));
    }
});

export default IntlDate;
