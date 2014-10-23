/* global React */
/* jslint esnext:true */

import IntlMixin from '../mixin';

var IntlRelative = React.createClass({
    displayName: 'IntlRelative',
    mixins     : [IntlMixin],

    statics: {
        formatOptions: [
            'style', 'units'
        ]
    },

    render: function () {
        var props      = this.props;
        var date       = props.children;
        var formatOpts = props.format || IntlRelative.filterFormatOptions(props);

        return React.DOM.span(null, this.formatRelative(date, formatOpts));
    }
});

export default IntlRelative;
