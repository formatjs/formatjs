#!/usr/bin/env node
'use strict';
import {Suite} from 'benchmark';
import {
  unpackData,
  CurrencyPattern,
  SignDisplayPattern,
  CurrencySignPattern,
  NotationPattern,
} from '@formatjs/intl-utils';
import {extractILD} from '../src/data';
import * as en from '../dist/locale-data/en.json';

function onCycle(ev: any) {
  console.log(String(ev.target));
}

function onComplete(this: any) {
  console.log(
    `--- ${this.name}: Fastest is ${this.filter('fastest').map('name')} ---`
  );
}

const CURRENCY_DISPLAYS: Array<keyof CurrencyPattern> = [
  'code',
  'symbol',
  'narrowSymbol',
  'name',
];

const SIGN_DISPLAYS: Array<keyof SignDisplayPattern> = [
  'auto',
  'always',
  'never',
  'exceptZero',
];

const CURRENCY_SIGNS: Array<keyof CurrencySignPattern> = [
  'standard',
  'accounting',
];

const NOTATIONS: Array<keyof NotationPattern> = [
  'standard',
  'scientific',
  'compactShort',
  'compactLong',
];

function dummyCreateCurrencyPattern() {
  const {
    data: {currencies},
  } = en;
  const availableCurrencies = Object.keys(currencies);
  const all: any = {};
  for (const currency of availableCurrencies) {
    all[currency] = {};
    for (const currencyDisplay of CURRENCY_DISPLAYS) {
      all[currency][currencyDisplay] = {};
      for (const currencySign of CURRENCY_SIGNS) {
        all[currency][currencyDisplay][currencySign] = {};
        for (const signDisplay of SIGN_DISPLAYS) {
          all[currency][currencyDisplay][currencySign][signDisplay] = {};
          for (const notation of NOTATIONS) {
            all[currency][currencyDisplay][currencySign][signDisplay][
              notation
            ] = {
              positivePattern: '',
              zeroPattern: '',
              negativePattern: '',
            };
          }
        }
      }
    }
  }
  return all;
}

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
  .add('dummyCreateCurrencyPattern', dummyCreateCurrencyPattern)
  .run();
