/*global describe, it, expect, React, ReactIntlMixin*/
describe('React Intl mixin', function () {

    it('Formats numbers correctly', function () {
        var FormattedNumber = React.createClass({
            displayName: 'FormattedNumber',

            mixins: [ReactIntlMixin],

            render: function () {
                return React.DOM.div(null, this.formatNumber(1000));
            }
        });

        var testNode = document.getElementById('test1');

        React.renderComponent(FormattedNumber({
            locales: ['es-AR']
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.equal('1.000');
    });

    it('Formats dates correctly', function () {
        var FormattedDate = React.createClass({
            displayName: 'FormattedDate',

            mixins: [ReactIntlMixin],

            render: function () {
                return React.DOM.div(null, this.formatDate(this.props.date, {
                    weekday: 'long',
                    timeZone: 'UTC'
                }));
            }
        });

        var testNode = document.getElementById('test2');

        React.renderComponent(FormattedDate({
            locales: ['es-AR'],
            date: Date.UTC(2014, 8, 22, 0, 0, 0, 0)
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.contain('lunes');

        React.renderComponent(FormattedDate({
            locales: ['en-US'],
            date: 0
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.contain('Thursday');
    });

    it('Formats messages correctly', function () {
        var FormattedMessage = React.createClass({
            displayName: 'FormattedMessage',

            mixins: [ReactIntlMixin],

            getMyMessage: function () {
                return 'You have {numPhotos, plural, =0 {no photos} =1 {one photo} other {# photos}}.';
            },

            render: function () {
                return React.DOM.div(null, this.formatMessage(this.getMyMessage(), {
                    numPhotos: this.props.numPhotos
                }));
            }
        });

        var testNode = document.getElementById('test3');

        React.renderComponent(FormattedMessage({
            locales: ['en-US'],
            numPhotos: 1
        }), testNode);

        expect(testNode.firstChild.innerHTML).to.equal('You have one photo.');
    });

});
