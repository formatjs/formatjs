/* jshint esnext:true */

// TODO: Use `import React from "react";` when external modules are supported.
import React from '../react';

import IntlMixin from '../mixin';

var IntlRelative = React.createClass({
    displayName: 'IntlRelative',
    mixins     : [IntlMixin],

    statics: {
        formatOptions: [
            'style', 'units'
        ]
    },

    propTypes: {
        format: React.PropTypes.string,
        value : React.PropTypes.any.isRequired
    },

    render: function () {
        var props    = this.props;
        var value    = props.value;
        var format   = props.format;
        var defaults = format && this.getNamedFormat('relative', format);
        var options  = IntlRelative.filterFormatOptions(props, defaults);

        return React.DOM.span(null, this.formatRelative(value, options));
    }
});

export default IntlRelative;
