/* global React */
/* jslint esnext:true */

import escape from '../escape';
import IntlMixin from '../mixin';

function escapeProps(props) {
    return Object.keys(props).reduce(function (escapedProps, name) {
        var value = props[name];

        // TODO: Can we force string coersion here? Or would that not be needed
        // and possible mess with IntlMessageFormat?
        if (typeof value === 'string') {
            value = escape(value);
        }

        escapedProps[name] = value;
        return escapedProps;
    }, {});
}

var IntlHTMLMessage = React.createClass({
    displayName: 'HTMLMessage',
    mixins     : [IntlMixin],

    render: function () {
        var message      = React.Children.only(this.props.children);
        var escapedProps = escapeProps(this.props);

        // Since the message presumably has HTML in it, we need to set
        // `innerHTML` in order for it to be rendered and not escaped by React.
        // To be safe, we are escaping all string prop values before formatting
        // the message. It is assumed that the message is not UGC, and came from
        // the developer making it more like a template.
        return React.DOM.span({
            dangerouslySetInnerHTML: {
                __html: this.formatMessage(message, escapedProps)
            }
        });
    }
});

export default IntlHTMLMessage;
