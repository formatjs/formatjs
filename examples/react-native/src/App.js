import React, {Component} from 'react';
import {Text, View, StyleSheet} from 'react-native';
import {FormattedMessage} from 'react-intl';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name       : 'Eric',
            unreadCount: 1000,
        };
    }

    render() {
        const {name, unreadCount} = this.state;

        return (
            <View>
                <FormattedMessage
                    id="welcome"
                    defaultMessage={`Hello {name}, you have {unreadCount, number} {unreadCount, plural,
                      one {message}
                      other {messages}
                    }`}
                    values={{name: <Text style={localStyle.bold}>{name}</Text>, unreadCount}}
                />
            </View>
        );
    }
}

const localStyle = StyleSheet.create({
    bold:{
        fontWeight:'bold',
    },
});


export default App;
