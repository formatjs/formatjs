/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';
import * as Numbers from 'cldr-numbers-full/main/en/numbers.json';
import * as Currencies from 'cldr-numbers-full/main/en/currencies.json';
import * as Units from 'cldr-units-full/main/en/units.json';
import {Locale} from './types';
import generateFieldExtractorFn, { collapseSingleValuePluralRule } from './utils';
import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import {
  SANCTIONED_UNITS,
  NumberInternalSlots,
  SignPattern,
  SignDisplayPattern,
  LDMLPluralRule,
  NumberILD,
  CurrencySignPattern,
  UnitPattern,
  InternalSlotToken,
  removeUnitNamespace,
} from '@formatjs/intl-utils';
import {isEqual, isEmpty} from 'lodash';

const numbersLocales = globSync('*/numbers.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-numbers-full/package.json')),
    './main'
  ),
}).map(dirname);

// Process other 1st and skip other if it's the same as `other`
const PLURAL_RULES: Array<LDMLPluralRule> = [
  'other',
  'zero',
  'one',
  'two',
  'few',
  'many',
];

export type NumbersData = typeof Numbers['main']['en']['numbers'];
export type CurrenciesData = typeof Currencies['main']['en']['numbers']['currencies'];
export type UnitsData = typeof Units['main']['en']['units'];

function generateCurrencyILD(d: CurrenciesData): NumberILD['currencySymbols'] {
  return Object.keys(d).reduce((all: NumberILD['currencySymbols'], k) => {
    const data = d[k as 'USD'];
    const currencyName = collapseSingleValuePluralRule(
      PLURAL_RULES.reduce((names: Record<LDMLPluralRule, string>, ldml) => {
        const key = `displayName-count-${ldml}`;
        if (key in data) {
          names[ldml] = data[key as 'displayName-count-other'];
        }
        return names;
      }, {} as Record<LDMLPluralRule, string>)
    );
    all[k] = {
      currencySymbol: data.symbol,
      currencyName: isEmpty(currencyName) ? data.displayName : currencyName,
    };

    if (data['symbol-alt-narrow']) {
      all[k].currencyNarrowSymbol = data['symbol-alt-narrow'];
    }

    return all;
  }, {});
}

function generateUnitILD(u: UnitsData): NumberILD['unitSymbols'] {
  return SANCTIONED_UNITS.reduce(
    (all: NumberILD['unitSymbols'], cldrUnitName) => {
      const longData = u.long[cldrUnitName as 'digital-bit'];
      const narrowData = u.narrow[cldrUnitName as 'digital-bit'];
      const symbolData = u.short[cldrUnitName as 'digital-bit'];
      const intlUnitName = removeUnitNamespace(cldrUnitName);
      all[intlUnitName] = {
        unitSymbol: collapseSingleValuePluralRule(
          PLURAL_RULES.reduce((names: Record<LDMLPluralRule, string>, ldml) => {
            const key = `unitPattern-count-${ldml}`;
            if (key in symbolData) {
              names[ldml] = symbolData[
                key as 'unitPattern-count-other'
              ].replace(PATTERN_0_REGEX, '');
            }
            return names;
          }, {} as Record<LDMLPluralRule, string>)
        ),

        unitName: collapseSingleValuePluralRule(
          PLURAL_RULES.reduce((names: Record<LDMLPluralRule, string>, ldml) => {
            const key = `unitPattern-count-${ldml}`;
            if (key in longData) {
              names[ldml] = longData[key as 'unitPattern-count-other'].replace(
                PATTERN_0_REGEX,
                ''
              );
            }
            return names;
          }, {} as Record<LDMLPluralRule, string>)
        ),
      };
      const unitNarrowSymbol = collapseSingleValuePluralRule(
        PLURAL_RULES.reduce((names: Record<LDMLPluralRule, string>, ldml) => {
          const key = `unitPattern-count-${ldml}`;
          if (key in narrowData) {
            names[ldml] = narrowData[key as 'unitPattern-count-other'].replace(
              PATTERN_0_REGEX,
              ''
            );
          }
          return names;
        }, {} as Record<LDMLPluralRule, string>)
      );
      if (!isEqual(unitNarrowSymbol, all[intlUnitName].unitSymbol)) {
        all[intlUnitName].unitNarrowSymbol = unitNarrowSymbol;
      }
      return all;
    },
    {}
  );
}

