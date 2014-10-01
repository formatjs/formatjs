
/*global describe, it, expect, afterEach, IntlMessageFormat*/
describe('IntlMessageFormat', function () {

    it('should be a function', function () {
        expect(IntlMessageFormat).to.be.a('function');
    });

    describe('#_locale', function () {
        var defaultLocale = IntlMessageFormat.defaultLocale;

        afterEach(function () {
            IntlMessageFormat.defaultLocale = defaultLocale;
        });

        it('should be a default value', function () {
            // Set defaultLocale to "en".
            IntlMessageFormat.defaultLocale = 'en';

            var msgFmt = new IntlMessageFormat('');
            expect(msgFmt._locale).to.equal('en');
        });

        it('should be equal to the second parameter\'s language code', function () {
            var msgFmt = new IntlMessageFormat('', 'en-US');
            expect(msgFmt._locale).to.equal('en');
        });

    });

    describe('#_pluralLocale', function () {
        var msgFmt = new IntlMessageFormat('');

        it('should be undefined', function () {
            /*jshint expr:true */
            expect(msgFmt._pluralLocale).to.be(undefined);
        });
    });

    describe('#_pluralFunc', function () {
        var msgFmt = new IntlMessageFormat('');

        it('should be undefined', function () {
            /*jshint expr:true */
            expect(msgFmt._pluralFunc).to.be(undefined);
        });
    });

    describe('#pattern', function () {
        it('should be undefined', function () {
            var msgFmt = new IntlMessageFormat('');
            /*jshint expr:true */
            expect(msgFmt.pattern).to.not.be.ok();
        });

        it('should be undefined when first parameter is ommited', function () {
            var msgFmt = new IntlMessageFormat('');
            /*jshint expr:true */
            expect(msgFmt.pattern).to.not.be.ok();
        });
    });

    describe('using a string pattern', function () {

        // TODO: Determine if spaces are valid in argument names in Yala; and if
        // not, then remove this test.
        // it('should fail if there is no argument in the string', function () {
        //     var msgFmt = new IntlMessageFormat('My name is {FIRST LAST}'),
        //         m = msgFmt.format({
        //                 FIRST: 'Anthony',
        //                 LAST: 'Pipkin'
        //             });
        //
        //     expect(m).to.equal('My name is {FIRST LAST}');
        // });

        it('should properly replace direct arguments in the string', function () {
            var msgFmt = new IntlMessageFormat('My name is {FIRST} {LAST}.'),
                m = msgFmt.format({
                    FIRST: 'Anthony',
                    LAST : 'Pipkin'
                });

            expect(m).to.be.a('string');
            expect(m).to.equal('My name is Anthony Pipkin.');
        });

    });

    describe('and plurals under the Arabic locale', function () {
        var msg = '' +
            'I have {numPeople, plural,' +
                'zero {zero points}' +
                'one {a point}' +
                'two {two points}' +
                'few {a few points}' +
                'many {lots of points}' +
                'other {some other amount of points}}' +
            '.';

        var msgFmt = new IntlMessageFormat(msg, 'ar');

        it('should match zero', function () {
            var m = msgFmt.format({
                numPeople: 0
            });

            expect(m).to.equal('I have zero points.');
        });

        it('should match one', function () {
            var m = msgFmt.format({
                numPeople: 1
            });

            expect(m).to.equal('I have a point.');
        });

        it('should match two', function () {
            var m = msgFmt.format({
                numPeople: 2
            });

            expect(m).to.equal('I have two points.');
        });

        it('should match few', function () {
            var m = msgFmt.format({
                numPeople: 5
            });

            expect(m).to.equal('I have a few points.');
        });

        it('should match many', function () {
            var m = msgFmt.format({
                numPeople: 20
            });

            expect(m).to.equal('I have lots of points.');
        });

        it('should match other', function () {
            var m = msgFmt.format({
                numPeople: 100
            });

            expect(m).to.equal('I have some other amount of points.');
        });
    });
});
