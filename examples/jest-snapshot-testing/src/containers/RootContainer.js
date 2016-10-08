import React from 'react';
import { IntlProvider } from 'react-intl';
import App from '../components/App';

const RootContainer = () => (
    <IntlProvider locale="en">
        <App/>
    </IntlProvider>
);

export default RootContainer;
