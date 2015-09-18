import React, {Component} from 'react';
import {intlShape, defineMessages} from 'react-intl';

const messages = defineMessages({
    enUSDescription: {
        id: 'menu.item_en_us_description',
        defaultMessage: 'The default locale of this example app.',
    },
    enUPPERDescription: {
        id: 'menu.item_en_upper_description',
        defaultMessage: 'The fake, all uppercase "locale" for this example app.',
    },
});

class LocalesMenu extends Component {
    render() {
        const {formatMessage} = this.context.intl;

        return (
            <menu>
                <li>
                    <a
                        href="/?locale=en-US"
                        title={formatMessage(messages.enUSDescription)}
                    >
                        en-US
                    </a>
                </li>

                <li>
                    <a
                        href="/?locale=en-UPPER"
                        title={formatMessage(messages.enUPPERDescription)}
                    >
                        en-UPPER
                    </a>
                </li>
            </menu>
        );
    }
}

LocalesMenu.contextTypes = {
    intl: intlShape.isRequired,
};

export default LocalesMenu;
