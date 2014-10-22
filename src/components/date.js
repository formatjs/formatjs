/* global React */
/* jslint esnext:true */

import IntlMixin from '../mixin';

var IntlDate = React.createClass({
    displayName: 'Date',
    mixins     : [IntlMixin],

    statics: {
        formatOptions: [
            'localeMatcher', 'timeZone', 'hour12', 'formatMatcher', 'weekday',
            'era', 'year', 'month', 'day', 'hour', 'minute', 'second',
            'timeZoneName'
        ]
    },

    render: function () {
        var date = React.Children.only(this.props.children);

        var formatOpts = this.props.format ||
                IntlDate.filterFormatOptions(this.props);

        return React.DOM.span(null, this.formatDate(date, formatOpts));
    }
});

export default IntlDate;
