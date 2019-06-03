/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/* global describe, it */
'use strict';

var extractData = require('..');

describe('exports', function() {
  it('should have a single default export function', function() {
    expect(typeof extractData).toBe('function');
    expect(Object.keys(extractData)).toEqual([]);
  });
});

describe('Data shape', function() {
  var data = extractData({
    relativeFields: true
  });

  it('should be keyed by locale', function() {
    expect(Object.keys(data)).toContain('en', 'zh');
  });

  it('should have object values for each locale key', function() {
    expect(typeof data.en).toBe('object');
    expect(typeof data.zh).toBe('object');
  });

  describe('locale data object', function() {
    it('should have a `locale` property equal to the locale', function() {
      var locale = Object.keys(data)[0];
      var localeData = data[locale];

      expect(localeData).toHaveProperty('locale');
      expect(typeof localeData.locale).toBe('string');
      expect(localeData.locale).toBe(locale);
    });

    it('should have `parentLocale` property when it is not a root locale', function() {
      expect(data.en).not.toHaveProperty('parentLocale');
      expect(data['en-US']).toHaveProperty('parentLocale');
      expect(data['en-US'].parentLocale).toBe('en');
    });

    it('should have a `fields` object property', function() {
      expect(data.en).toHaveProperty('fields');
      expect(typeof data.en.fields).toBe('object');
    });

    describe('`fields` objects', function() {
      var field = data.en.fields[Object.keys(data.en.fields)[0]];

      it('should have a `displayName` string property', function() {
        expect(field).toHaveProperty('displayName');
        expect(typeof field.displayName).toBe('string');
      });

      it('should have a `relative` object property', function() {
        expect(field).toHaveProperty('relative');
        expect(typeof field.relative).toBe('object');
      });

      it('should have a `relativeTime` object property', function() {
        expect(field).toHaveProperty('relativeTime');
        expect(typeof field.relativeTime).toBe('object');
      });

      it('should contain all fields', function() {
        var fields = [
          'year',
          'year-short',
          'year-narrow',
          'quarter',
          'quarter-short',
          'quarter-narrow',
          'month',
          'month-short',
          'month-narrow',
          'week',
          'week-short',
          'week-narrow',
          'day',
          'day-short',
          'day-narrow',
          'hour',
          'hour-short',
          'hour-narrow',
          'minute',
          'minute-short',
          'minute-narrow',
          'second',
          'second-short',
          'second-narrow'
        ];
        expect(Object.keys(data.en.fields)).toEqual(fields);
      });

      describe('`relative` object', function() {
        var keys = Object.keys(field.relative);

        it('should have numeric keys', function() {
          keys.forEach(function(key) {
            key = parseInt(key, 10);
            expect(typeof key).toBe('number');
            expect(isNaN(key)).toBe(false);
          });
        });

        it('should have string values', function() {
          keys.forEach(function(key) {
            expect(typeof field.relative[key]).toBe('string');
          });
        });
      });

      describe('`relativeTime` object', function() {
        it('should have `future` and `past` object properties', function() {
          expect(Object.keys(field.relativeTime)).toContain('future', 'past');
          expect(typeof field.relativeTime.future).toBe('object');
          expect(typeof field.relativeTime.past).toBe('object');
        });

        describe('`future` object', function() {
          var future = field.relativeTime.future;
          var keys = Object.keys(future);

          it('should have an `other` key', function() {
            expect(future).toHaveProperty('other');
          });

          it('should have string values', function() {
            keys.forEach(function(key) {
              expect(typeof future[key]).toBe('string');
            });
          });
        });

        describe('`past` object', function() {
          var past = field.relativeTime.past;
          var keys = Object.keys(past);

          it('should have an `other` key', function() {
            expect(past).toHaveProperty('other');
          });

          it('should have string values', function() {
            keys.forEach(function(key) {
              expect(typeof past[key]).toBe('string');
            });
          });
        });
      });
    });
  });
});

describe('extractData()', function() {
  it('should always return an object', function() {
    expect(extractData).not.toThrow();
    expect(typeof extractData()).toBe('object');
  });

  describe('Options', function() {
    describe('locales', function() {
      it('should default to all available locales', function() {
        var data = extractData();
        expect(Object.keys(data).length).toBeGreaterThan(0);
      });

      it('should only accept an array of strings', function() {
        expect(() => extractData({ locales: []})).not.toThrow();
        expect(() => extractData({ locales: ['en']})).not.toThrow();

        expect(() => extractData({ locales: [true]})).toThrow();
        expect(() => extractData({ locales: true})).toThrow();
        expect(() => extractData({ locales: 'en'})).toThrow();
      });

      it.skip('should throw when no data exists for a locale', function() {
        expect(extractData).toThrow();
      });

      it('should always contribute an entry for all specified `locales`', function() {
        var data = extractData({
          locales: ['en-US', 'zh-Hans-SG'],
          relativeFields: true
        });

        expect(Object.keys(data)).toContain('en-US', 'zh-Hans-SG');
      });

      it('should recursively expand `locales` to their roots', function() {
        var data = extractData({
          locales: ['en-US', 'zh-Hans-SG'],
          relativeFields: true
        });

        expect(Object.keys(data)).toContain('en', 'zh', 'zh-Hans');
      });

      it('should accept `locales` of any case and normalize them', function() {
        expect(Object.keys(
          extractData({
            locales: ['en-us', 'ZH-HANT-HK']
          })
        )).toContain('en-US', 'zh-Hant-HK');
      });
    });

    describe('relativeFields', function() {
      it('should contribute a `fields` object property', function() {
        var data = extractData({
          locales: ['en'],
          relativeFields: true
        });

        expect(data.en).toHaveProperty('fields');
        expect(typeof data.en.fields).toBe('object');
      });
    });
  });

  describe('Locale hierarchy', function() {
    it('should determine the correct parent locale', function() {
      var data = extractData({
        locales: ['en', 'pt-MZ', 'zh-Hant-HK']
      });

      expect(data['en']).not.toHaveProperty('parentLocale');

      expect(data['pt-MZ']).toHaveProperty('parentLocale');
      expect(data['pt-MZ'].parentLocale).toBe('pt-PT');

      expect(data['zh-Hant-HK']).toHaveProperty('parentLocale');
      expect(data['zh-Hant-HK'].parentLocale).toBe('zh-Hant');
      expect(data['zh-Hant']).not.toHaveProperty('parentLocale');
    });

    it('should de-duplicate data with suitable ancestors', function() {
      var locales = ['es-MX', 'es-VE'];

      var data = extractData({
        locales: locales,
        relativeFields: true
      });

      expect(Object.keys(data['es-MX'])).toContain('parentLocale', 'fields');

      expect(Object.keys(data['es-VE'])).toContain('parentLocale');
      expect(Object.keys(data['es-VE'])).not.toContain('fields');

      locales.forEach(function(locale) {
        var fields;

        // Traverse locale hierarchy for `locale` looking for the first
        // occurrence of `fields`;
        while (locale) {
          if (!fields) {
            fields = data[locale].fields;
          }

          locale = data[locale].parentLocale;
        }
        expect(typeof fields).toBe('object');
      });
    });
  });
});
