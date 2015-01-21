/** @jsx React.DOM */

(function (global) {

var IntlMixin            = ReactIntl.IntlMixin;
var FormattedDate        = ReactIntl.FormattedDate;
var FormattedTime        = ReactIntl.FormattedTime;
var FormattedRelative    = ReactIntl.FormattedRelative;
var FormattedNumber      = ReactIntl.FormattedNumber;
var FormattedMessage     = ReactIntl.FormattedMessage;
var FormattedHTMLMessage = ReactIntl.FormattedHTMLMessage;

var Another = React.createClass({
  mixins: [IntlMixin],
  render: function () {
    return <div>
      <h2>Instance #{this.props.foo}</h2>
      <h3>formatDate() method with custom format</h3>
      {this.formatDate(new Date(), "time-style")}

      <h3>FormattedDate component with custom format</h3>
      <FormattedDate value={new Date()} format="time-style" />

      <h3>formatNumber() method with custom format</h3>
      {this.formatNumber(600, "eur")}

      <h3>FormattedNumber component with custom format</h3>
      <FormattedNumber value={600} format="eur" />

      <h3>formatMessage() method</h3>
      {this.formatMessage(this.getIntlMessage('SHORT'), {
        product: 'apples',
        price: 2000.15,
        deadline: new Date(),
        timeZone: 'UTC'
      })}

      <h3>FormattedMessage component</h3>
      <FormattedMessage message={this.getIntlMessage('SHORT')}
          product="apples"
          price={2000.15}
          deadline={new Date()}
          timeZone="UTC" />
    </div>;
  }
});

var WrapIntlComponent = React.createClass({
  mixins: [IntlMixin],
  render: function () {
    return <div>
        <h2>child component:</h2>
        <Another foo="4"></Another>
        {this.props.children}
    </div>;
  }
});

var Container = global.ContainerComponent = React.createClass({
  mixins: [IntlMixin],
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

        <h2>FormattedRelative component</h2>
        <FormattedRelative value={this.props.someTimestamp} />

        <hr/>

        <h1>Date</h1>

        <h2>formatDate() method</h2>
        <h3>default</h3>
        {this.formatDate(this.props.someTimestamp)}
        <h3>with options</h3>
        {this.formatDate(this.props.someTimestamp, { hour: 'numeric', minute: 'numeric' })}
        <h3>with custom format</h3>
        {this.formatDate(this.props.someTimestamp, "time-style")}

        <h2>FormattedDate component</h2>
        <h3>default</h3>
        <FormattedDate value={this.props.someTimestamp} />
        <h3>with options</h3>
        <FormattedDate value={this.props.someTimestamp} hour="numeric" minute="numeric" />
        <h3>with custom format</h3>
        <FormattedDate value={this.props.someTimestamp} format="time-style" />

        <hr/>

        <h1>Number</h1>

        <h2>formatNumber() method</h2>
        <h3>default</h3>
        {this.formatNumber(400)}
        <h3>with options</h3>
        {this.formatNumber(0.40, { style: 'percent' })}
        <h3>with custom format</h3>
        {this.formatNumber(400, "eur")}

        <h2>FormattedNumber component</h2>
        <h3>default</h3>
        <FormattedNumber value={400} />
        <h3>with options</h3>
        <FormattedNumber value={0.40} style="percent" />
        <h3>with custom format</h3>
        <FormattedNumber value={400} format="eur" />

        <hr/>

        <h1>Message</h1>

        <h3>formatMessage() method</h3>
        {this.formatMessage(this.getIntlMessage('LONG'), {
          product: 'oranges',
          price: 40000.004,
          deadline: this.props.someTimestamp,
          timeZone: 'UTC'
        })}

        <h3>FormattedMessage component</h3>
        <FormattedMessage message={this.getIntlMessage('LONG')}
            product="oranges"
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC" />

        <hr/>

        <h1>Message with HTML</h1>

        <h3>FormattedMessage component with HTML</h3>
        <FormattedMessage message={this.getIntlMessage('LONG')}
          product={<strong>oranges</strong>}
          price={40000.004}
          deadline={this.props.someTimestamp}
          timeZone="UTC" />

        <h3>FormattedMessage component with XSS attempt</h3>
        <FormattedMessage message={this.getIntlMessage('LONG')}
            product="oranges</span><script>alert('pwnd!');</script>"
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC" />

        <h3>FormattedMessage component with custom tagName</h3>
        <FormattedMessage tagName="p" message={this.getIntlMessage('LONG')}
            product={<strong>oranges</strong>}
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC" />

        <h3>FormattedHTMLMessage component</h3>
        <FormattedHTMLMessage message={this.getIntlMessage('LONG_WITH_HTML')}
            product="oranges"
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC" />

        <h3>FormattedHTMLMessage component with XSS attempt</h3>
        <FormattedHTMLMessage message={this.getIntlMessage('LONG_WITH_HTML')}
            product="oranges</span><script>alert('pwnd!');</script>"
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC" />

        <h3>FormattedHTMLMessage component with custom tagName</h3>
        <FormattedHTMLMessage tagName="p" message={this.getIntlMessage('LONG_WITH_HTML')}
            product="oranges"
            price={40000.004}
            deadline={this.props.someTimestamp}
            timeZone="UTC" />

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
