import React, {PropTypes} from 'react';
import {IntlProvider, FormattedMessage} from 'react-intl';
import Message from './message';

const Container = ({getIntlMessages, app}) => (
    <div>
        <p>
            <IntlProvider messages={getIntlMessages('container')}>
                <FormattedMessage
                    id="header"
                    defaultMessage={'This is a container in '}
                />
            </IntlProvider>
            {/* We don't know what app exactly is. It may be some element tree,
                that may be wrapped in a provider or may use parent scope. */}
            <b>{app}</b>
            .
        </p>
        <p>
            <IntlProvider messages={getIntlMessages('container')}>
                <FormattedMessage
                    id="intro"
                    defaultMessage={'And it displays a message:'}
                />
            </IntlProvider>
        </p>
        <p>
            {/* Could we wrap the whole message in container's provider?
                No, as it may need access to the global message scope. */}
            <Message getIntlMessages={getIntlMessages} app={app} container={
                <IntlProvider messages={getIntlMessages('container')}>
                    <FormattedMessage
                        id="container"
                        defaultMessage={'Container'}
                    />
                </IntlProvider>
            } />
        </p>
    </div>
);

Container.propTypes = {
    getIntlMessages: PropTypes.func.isRequired,
    app: PropTypes.element.isRequired,
};

export default Container;
