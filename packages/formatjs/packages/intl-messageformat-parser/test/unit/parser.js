/* global describe, it */
'use strict';

var expect = require('expect.js');
var parser = require('../../');

describe('exports', function () {
    it('should have a `parse` export', function () {
        expect(parser).to.have.property('parse');
        expect(parser.parse).to.be.a('function');
    });

    it('should have a `SyntaxError` export', function () {
        expect(parser).to.have.property('SyntaxError');
        expect(parser.SyntaxError).to.be.a('function');
    });
});

describe('parse()', function () {
    var parse = parser.parse;

    it('should expect a String argument', function () {
        expect(parse).withArgs('').to.not.throwException();

        expect(parse).withArgs().to.throwException();
        expect(parse).withArgs(undefined).to.throwException();
        expect(parse).withArgs(null).to.throwException();
    });

    it('should return an AST object', function () {
        var ast = parse('');
        expect(ast).to.be.an('object');
        expect(ast.type).to.equal('messageFormatPattern');
        expect(ast.elements).to.be.an('array');
        expect(ast.elements).to.be.empty(0);
    });

    describe('parse("Hello, World!")', function () {
        var msg = 'Hello, World!';
        var ast = parse(msg);

        it('should contain 1 `elements`', function () {
            expect(ast.elements).to.have.length(1);
        });

        it('should contain a `messageTextElement`', function () {
            var element = ast.elements[0];
            expect(element).to.be.an('object');
            expect(element).to.have.property('type');
            expect(element.type).to.equal('messageTextElement');
            expect(element).to.have.property('value');
            expect(element.value).to.equal(msg);
        });
    });

    describe('parse("Hello, {name}!")', function () {
        var msg = 'Hello, {name}!';
        var ast = parse(msg);

        it('should contain 3 `elements`', function () {
            expect(ast.elements).to.have.length(3);
        });

        it('should first contain a `messageTextElement`', function () {
            var element = ast.elements[0];
            expect(element.value).to.equal('Hello, ');
        });

        it('should then contain an `argumentElement`', function () {
            var element = ast.elements[1];
            expect(element).to.be.an('object');
            expect(element).to.have.property('type');
            expect(element.type).to.equal('argumentElement');
            expect(element).to.have.property('id');
            expect(element.id).to.equal('name');
            expect(element).to.have.property('format');
            expect(element.format).to.equal(null);
        });

        it('should finally contain a `messageTextElement`', function () {
            var element = ast.elements[2];
            expect(element.value).to.equal('!');
        });
    });

    describe('parse("{num, number, percent}")', function () {
        var msg = '{num, number, percent}';
        var ast = parse(msg);

        it('should contain 1 `elements`', function () {
            expect(ast.elements).to.have.length(1);
        });

        it('should contain an `argumentElement`', function () {
            var element = ast.elements[0];
            expect(element).to.be.an('object');
            expect(element).to.have.property('type');
            expect(element.type).to.equal('argumentElement');
            expect(element).to.have.property('id');
            expect(element.id).to.equal('num');
            expect(element).to.have.property('format');

            var format = element.format;
            expect(format).to.be.an('object');
            expect(format).to.have.property('type');
            expect(format.type).to.equal('numberFormat');
            expect(format).to.have.property('style');
            expect(format.style).to.equal('percent');
        });
    });

    describe('parse("{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}")', function () {
        var msg = '{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}';
        var ast = parse(msg);

        it('should contain 1 `elements`', function () {
            expect(ast.elements).to.have.length(1);
        });

        it('should contain an `argumentElement`', function () {
            var element = ast.elements[0];
            expect(element).to.be.an('object');
            expect(element).to.have.property('type');
            expect(element.type).to.equal('argumentElement');
            expect(element).to.have.property('id');
            expect(element.id).to.equal('numPhotos');
            expect(element).to.have.property('format');

            var format = element.format;
            expect(format).to.be.an('object');
            expect(format).to.have.property('type');
            expect(format.type).to.equal('pluralFormat');
            expect(format).to.have.property('offset');
            expect(format.offset).to.equal(0);
        });

        it('should contain 3 `options`', function () {
            var options = ast.elements[0].format.options;
            expect(options).to.have.length(3);

            var option = options[0];
            expect(option).to.be.an('object');
            expect(option).to.have.property('type');
            expect(option.type).to.equal('optionalFormatPattern');
            expect(option).to.have.property('selector');
            expect(option.selector).to.equal('=0');
            expect(option).to.have.property('value');
            expect(option.value).to.be.an('object');

            expect(options[1].selector).to.equal('=1');
            expect(options[2].selector).to.equal('other');
        });

        it('should contain nested `messageFormatPattern` values for each option', function () {
            var options = ast.elements[0].format.options;

            var value = options[0].value;
            expect(value).to.have.property('type');
            expect(value.type).to.equal('messageFormatPattern');
            expect(value).to.have.property('elements');
            expect(value.elements).to.be.an('array');
            expect(value.elements).to.have.length(1);

            var element = value.elements[0];
            expect(element).to.be.an('object');
            expect(element).to.have.property('type');
            expect(element.type).to.equal('messageTextElement');
            expect(element).to.have.property('value');
            expect(element.value).to.equal('no photos');

            expect(options[1].value.elements[0].value).to.equal('one photo');
            expect(options[2].value.elements[0].value).to.equal('# photos');
        });
    });

    describe('parse("{gender, select, female {woman} male {man} other {person}}")', function () {
        var msg = '{gender, select, female {woman} male {man} other {person}}';
        var ast = parse(msg);

        it('should contain 1 `elements`', function () {
            expect(ast.elements).to.have.length(1);
        });

        it('should contain an `argumentElement`', function () {
            var element = ast.elements[0];
            expect(element).to.be.an('object');
            expect(element).to.have.property('type');
            expect(element.type).to.equal('argumentElement');
            expect(element).to.have.property('id');
            expect(element.id).to.equal('gender');
            expect(element).to.have.property('format');

            var format = element.format;
            expect(format).to.be.an('object');
            expect(format).to.have.property('type');
            expect(format.type).to.equal('selectFormat');
        });

        it('should contain 3 `options`', function () {
            var options = ast.elements[0].format.options;
            expect(options).to.have.length(3);

            var option = options[0];
            expect(option).to.be.an('object');
            expect(option).to.have.property('type');
            expect(option.type).to.equal('optionalFormatPattern');
            expect(option).to.have.property('selector');
            expect(option.selector).to.equal('female');
            expect(option).to.have.property('value');
            expect(option.value).to.be.an('object');

            expect(options[1].selector).to.equal('male');
            expect(options[2].selector).to.equal('other');
        });

        it('should contain nested `messageFormatPattern` values for each option', function () {
            var options = ast.elements[0].format.options;

            var value = options[0].value;
            expect(value).to.have.property('type');
            expect(value.type).to.equal('messageFormatPattern');
            expect(value).to.have.property('elements');
            expect(value.elements).to.be.an('array');
            expect(value.elements).to.have.length(1);

            var element = value.elements[0];
            expect(element).to.be.an('object');
            expect(element).to.have.property('type');
            expect(element.type).to.equal('messageTextElement');
            expect(element).to.have.property('value');
            expect(element.value).to.equal('woman');

            expect(options[1].value.elements[0].value).to.equal('man');
            expect(options[2].value.elements[0].value).to.equal('person');
        });
    });

    describe('whitespace', function () {
        it('should allow whitespace in and around `messageTextElement`s', function () {
            var msg = '   some random test   ';
            var ast = parse(msg);
            expect(ast.elements[0].value).to.equal(msg);
        });

        it('should allow whitespace in `argumentElement`s', function () {
            var msg = '{  num , number,percent  }';
            var ast = parse(msg);

            var element = ast.elements[0];
            expect(element.id).to.equal('num');
            expect(element.format.type).to.equal('numberFormat');
            expect(element.format.style).to.equal('percent');
        });
    });

    describe('escaping', function () {
        it('should allow escaping of syntax chars via `\\\\`', function () {
            expect(parse('\\{').elements[0].value).to.equal('{');
            expect(parse('\\}').elements[0].value).to.equal('}');
            expect(parse('\\u003C').elements[0].value).to.equal('<');

            // Escaping "#" needs to be special-cased so it remains escaped so
            // the runtime doesn't replace it when in a `pluralFormat` option.
            expect(parse('\\#').elements[0].value).to.equal('\\#');
        });
    });
});
