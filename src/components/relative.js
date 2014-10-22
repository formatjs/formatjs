/* global React */
/* jslint esnext:true */

import IntlMixin from '../mixin';

var IntlRelative = React.createClass({
    displayName: 'Relative',
    mixins     : [IntlMixin],

    statics: {
        formatOptions: [
            'style', 'units'
        ]
    },

    render: function () {
        var date = React.Children.only(this.props.children);

        var formatOpts = this.props.format ||
                IntlRelative.filterFormatOptions(this.props);

        return React.DOM.span(null, this.formatRelative(date, formatOpts));
    }
});

export default IntlRelative;
