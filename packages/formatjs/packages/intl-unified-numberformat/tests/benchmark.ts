#!/usr/bin/env node
'use strict';
import {Suite} from 'benchmark';
import {unpackData} from '@formatjs/intl-utils';
import {
  rawDataToInternalSlots,
  extractILD,
  extractUnitPattern,
  extractDecimalPattern,
  extractPercentPattern,
  extractCurrencyPattern,
} from '../src/data';

function onCycle(ev: any) {
  console.log(String(ev.target));
}

function onComplete(this: any) {
  console.log(
    `--- ${this.name}: Fastest is ${this.filter('fastest').map('name')} ---`
  );
}

const en = require('../dist/locale-data/en.json');

function addData() {
  const availableLocales: string[] = Object.keys(
    [
      ...en.availableLocales,
      ...Object.keys(en.aliases),
      ...Object.keys(en.parentLocales),
    ].reduce((all: Record<string, true>, k) => {
      all[k] = true;
      return all;
    }, {})
  );
  const data: Record<string, any> = {};
  for (const locale of availableLocales) {
    try {
      data[locale] = unpackData(locale, en);
    } catch (e) {
      // Ignore if we don't have data
    }
  }

  return data;
}

const unpackedData = addData();

new Suite('UnifiedNumberFormat data processing', {
  onCycle,
  onError: console.log,
  onComplete,
})
  .add('unpackData', addData)
  .add('extractILD', () =>
    extractILD(
      unpackedData.en.units,
      unpackedData.en.currencies,
      unpackedData.en.numbers,
      'latn'
    )
  )
  .add('extractUnitPattern', () =>
    extractUnitPattern(unpackedData.en.numbers, unpackedData.en.units)
  )
  .add('extractDecimalPattern', () =>
    extractDecimalPattern(unpackedData.en.numbers)
  )
  .add('extractPercentPattern', () =>
    extractPercentPattern(unpackedData.en.numbers)
  )
  .add('extractCurrencyPattern', () =>
    extractCurrencyPattern(unpackedData.en.numbers, unpackedData.en.currencies)
  )
  .add('preprocessing', () =>
    rawDataToInternalSlots(
      unpackedData.en.units,
      unpackedData.en.currencies,
      unpackedData.en.numbers,
      'latn'
    )
  )
  .run();
