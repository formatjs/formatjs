/** @jsx React.DOM */

(function (global) {

var Another = React.createClass({
  mixins: [ReactIntlMixin],
  render: function () {
    return <div>
      <h2>Instance #{this.props.foo}</h2>
      <h3>date helper with custom formatters:</h3>
      {this.formatDate(new Date(), "time-style")}

      <h3>number helper with custom formatters:</h3>
      {this.formatNumber(600, "eur")}

      <h3>message helper:</h3>
      {this.formatMessage(this.getIntlMessage('SHORT'), {
        product: 'apples',
        price: 2000.15,
        deadline: new Date(),
        timeZone: 'UTC'
      })}
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

var Container = global.ContainerComponent = React.createClass({
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
        <h1>`formatRelative` helper</h1>
        {this.formatRelative(this.props.someTimestamp)}

        <hr/>

        <h1>`formatDate` helper</h1>

        <h3>date helper:</h3>
        {this.formatDate(this.props.someTimestamp)}
        <h3>date helper with formatters:</h3>
        {this.formatDate(this.props.someTimestamp, { hour: 'numeric', minute: 'numeric' })}
        <h3>date helper with custom formatters:</h3>
        {this.formatDate(this.props.someTimestamp, "time-style")}

        <hr/>

        <h1>`formatNumber` helper</h1>

        <h3>number helper:</h3>
        {this.formatNumber(400)}
        <h3>number helper with formatters:</h3>
        {this.formatNumber(400, { style: 'percent' })}
        <h3>number helper with custom formatters:</h3>
        {this.formatNumber(400, "eur")}

        <hr/>

        <h1>`formatMessage` helper</h1>

        <h3>message helper:</h3>
        {this.formatMessage(this.getIntlMessage('LONG'), {
          product: 'oranges',
          price: 40000.004,
          deadline: this.props.someTimestamp,
          timeZone: 'UTC'
        })}

        <hr/>

        <div>
            <h2>child component with explicit values for `locales` and `formats`</h2>
            <Another foo="1" formats={this.props.formats} locales={this.props.locales}></Another>
        </div>

        <div>
            <h2>child component that inherits `intl` configuration thru the parents chain</h2>
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
