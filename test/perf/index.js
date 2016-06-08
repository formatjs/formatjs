/* eslint prefer-arrow-callback:0 */

import 'intl';
import {Suite} from 'benchmark';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
    IntlProvider,
    FormattedNumber,
    FormattedDate,
    FormattedMessage,
    FormattedRelative,
} from '../../lib/';

const suite = new Suite('renderToString', {
    onCycle: function (e) {
        console.log(String(e.target));
    },
});

suite.on('error', function (e) {
    throw e.target.error;
});

const intlProvider = new IntlProvider({locale: 'en'}, {});

suite.add('IntlProvider#getChildContext()', function () {
    intlProvider.getChildContext();
});

const intlProviderContext = intlProvider.getChildContext();
const intlProvider2 = new IntlProvider({locale: 'en'}, intlProviderContext);

suite.add('IntlProvider#shouldComponentUpdate()', function () {
    intlProvider2.shouldComponentUpdate(
        {locale: 'en'},
        intlProvider2.state,
        intlProviderContext
    );
});

suite.add('<div>', function () {
    ReactDOMServer.renderToString(
        <div />
    );
});

suite.add('<IntlProvider>', function () {
    ReactDOMServer.renderToString(
        <IntlProvider locale='en'>
            <div />
        </IntlProvider>
    );
});

suite.add('100 x <FormattedNumber>', function () {
    let formattedNumbers = [];
    for (let i = 0, len = 100; i < len; i += 1) {
        formattedNumbers.push(
            <FormattedNumber value={i} key={i} />
        );
    }

    ReactDOMServer.renderToString(
        <IntlProvider locale='en'>
            <div>{formattedNumbers}</div>
        </IntlProvider>
    );
});

suite.add('100 x <FormattedDate>', function () {
    let now = Date.now();
    let formattedDates = [];
    for (let i = 0, len = 100; i < len; i += 1) {
        formattedDates.push(
            <FormattedDate value={now - (1000 * 60 * i)} key={i} />
        );
    }

    ReactDOMServer.renderToString(
        <IntlProvider locale='en'>
            <div>{formattedDates}</div>
        </IntlProvider>
    );
});

suite.add('100 x <FormattedMessage>', function () {
    let messages = {};
    let formattedMessages = [];
    for (let i = 0, len = 100; i < len; i += 1) {
        messages[i] = `message ${i}`;
        formattedMessages.push(
            <FormattedMessage id={`${i}`} key={i} />
        );
    }

    ReactDOMServer.renderToString(
        <IntlProvider locale='en' messages={messages}>
            <div>{formattedMessages}</div>
        </IntlProvider>
    );
});

suite.add('100 x <FormattedMessage> with placeholder', function () {
    let messages = {};
    let formattedMessages = [];
    for (let i = 0, len = 100; i < len; i += 1) {
        messages[i] = `message {${i}, number}`;
        formattedMessages.push(
            <FormattedMessage id={`${i}`} values={{[i]: i}} key={i} />
        );
    }

    ReactDOMServer.renderToString(
        <IntlProvider locale='en' messages={messages}>
            <div>{formattedMessages}</div>
        </IntlProvider>
    );
});

suite.add('100 x <FormattedMessage> with placeholder, cached', function () {
    let messages = {};
    let formattedMessages = [];
    for (let i = 0, len = 100; i < len; i += 1) {
        messages[i] = `message {${0}, number}`;
        formattedMessages.push(
            <FormattedMessage id={`${i}`} values={{0: i}} key={i} />
        );
    }

    ReactDOMServer.renderToString(
        <IntlProvider locale='en' messages={messages}>
            <div>{formattedMessages}</div>
        </IntlProvider>
    );
});

suite.add('100 x <FormattedRelative>', function () {
    let now = Date.now();
    let formattedRelativeTimes = [];
    for (let i = 0, len = 100; i < len; i += 1) {
        formattedRelativeTimes.push(
            <FormattedRelative value={now - (1000 * 60 * i)} key={i} />
        );
    }

    ReactDOMServer.renderToString(
        <IntlProvider locale='en'>
            <div>{formattedRelativeTimes}</div>
        </IntlProvider>
    );
});

suite.run();
