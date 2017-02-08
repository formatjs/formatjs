import Document, {Head, Main, NextScript} from 'next/document';

export default class IntlDocument extends Document {
  static async getInitialProps(context) {
    const props = await super.getInitialProps(context);
    const {req: {localeDataScript}} = context;
    return {
      ...props,
      localeDataScript,
    };
  }

  render() {
    return (
      <html>
        <Head/>
        <body>
          <Main/>
          <script
            dangerouslySetInnerHTML={{
              __html: this.props.localeDataScript
            }}
          />
          <NextScript/>
        </body>
      </html>
    );
  }
}