// https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-intl.numberformat-internal-slots
function extractNumberPattern(
  d: NumbersData,
  c: CurrenciesData,
  u: UnitsData
): NumberInternalSlots {
  return {
    nu:
      d.defaultNumberingSystem === 'latn'
        ? ['latn']
        : [d.defaultNumberingSystem, 'latn'],
    patterns: {
      decimal: extractDecimalPattern(d),
      percent: extractPercentPattern(d),
      currency: extractCurrencyPattern(d),
      unit: extractUnitPattern(d, u),
    },
    ild: {
      ...extractCompactILD(d),
      symbols: d['symbols-numberSystem-latn'],
      currencySymbols: generateCurrencyILD(c),
      unitSymbols: generateUnitILD(u),
    },
  };
}

// Credit: https://github.com/andyearnshaw/Intl.js/blob/master/scripts/utils/reduce.js
// Matches CLDR number patterns, e.g. #,##0.00, #,##,##0.00, #,##0.##, #E0, etc.
const NUMBER_PATTERN = /[#0](?:[\.,][#0]+)*/g;
// Matches things like `foo {0}`, `foo{0}`, `{0}foo`
const PATTERN_0_REGEX = /\s?\{0\}\s?/g;
const SCIENTIFIC_SLOT = [
  InternalSlotToken.number,
  InternalSlotToken.scientificSeparator,
  InternalSlotToken.scientificExponent,
]
  .map(t => `{${t}}`)
  .join('');
const SCIENTIFIC_SIGN_PATTERN = produceSignPattern(SCIENTIFIC_SLOT);

function produceSignPattern(
  positivePattern: string,
  negativePattern = '',
  signDisplay: keyof SignDisplayPattern = 'auto'
) {
  if (!negativePattern) {
    negativePattern = `{${InternalSlotToken.minusSign}}${positivePattern}`;
  }
  let zeroPattern = positivePattern;
  switch (signDisplay) {
    case 'always':
      positivePattern = zeroPattern = positivePattern.includes(
        `{${InternalSlotToken.plusSign}}`
      )
        ? positivePattern
        : `{${InternalSlotToken.plusSign}}${positivePattern}`;
      break;
    case 'exceptZero':
      positivePattern = positivePattern.includes(
        `{${InternalSlotToken.minusSign}}`
      )
        ? positivePattern
        : `{${InternalSlotToken.plusSign}}${positivePattern}`;
      break;
    case 'never':
      positivePattern = zeroPattern = positivePattern.replace(
        `{${InternalSlotToken.plusSign}}`,
        ''
      );
      negativePattern = negativePattern.replace(
        `{${InternalSlotToken.minusSign}}`,
        ''
      );
      break;
  }
  return {
    positivePattern,
    negativePattern,
    zeroPattern,
  };
}

function partitionUnitPattern(pattern: string, tokenType: InternalSlotToken) {
  return (
    pattern
      // Handle `{0}foo` & `{0} foo`
      .replace(/^(\{0\}\s?)([^\s]+)$/, `$1{${tokenType}}`)
      // Handle `foo{0}` & `foo {0}`
      .replace(/^([^\s]*?)(\s?\{0\})$/, `{${tokenType}}$2`)
  );
}

function extractSignPattern(
  pattern: string,
  signDisplay: keyof SignDisplayPattern = 'auto',
  currencyToken: InternalSlotToken = InternalSlotToken.currencyCode
): SignPattern {
  const patterns = pattern.split(';');

  const [positivePattern, negativePattern] = patterns.map(p =>
    p
      .replace(NUMBER_PATTERN, `{${InternalSlotToken.number}}`)
      .replace('+', `{${InternalSlotToken.plusSign}}`)
      .replace('-', `{${InternalSlotToken.minusSign}}`)
      .replace('%', `{${InternalSlotToken.percentSign}}`)
      .replace('¤', `{${currencyToken}}`)
  );

  return produceSignPattern(positivePattern, negativePattern, signDisplay);
}

/**
 * Turn compact pattern like `0 trillion` or `¤0 trillion`
 * @param pattern
 */
function extractCompactSymbol(
  pattern: string,
  slotToken: InternalSlotToken
): string {
  const compactUnit = pattern.replace(/[¤0]/g, '').trim();
  return pattern.replace(compactUnit, `{${slotToken}}`);
}

function extractDecimalFormatILD(
  data:
    | NumbersData['decimalFormats-numberSystem-latn']['short']['decimalFormat']
    | NumbersData['decimalFormats-numberSystem-latn']['long']['decimalFormat']
    | NumbersData['currencyFormats-numberSystem-latn']['short']['standard']
): Record<string, string | Record<LDMLPluralRule, string>> {
  const decimalForms = (Object.keys(data) as Array<keyof typeof data>).reduce(
    (all: Record<string, Record<LDMLPluralRule, string>>, k) => {
      const [type, , ldml] = k.split('-');
      const decimalPattern = all[type] || {};
      const pattern = data[k].replace(/[¤0]/g, '').trim();
      if (pattern !== decimalPattern.other) {
        decimalPattern[ldml as LDMLPluralRule] = pattern;
      }
      all[type] = decimalPattern;
      return all;
    },
    {}
  );

  return Object.keys(decimalForms).reduce(
    (all: Record<string, string | Record<LDMLPluralRule, string>>, form) => {
      all[form] = collapseSingleValuePluralRule(decimalForms[form]);
      return all;
    },
    {}
  );
}

function extractCompactILD(
  d: NumbersData
): Pick<NumberILD, 'decimal' | 'currency'> {
  return {
    decimal: {
      compactShort: extractDecimalFormatILD(
        d['decimalFormats-numberSystem-latn'].short.decimalFormat
      ),
      compactLong: extractDecimalFormatILD(
        d['decimalFormats-numberSystem-latn'].long.decimalFormat
      ),
    },
    currency: {
      compactShort: extractDecimalFormatILD(
        d['currencyFormats-numberSystem-latn'].short.standard
      ),
    },
  };
}

function extractDecimalPattern(d: NumbersData): SignDisplayPattern {
  return (['auto', 'always', 'never', 'exceptZero'] as Array<
    keyof SignDisplayPattern
  >).reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: extractSignPattern(
        d['decimalFormats-numberSystem-latn'].standard,
        k
      ),
      scientific: SCIENTIFIC_SIGN_PATTERN,
      compactShort: extractSignPattern(
        extractCompactSymbol(
          d['decimalFormats-numberSystem-latn'].short.decimalFormat[
            '1000-count-other'
          ],
          InternalSlotToken.compactSymbol
        ),
        k
      ),
      compactLong: extractSignPattern(
        extractCompactSymbol(
          d['decimalFormats-numberSystem-latn'].long.decimalFormat[
            '1000-count-other'
          ],
          InternalSlotToken.compactName
        ),
        k
      ),
    };
    return all;
  }, {} as SignDisplayPattern);
}

