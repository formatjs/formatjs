/* jshint esnext:true */

// TODO: Use `import React from "react";` when external modules are supported.
import React from '../react';

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
    displayName: 'IntlHTMLMessage',
    mixins     : [IntlMixin],

    getDefaultProps: function () {
        return {__tagName: 'span'};
    },

    render: function () {
        var props        = this.props;
        var tagName      = props.__tagName;
        var message      = props.children;
        var escapedProps = escapeProps(props);

        // Since the message presumably has HTML in it, we need to set
        // `innerHTML` in order for it to be rendered and not escaped by React.
        // To be safe, we are escaping all string prop values before formatting
        // the message. It is assumed that the message is not UGC, and came from
        // the developer making it more like a template.
        return React.DOM[tagName]({
            dangerouslySetInnerHTML: {
                __html: this.formatMessage(message, escapedProps)
            }
        });
    }
});

export default IntlHTMLMessage;
