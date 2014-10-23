/* global React */
/* jslint esnext:true */

import IntlMixin from '../mixin';

var IntlTime = React.createClass({
    displayName: 'IntlTime',
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
        var formatOpts = props.format || IntlTime.filterFormatOptions(props);

        return React.DOM.span(null, this.formatTime(date, formatOpts));
    }
});

export default IntlTime;