function extractPercentPattern(d: NumbersData): SignDisplayPattern {
  return (['auto', 'always', 'never', 'exceptZero'] as Array<
    keyof SignDisplayPattern
  >).reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: extractSignPattern(
        d['percentFormats-numberSystem-latn'].standard,
        k
      ),
      scientific: extractSignPattern(
        d['percentFormats-numberSystem-latn'].standard.replace(
          NUMBER_PATTERN,
          SCIENTIFIC_SLOT
        ),
        k
      ),
      compactShort: extractSignPattern(
        d['percentFormats-numberSystem-latn'].standard,
        k
      ),
      compactLong: extractSignPattern(
        d['percentFormats-numberSystem-latn'].standard,
        k
      ),
    };
    return all;
  }, {} as SignDisplayPattern);
}

function extractCurrencyPattern(d: NumbersData): CurrencySignPattern {
  return {
    standard: (['auto', 'always', 'never', 'exceptZero'] as Array<
      keyof SignDisplayPattern
    >).reduce((all: SignDisplayPattern, k) => {
      all[k] = {
        standard: extractSignPattern(
          d['currencyFormats-numberSystem-latn'].standard,
          k
        ),
        scientific: extractSignPattern(
          d['currencyFormats-numberSystem-latn'].standard.replace(
            NUMBER_PATTERN,
            SCIENTIFIC_SLOT
          ),
          k
        ),
        compactShort: extractSignPattern(
          extractCompactSymbol(
            d['currencyFormats-numberSystem-latn'].short.standard[
              '1000-count-other'
            ],
            InternalSlotToken.compactSymbol
          ),
          k
        ),
        compactLong: extractSignPattern(
          extractCompactSymbol(
            d['currencyFormats-numberSystem-latn'].short.standard[
              '1000-count-other'
            ],
            InternalSlotToken.compactSymbol
          ),
          k
        ),
      };
      return all;
    }, {} as SignDisplayPattern),
    accounting: (['auto', 'always', 'never', 'exceptZero'] as Array<
      keyof SignDisplayPattern
    >).reduce((all: SignDisplayPattern, k) => {
      all[k] = {
        standard: extractSignPattern(
          d['currencyFormats-numberSystem-latn']['accounting'],
          k
        ),
        scientific: extractSignPattern(
          d['decimalFormats-numberSystem-latn'].standard,
          k
        ),
        compactShort: extractSignPattern(
          extractCompactSymbol(
            d['currencyFormats-numberSystem-latn'].short.standard[
              '1000-count-other'
            ],
            InternalSlotToken.compactSymbol
          ),
          k
        ),
        compactLong: extractSignPattern(
          extractCompactSymbol(
            d['currencyFormats-numberSystem-latn'].short.standard[
              '1000-count-other'
            ],
            InternalSlotToken.compactSymbol
          ),
          k
        ),
      };
      return all;
    }, {} as SignDisplayPattern),
  };
}

