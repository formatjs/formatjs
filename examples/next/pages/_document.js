import Document, {Head, Main, NextScript} from 'next/document';

export default class IntlDocument extends Document {
  static async getInitialProps(context) {
    const props = await super.getInitialProps(context);
    const {req: {locale, localeData, messages}} = context;
    return {
      ...props,
      locale,
      localeData,
      messages,
    };
  }

  render() {
    const {locale, localeData, messages} = this.props;
    return (
      <html>
        <Head/>
        <body>
          <Main/>
          <script dangerouslySetInnerHTML={{__html: localeData}}/>
          <script dangerouslySetInnerHTML={{
            __html: `__REACT_INTL__ = ${JSON.stringify({locale, messages})}`,
          }}/>
          <NextScript/>
        </body>
      </html>
    );
  }
}
