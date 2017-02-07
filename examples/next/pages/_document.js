import Document, {Head, Main, NextScript} from 'next/document';

export default class IntlDocument extends Document {
  static async getInitialProps(context) {
    const props = await super.getInitialProps(context);
    const {req: {localeData}} = context;
    return {
      ...props,
      localeData,
    };
  }

  render() {
    return (
      <html>
        <Head/>
        <body>
          <Main/>
          <script dangerouslySetInnerHTML={{__html: this.props.localeData}}/>
          <NextScript/>
        </body>
      </html>
    );
  }
}
