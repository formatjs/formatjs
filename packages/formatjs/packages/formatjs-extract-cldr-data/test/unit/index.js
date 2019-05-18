/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/* global describe, it */
'use strict';

var expect = require('expect.js');
var extractData = require('../../');

describe('exports', function() {
  it('should have a single default export function', function() {
    expect(extractData).to.be.a('function');
    expect(Object.keys(extractData)).to.eql([]);
  });
});

describe('Data shape', function() {
  var data = extractData({
    pluralRules: true,
    relativeFields: true
  });

  it('should be keyed by locale', function() {
    expect(data).to.have.keys('en', 'zh');
  });

  it('should have object values for each locale key', function() {
    expect(data.en).to.be.an('object');
    expect(data.zh).to.be.an('object');
  });

  describe('locale data object', function() {
    it('should have a `locale` property equal to the locale', function() {
      var locale = Object.keys(data)[0];
      var localeData = data[locale];

      expect(localeData).to.have.key('locale');
      expect(localeData.locale).to.be.a('string');
      expect(localeData.locale).to.equal(locale);
    });

    it('should have `parentLocale` property when it is not a root locale', function() {
      expect(data.en).to.not.have.key('parentLocale');
      expect(data['en-US']).to.have.key('parentLocale');
      expect(data['en-US'].parentLocale).to.equal('en');
    });

    it('should have a `pluralRuleFunction`', function() {
      expect(data.en).to.have.key('pluralRuleFunction');
      expect(data.en.pluralRuleFunction).to.be.a('function');
    });

    it('should have a `fields` object property', function() {
      expect(data.en).to.have.key('fields');
      expect(data.en.fields).to.be.an('object');
    });

    describe('`fields` objects', function() {
      var field = data.en.fields[Object.keys(data.en.fields)[0]];

      it('should have a `displayName` string property', function() {
        expect(field).to.have.key('displayName');
        expect(field.displayName).to.be.a('string');
      });

      it('should have a `relative` object property', function() {
        expect(field).to.have.key('relative');
        expect(field.relative).to.be.an('object');
      });

      it('should have a `relativeTime` object property', function() {
        expect(field).to.have.key('relativeTime');
        expect(field.relativeTime).to.be.an('object');
      });

      it('should contain all fields', function() {
        var fields = [
          'year',
          'year-short',
          'month',
          'month-short',
          'week',
          'week-short',
          'day',
          'day-short',
          'hour',
          'hour-short',
          'minute',
          'minute-short',
          'second',
          'second-short'
        ];
        expect(data.en.fields).to.have.keys(fields);
      });

      describe('`relative` object', function() {
        var keys = Object.keys(field.relative);

        it('should have numeric keys', function() {
          keys.forEach(function(key) {
            key = parseInt(key, 10);
            expect(key).to.be.a('number');
            expect(isNaN(key)).to.be(false);
          });
        });

        it('should have string values', function() {
          keys.forEach(function(key) {
            expect(field.relative[key]).to.be.a('string');
          });
        });
      });

      describe('`relativeTime` object', function() {
        it('should have `future` and `past` object properties', function() {
          expect(field.relativeTime).to.have.keys('future', 'past');
          expect(field.relativeTime.future).to.be.an('object');
          expect(field.relativeTime.past).to.be.an('object');
        });

        describe('`future` object', function() {
          var future = field.relativeTime.future;
          var keys = Object.keys(future);

          it('should have an `other` key', function() {
            expect(future).to.have.key('other');
          });

          it('should have string values', function() {
            keys.forEach(function(key) {
              expect(future[key]).to.be.a('string');
            });
          });
        });

        describe('`past` object', function() {
          var past = field.relativeTime.past;
          var keys = Object.keys(past);

          it('should have an `other` key', function() {
            expect(past).to.have.key('other');
          });

          it('should have string values', function() {
            keys.forEach(function(key) {
              expect(past[key]).to.be.a('string');
            });
          });
        });
      });
    });
  });
});

