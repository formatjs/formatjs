/* global React */
/* jslint esnext:true */

import IntlMixin from '../mixin';

var IntlTime = React.createClass({
    displayName: 'Time',
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
                IntlTime.filterFormatOptions(this.props);

        return React.DOM.span(null, this.formatTime(date, formatOpts));
    }
});

export default IntlTime;
