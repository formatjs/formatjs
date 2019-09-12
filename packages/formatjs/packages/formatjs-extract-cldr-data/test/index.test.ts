/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/* global describe, it */
'use strict';

import {extractAllRelativeFields} from '../src';

describe('exports', function() {
  it('should have a single default export function', function() {
    expect(typeof extractAllRelativeFields).toBe('function');
    expect(Object.keys(extractAllRelativeFields)).toEqual([]);
  });
});

describe('Data shape', function() {
  var data = extractAllRelativeFields({
    relativeFields: true,
  });

  it('should be keyed by locale', function() {
    const locales = Object.keys(data);
    expect(locales).toContain('en');
    expect(locales).toContain('zh');
  });

  it('should have object values for each locale key', function() {
    expect(typeof data.en).toBe('object');
    expect(typeof data.zh).toBe('object');
  });

  describe('locale data object', function() {
    it('should have a `data` object property', function() {
      expect(data.en).toHaveProperty('year');
      expect(typeof data.en.year).toBe('object');
    });

    describe('data', function() {
      var field = data.en[Object.keys(data.en)[0]];

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
          'second-narrow',
        ];
        expect(Object.keys(data.en)).toEqual(fields);
      });

      describe('`relative` object', function() {
        var keys = Object.keys(field.relative);

        it('should have numeric keys', function() {
          keys.forEach(function(key) {
            const numKey = parseInt(key, 10);
            expect(typeof numKey).toBe('number');
            expect(numKey).not.toBeNaN();
          });
        });

        it('should have string values', function() {
          keys.forEach(function(key) {
            expect(typeof field.relative[key as '0']).toBe('string');
          });
        });
      });

      describe('`relativeTime` object', function() {
        it('should have `future` and `past` object properties', function() {
          const times = Object.keys(field.relativeTime);
          expect(times).toContain('future');
          expect(times).toContain('past');
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
              expect(typeof future[key as 'one']).toBe('string');
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
            keys.forEach(key =>
              expect(typeof past[key as 'one']).toBe('string')
            );
          });
        });
      });
    });
  });
});

describe('extractAllRelativeFields()', function() {
  it('should always return an object', function() {
    expect(extractAllRelativeFields).not.toThrow();
    expect(typeof extractAllRelativeFields()).toBe('object');
  });

  describe('Options', function() {
    describe('locales', function() {
      it('should default to all available locales', function() {
        var data = extractAllRelativeFields();
        expect(Object.keys(data).length).toBeGreaterThan(0);
      });

      it('should only accept an array of strings', function() {
        expect(() => extractAllRelativeFields({locales: []})).not.toThrow();
        expect(() => extractAllRelativeFields({locales: ['en']})).not.toThrow();
      });

      it.skip('should throw when no data exists for a locale', function() {
        expect(extractAllRelativeFields).toThrow();
      });
    });

    describe('relativeFields', function() {
      it('should contribute a `fields` object property', function() {
        var data = extractAllRelativeFields({
          locales: ['en'],
          relativeFields: true,
        });

        expect(data.en).toHaveProperty('year');
        expect(typeof data.en).toBe('object');
      });
    });
  });

  describe('Locale hierarchy', function() {
    it('should de-duplicate data with suitable ancestors', function() {
      var locales = ['es-MX', 'es-VE'];

      var data = extractAllRelativeFields({
        locales: locales,
        relativeFields: true,
      });

      expect(Object.keys(data['es-MX'])).toContain('year');
      expect(Object.keys(data)).not.toContain('es-VE');
    });
  });
});