describe('extractData()', function() {
  it('should always return an object', function() {
    expect(extractData)
      .withArgs()
      .to.not.throwException();
    expect(extractData()).to.be.an('object');
  });

  describe('Options', function() {
    describe('locales', function() {
      it('should default to all available locales', function() {
        var data = extractData({ pluralRules: true });
        expect(Object.keys(data).length).to.be.greaterThan(0);
      });

      it('should only accept an array of strings', function() {
        expect(extractData)
          .withArgs({ locales: [] })
          .to.not.throwException();
        expect(extractData)
          .withArgs({ locales: ['en'] })
          .to.not.throwException();

        expect(extractData)
          .withArgs({ locales: [true] })
          .to.throwException();
        expect(extractData)
          .withArgs({ locales: true })
          .to.throwException();
        expect(extractData)
          .withArgs({ locales: 'en' })
          .to.throwException();
      });

      it.skip('should throw when no data exists for a locale', function() {
        expect(extractData)
          .withArgs({ locales: ['foo-bar'] })
          .to.throwException();
      });

      it('should always contribute an entry for all specified `locales`', function() {
        var data = extractData({
          locales: ['en-US', 'zh-Hans-SG'],
          pluralRules: true,
          relativeFields: true
        });

        expect(data).to.have.keys('en-US', 'zh-Hans-SG');
      });

      it('should recursively expand `locales` to their roots', function() {
        var data = extractData({
          locales: ['en-US', 'zh-Hans-SG'],
          pluralRules: true,
          relativeFields: true
        });

        expect(data).to.have.keys('en', 'zh', 'zh-Hans');
      });

      it('should accept `locales` of any case and normalize them', function() {
        expect(
          extractData({
            locales: ['en-us', 'ZH-HANT-HK'],
            pluralRules: true
          })
        ).to.have.keys('en-US', 'zh-Hant-HK');
      });
    });

    describe('pluralRules', function() {
      it('should contribute a `pluralRuleFunction` function property', function() {
        var data = extractData({
          locales: ['en'],
          pluralRules: true
        });

        expect(data.en).to.have.key('pluralRuleFunction');
        expect(data.en.pluralRuleFunction).to.be.a('function');
      });
    });

    describe('relativeFields', function() {
      it('should contribute a `fields` object property', function() {
        var data = extractData({
          locales: ['en'],
          relativeFields: true
        });

        expect(data.en).to.have.key('fields');
        expect(data.en.fields).to.be.an('object');
      });
    });
  });

  describe('Locale hierarchy', function() {
    it('should determine the correct parent locale', function() {
      var data = extractData({
        locales: ['en', 'pt-MZ', 'zh-Hant-HK']
      });

      expect(data['en']).to.not.have.key('parentLocale');

      expect(data['pt-MZ']).to.have.key('parentLocale');
      expect(data['pt-MZ'].parentLocale).to.equal('pt-PT');

      expect(data['zh-Hant-HK']).to.have.key('parentLocale');
      expect(data['zh-Hant-HK'].parentLocale).to.equal('zh-Hant');
      expect(data['zh-Hant']).to.not.have.key('parentLocale');
    });

    it('should de-duplicate data with suitable ancestors', function() {
      var locales = ['es-AR', 'es-MX', 'es-VE'];

      var data = extractData({
        locales: locales,
        pluralRules: true,
        relativeFields: true
      });

      expect(data['es-AR']).to.have.keys('parentLocale');
      expect(data['es-AR']).to.not.have.keys('pluralRuleFunction', 'fields');

      expect(data['es-MX']).to.have.keys('parentLocale', 'fields');
      expect(data['es-MX']).to.not.have.keys('pluralRuleFunction');

      expect(data['es-VE']).to.have.keys('parentLocale');
      expect(data['es-VE']).to.not.have.keys('pluralRuleFunction', 'fields');

      locales.forEach(function(locale) {
        var pluralRuleFunction;
        var fields;

        // Traverse locale hierarchy for `locale` looking for the first
        // occurrence of `pluralRuleFunction` and `fields`;
        while (locale) {
          if (!pluralRuleFunction) {
            pluralRuleFunction = data[locale].pluralRuleFunction;
          }

          if (!fields) {
            fields = data[locale].fields;
          }

          locale = data[locale].parentLocale;
        }

        expect(pluralRuleFunction).to.be.a('function');
        expect(fields).to.be.a('object');
      });
    });
  });
});
