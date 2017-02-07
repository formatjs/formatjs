import Head from 'next/head';
import React, {Component} from 'react';
import {
  IntlProvider,
  FormattedMessage,
  FormattedNumber,
  defineMessages,
  injectIntl,
} from 'react-intl';
import pageWithIntl from '../components/PageWithIntl';

const messages = defineMessages({
  title: {
    id: 'title',
    defaultMessage: 'React Intl Next.js Example',
  },
  greeting: {
    id: 'greeting',
    defaultMessage: 'Hello World!',
  },
});

const Index = injectIntl(({intl}) => (
  <div>
    <Head>
      <title>{intl.formatMessage(messages.title)}</title>
    </Head>
    <p>
      <FormattedMessage {...messages.greeting}/>
    </p>
    <p>
      <FormattedNumber value={1000}/>
    </p>
  </div>
));

export default pageWithIntl(Index);
