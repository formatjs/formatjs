import React, {Component} from 'react';
import {FormattedMessage, FormattedRelative} from 'react-intl';
import Link from 'next/link';
import pageWithIntl from '../components/PageWithIntl';
import Layout from '../components/Layout';

class About extends Component {
  static async getInitialProps({req}) {
    return {someDate: Date.now()};
  }

  render() {
    return (
      <Layout>
        <p>
          <FormattedRelative
            value={this.props.someDate}
            updateInterval={1000}
          />
        </p>
      </Layout>
    );
  }
}

export default pageWithIntl(About);
