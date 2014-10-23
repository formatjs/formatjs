/* global React */
/* jslint esnext:true */

import IntlMixin from '../mixin';

var IntlMessage = React.createClass({
    displayName: 'Message',
    mixins     : [IntlMixin],

    render: function () {
        var message = React.Children.only(this.props.children);
        return React.DOM.span(null, this.formatMessage(message, this.props));
    }
});

export default IntlMessage;
