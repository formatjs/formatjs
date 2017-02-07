import React, {Component} from 'react';
import {IntlProvider, addLocaleData} from 'react-intl';

if (typeof window !== 'undefined' && window.ReactIntlLocaleData) {
  Object.keys(window.ReactIntlLocaleData).forEach((lang) => {
    addLocaleData(window.ReactIntlLocaleData[lang]);
  });
}

export default (WrappedComponent) => class PageWithIntl extends Component {
  static async getInitialProps(context) {
    let props;
    if (typeof WrappedComponent.getInitialProps === 'function') {
      props = await WrappedComponent.getInitialProps(context);
    }

    const {req} = context;
    const {locale, messages} = req ? req : window.__NEXT_DATA__.props;

    return {
      ...props,
      locale,
      messages,
    };
  }

  render() {
    const {locale, messages, ...props} = this.props;
    return (
      <IntlProvider locale={locale} messages={messages}>
        <WrappedComponent {...props}/>
      </IntlProvider>
    );
  }
};
