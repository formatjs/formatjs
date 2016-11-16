import React from 'react';
import { Text } from 'react-native';
import {IntlProvider} from 'react-intl';
import App from './App';

export default class Root extends React.Component{
    render(){
        return (
            <IntlProvider locale="en" textComponent={Text}>
                <App />
            </IntlProvider>
        );
    }
}
