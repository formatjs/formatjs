/* jshint esnext:true */

// TODO: Use `import React from "react";` when external modules are supported.
import React from '../react';

import IntlMixin from '../mixin';

var FormattedRelative = React.createClass({
    displayName: 'FormattedRelative',
    mixins     : [IntlMixin],

    statics: {
        formatOptions: [
            'style', 'units'
        ]
    },

    propTypes: {
        format: React.PropTypes.string,
        value : React.PropTypes.any.isRequired,
        now   : React.PropTypes.any
    },

    getDefaultProps: function () {
        return {tagName: 'span'};
    },

    render: function () {
        var props    = this.props;
        var tagName  = props.tagName;
        var value    = props.value;
        var format   = props.format;
        var defaults = format && this.getNamedFormat('relative', format);
        var options  = FormattedRelative.filterFormatOptions(props, defaults);

        var formattedRelativeTime = this.formatRelative(value, options, {
            now: props.now
        });

        return React.DOM[tagName](null, formattedRelativeTime);
    }
});

export default FormattedRelative;