function extractUnitPattern(d: NumbersData, u: UnitsData): UnitPattern {
  return (['narrow', 'long', 'short'] as Array<keyof UnitPattern>).reduce(
    (patterns, display) => {
      const unit =
        display === 'long'
          ? InternalSlotToken.unitName
          : display === 'short'
          ? InternalSlotToken.unitSymbol
          : InternalSlotToken.unitNarrowSymbol;
      patterns[display] = (['auto', 'always', 'never', 'exceptZero'] as Array<
        keyof SignDisplayPattern
      >).reduce((all: SignDisplayPattern, k) => {
        all[k] = {
          standard: extractSignPattern(
            partitionUnitPattern(
              u[display as 'long']['acceleration-g-force'][
                'unitPattern-count-other'
              ],
              unit
            ).replace('{0}', d['decimalFormats-numberSystem-latn'].standard),
            k
          ),
          scientific: extractSignPattern(
            partitionUnitPattern(
              u[display as 'long']['acceleration-g-force'][
                'unitPattern-count-other'
              ],
              InternalSlotToken.unitSymbol
            ).replace('{0}', SCIENTIFIC_SLOT),
            k
          ),
          compactShort: extractSignPattern(
            partitionUnitPattern(
              u[display as 'long']['acceleration-g-force'][
                'unitPattern-count-other'
              ],
              InternalSlotToken.unitSymbol
            ).replace(
              '{0}',
              extractCompactSymbol(
                d['decimalFormats-numberSystem-latn'].short.decimalFormat[
                  '1000-count-other'
                ],
                InternalSlotToken.compactSymbol
              )
            ),
            k
          ),
          compactLong: extractSignPattern(
            partitionUnitPattern(
              u[display as 'long']['acceleration-g-force'][
                'unitPattern-count-other'
              ],
              InternalSlotToken.unitSymbol
            ).replace(
              '{0}',
              extractCompactSymbol(
                d['decimalFormats-numberSystem-latn'].short.decimalFormat[
                  '1000-count-other'
                ],
                InternalSlotToken.compactSymbol
              )
            ),
            k
          ),
        };
        return all;
      }, {} as SignDisplayPattern);
      return patterns;
    },
    {} as UnitPattern
  );
}

export function getAllLocales() {
  return numbersLocales;
}

function loadNumbers(locale: Locale): NumberInternalSlots {
  const numbers = (require(`cldr-numbers-full/main/${locale}/numbers.json`) as typeof Numbers)
    .main[locale as 'en'].numbers;
  const currencies = (require(`cldr-numbers-full/main/${locale}/currencies.json`) as typeof Currencies)
    .main[locale as 'en'].numbers.currencies;
  const units = (require(`cldr-units-full/main/${locale}/units.json`) as typeof Units)
    .main[locale as 'en'].units;
  try {
    return extractNumberPattern(numbers, currencies, units);
  } catch (e) {
    console.error(`Issue processing locale ${locale}`);
    throw e;
  }
}

function hasNumbers(locale: Locale): boolean {
  return numbersLocales.includes(locale);
}

export default generateFieldExtractorFn<NumberInternalSlots>(
  loadNumbers,
  hasNumbers,
  getAllLocales()
);
