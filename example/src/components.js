/** @jsx React.DOM */

(function (global) {

var IntlDate        = ReactIntl.Date;
var IntlTime        = ReactIntl.Time;
var IntlRelative    = ReactIntl.Relative;
var IntlNumber      = ReactIntl.Number;
var IntlMessage     = ReactIntl.Message;
var IntlHTMLMessage = ReactIntl.HTMLMessage;

var Another = React.createClass({
  mixins: [ReactIntlMixin],
  render: function () {
    return <div>
      <h2>Instance #{this.props.foo}</h2>
      <h3>formatDate() method with custom format</h3>
      {this.formatDate(new Date(), "time-style")}

      <h3>IntlDate component with custom format</h3>
      <IntlDate format="time-style">{new Date()}</IntlDate>

      <h3>formatNumber() method with custom format</h3>
      {this.formatNumber(600, "eur")}

      <h3>IntlNumber component with custom format</h3>
      <IntlNumber format="eur">{600}</IntlNumber>

      <h3>formatMessage() method</h3>
      {this.formatMessage(this.getIntlMessage('SHORT'), {
        product: 'apples',
        price: 2000.15,
        deadline: new Date(),
        timeZone: 'UTC'
      })}

      <h3>IntlMessage component</h3>
      <IntlMessage
          product="apples"
          price={2000.15}
          deadline={new Date()}
          timeZone="UTC">
        {this.getIntlMessage('SHORT')}
      </IntlMessage>
    </div>;
  }
});

var WrapIntlComponent = React.createClass({
  mixins: [ReactIntlMixin],
  render: function () {
    return <div>
        <h2>child component:</h2>
        <Another foo="4"></Another>
        {this.props.children}
    </div>;
  }
});

var Container = global.Container = React.createClass({
  mixins: [ReactIntlMixin],
  getDefaultProps: function() {
    return {
      someTimestamp: 1409939308585,
      locales: ["en-US"],
      formats: {
        date: {
          "time-style": {
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
          }
        },
        number: {
          eur: { style: 'currency', currency: 'EUR' },
          usd: { style: 'currency', currency: 'USD' }
        }
      }
    };
  },
  render: function () {
    return <div>
        <h1>Relative</h1>

        <h2>formatRelative() method</h2>
        {this.formatRelative(this.props.someTimestamp)}

        <h2>IntlRelative component</h2>
        <IntlRelative>{this.props.someTimestamp}</IntlRelative>

        <hr/>

        <h1>Date</h1>

        <h2>formatDate() method</h2>
        <h3>default</h3>
        {this.formatDate(this.props.someTimestamp)}
        <h3>with options</h3>
        {this.formatDate(this.props.someTimestamp, { hour: 'numeric', minute: 'numeric' })}
        <h3>with custom format</h3>
        {this.formatDate(this.props.someTimestamp, "time-style")}

        <h2>IntlDate component</h2>
        <h3>default</h3>
        <IntlDate>{this.props.someTimestamp}</IntlDate>
        <h3>with options</h3>
        <IntlDate hour="numeric" minute="numeric">{this.props.someTimestamp}</IntlDate>
        <h3>with custom format</h3>
        <IntlDate format="time-style">{this.props.someTimestamp}</IntlDate>

        <hr/>

        <h1>Number</h1>

        <h2>formatNumber() method</h2>
        <h3>default</h3>
        {this.formatNumber(400)}
        <h3>with options</h3>
        {this.formatNumber(0.40, { style: 'percent' })}
        <h3>with custom format</h3>
        {this.formatNumber(400, "eur")}

        <h2>IntlNumber component</h2>
        <h3>default</h3>
        <IntlNumber>{400}</IntlNumber>
        <h3>with options</h3>
        <IntlNumber style="percent">{0.40}</IntlNumber>
        <h3>with custom format</h3>
        <IntlNumber format="eur">{400}</IntlNumber>

        <hr/>

        <h1>Message</h1>

        <h3>formatMessage() method</h3>
        {this.formatMessage(this.getIntlMessage('LONG'), {
          product: 'oranges',
          price: 40000.004,
          deadline: this.props.someTimestamp,
          timeZone: 'UTC'
        })}

        <h3>IntlMessage component</h3>
        <IntlMessage
            product="oranges"
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC">
          {this.getIntlMessage('LONG')}
        </IntlMessage>

        <hr/>

        <h1>HTMLMessage</h1>

        <h3>IntlHTMLMessage component</h3>
        <IntlHTMLMessage
            product="oranges"
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC">
          {this.getIntlMessage('LONG_WITH_HTML')}
        </IntlHTMLMessage>

        <h3>IntlHTMLMessage component with XSS attempt</h3>
        <IntlHTMLMessage
            product="oranges</span><script>alert('pwnd!');</script>"
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC">
          {this.getIntlMessage('LONG_WITH_HTML')}
        </IntlHTMLMessage>

        <h3>IntlHTMLMessage component with custom tagName</h3>
        <IntlHTMLMessage
            __tagName="p"
            product="oranges"
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC">
          {this.getIntlMessage('LONG_WITH_HTML')}
        </IntlHTMLMessage>

        <hr/>

        <div>
            <h1>child component with explicit values for `locales` and `formats`</h1>
            <Another foo="1" formats={this.props.formats} locales={this.props.locales}></Another>
        </div>

        <div>
            <h1>child component that inherits `intl` configuration thru the parents chain</h1>
            <Another foo="2"></Another>
        </div>

        <hr/>

        <WrapIntlComponent locales={["pt-BR"]}>
          <Another foo="3"></Another>
        </WrapIntlComponent>

    </div>;
  }
});

})(typeof global !== 'undefined' ? global : window);
