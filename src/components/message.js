/* global React */
/* jslint esnext:true */

import IntlMixin from '../mixin';

var IntlMessage = React.createClass({
    displayName: 'IntlMessage',
    mixins     : [IntlMixin],

    render: function () {
        var props   = this.props;
        var message = props.children;

        return React.DOM.span(null, this.formatMessage(message, props));
    }
});

export default IntlMessage;
