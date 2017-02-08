import Head from 'next/head';
import React, {Component} from 'react';
import {
  IntlProvider,
  FormattedMessage,
  FormattedNumber,
  defineMessages,
} from 'react-intl';
import pageWithIntl from '../components/PageWithIntl';
import Layout from '../components/Layout';

export default pageWithIntl(({intl}) => (
  <Layout>
    <p>
      <FormattedMessage id='greeting' defaultMessage='Hello, World!'/>
    </p>
    <p>
      <FormattedNumber value={1000}/>
    </p>
  </Layout>
));
