import React, {Component, PropTypes} from 'react';
import {intlContextTypes, formatMessage} from 'react-intl';

class LocalesMenu extends Component {
    render() {
        const {intl} = this.context;

        let enUSDescription = formatMessage(intl, {
            id: 'menu.item_en_us_description',
            defaultMessage: 'The default locale of this example app.',
        });

        let enUPPERDescription = formatMessage(intl, {
            id: 'menu.item_en_upper_description',
            defaultMessage: 'The fake, all uppercase "locale" for this example app.',
        });

        return (
            <menu>
                <li>
                    <a href="/?locale=en-US" title={enUSDescription}>en-US</a>
                </li>

                <li>
                    <a href="/?locale=en-UPPER" title={enUPPERDescription}>en-UPPER</a>
                </li>
            </menu>
        );
    }
}

LocalesMenu.contextTypes = {
    intl: PropTypes.shape(intlContextTypes).isRequired,
};

export default LocalesMenu;
