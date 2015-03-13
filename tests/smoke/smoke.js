/*global describe, it, expect, React, ReactIntl*/
describe('React Intl', function () {
    var IntlMixin            = ReactIntl.IntlMixin;
    var FormattedNumber      = React.createFactory(ReactIntl.FormattedNumber);
    var FormattedDate        = React.createFactory(ReactIntl.FormattedDate);
    var FormattedTime        = React.createFactory(ReactIntl.FormattedTime);
    var FormattedRelative    = React.createFactory(ReactIntl.FormattedRelative);
    var FormattedMessage     = React.createFactory(ReactIntl.FormattedMessage);
    var FormattedHTMLMessage = React.createFactory(ReactIntl.FormattedHTMLMessage);

    it('Formats numbers correctly', function () {
        var FormattedNumberComponent = React.createClass({
            displayName: 'FormattedNumber',

            mixins: [IntlMixin],

            render: function () {
                return React.DOM.div(null, this.formatNumber(1000));
            }
        });

        var FormattedNumber = React.createFactory(FormattedNumberComponent);
        var testNode = document.getElementById('test1');

        React.render(FormattedNumber({
            locales: ['es-AR']
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.equal('1.000');
    });

    it('Formats numbers correctly using FormattedNumber component', function () {
        var testNode = document.getElementById('test1');

        React.render(FormattedNumber({
            locales: ['es-AR'],
            value: 1000
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.equal('1.000');
    });

    it('Formats numbers correctly using named formats', function () {
        var testNode = document.getElementById('test1');

        var price = {
            value: 99.95,
            currency: 'USD'
        };

        React.render(FormattedNumber({
            locales: ['en-US'],
            formats: {
                number: {
                    currency: {
                        style: 'currency',
                        minimumFractionDigits: 2
                    }
                }
            },

            value: price.value,
            format: 'currency',
            currency: price.currency
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.equal('$99.95');
    });

    it('Formats dates correctly', function () {
        var FormattedDateComponent = React.createClass({
            displayName: 'FormattedDate',

            mixins: [IntlMixin],

            render: function () {
                return React.DOM.div(null, this.formatDate(this.props.date, {
                    weekday: 'long',
                    timeZone: 'UTC'
                }));
            }
        });

        var FormattedDate = React.createFactory(FormattedDateComponent);
        var testNode = document.getElementById('test2');

        React.render(FormattedDate({
            locales: ['es-AR'],
            date: Date.UTC(2014, 8, 22, 0, 0, 0, 0)
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.contain('lunes');

        React.render(FormattedDate({
            locales: ['en-US'],
            date: 0
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.contain('Thursday');
    });

    it('Formats dates correctly using FormattedDate component', function () {
        var testNode = document.getElementById('test2');

        React.render(FormattedDate({
            locales: ['es-AR'],
            value: Date.UTC(2014, 8, 22, 0, 0, 0, 0),
            weekday: 'long',
            timeZone: 'UTC'
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.contain('lunes');

        React.render(FormattedDate({
            locales: ['en-US'],
            value: 0,
            weekday: 'long',
            timeZone: 'UTC'
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.contain('Thursday');
    });

    it('Formats messages correctly', function () {
        var FormattedMessageComponent = React.createClass({
            displayName: 'FormattedMessage',

            mixins: [IntlMixin],

            getMyMessage: function () {
                return 'You have {numPhotos, plural, =0 {no photos} =1 {one photo} other {# photos}}.';
            },

            render: function () {
                return React.DOM.div(null, this.formatMessage(this.getMyMessage(), {
                    numPhotos: this.props.numPhotos
                }));
            }
        });

        var FormattedMessage = React.createFactory(FormattedMessageComponent);
        var testNode = document.getElementById('test3');

        React.render(FormattedMessage({
            locales: ['en-US'],
            numPhotos: 1
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.equal('You have one photo.');
    });

    it('Formats messages correctly using FormattedMessage component', function () {
        var testNode = document.getElementById('test3');

        React.render(FormattedMessage({
            locales: ['en-US'],
            message: 'You have {numPhotos, plural, =0 {no photos} =1 {one photo} other {# photos}}.',
            numPhotos: 1
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.equal('You have one photo.');
    });

    it('Formats relative times correctly using FormattedRelative component', function () {
        var testNode = document.getElementById('test4');

        React.render(FormattedRelative({
            value: new Date().getTime()
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.contain('now');
    });

    it('Supports passing `now` to the FormattedRelative component', function () {
        var testNode = document.getElementById('test4');

        React.render(FormattedRelative({
            value: 2000,
            now  : 0
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.contain('in 2 seconds');
    });

});
