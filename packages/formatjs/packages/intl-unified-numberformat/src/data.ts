import {
  NumberInternalSlots,
  UnitData,
  CurrencyData,
  RawNumberData,
  LDMLPluralRule,
  DecimalFormatNum,
  NumberILD,
  InternalSlotToken,
  SignDisplayPattern,
  SignPattern,
  UnitPattern,
  CurrencyPattern,
  CurrencySpacingData,
  LDMLPluralRuleMap,
} from '@formatjs/intl-utils';

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

function extractDecimalFormatILD(
  data: Record<DecimalFormatNum, string | LDMLPluralRuleMap<string>> | undefined
): Record<DecimalFormatNum, string | LDMLPluralRuleMap<string>> | undefined {
  if (!data) {
    return;
  }
  return (Object.keys(data) as Array<DecimalFormatNum>).reduce((all, num) => {
    let pattern: string | LDMLPluralRuleMap<string> = data[num];
    if (typeof pattern === 'string') {
      pattern = pattern.replace(/[¤0]/g, '').trim();
    } else {
      pattern = (Object.keys(pattern) as Array<LDMLPluralRule>).reduce(
        (all: LDMLPluralRuleMap<string>, p) => {
          all[p] = ((pattern as LDMLPluralRuleMap<string>)[p] || '')
            .replace(/[¤0]/g, '')
            .trim();
          return all;
        },
        {}
      );
    }
    all[num] = pattern;
    return all;
  }, {} as Record<DecimalFormatNum, string | LDMLPluralRuleMap<string>>);
}

function processLDMLMap(
  rule: string | LDMLPluralRuleMap<string>,
  fn: (s: string) => string
): string | LDMLPluralRuleMap<string>;
function processLDMLMap(
  rule: string | LDMLPluralRuleMap<string> | undefined,
  fn: (s: string) => string
): string | LDMLPluralRuleMap<string> | undefined {
  if (!rule) {
    return rule;
  }
  if (typeof rule === 'string') {
    return fn(rule);
  }

  return (Object.keys(rule) as Array<LDMLPluralRule>).reduce(
    (all: LDMLPluralRuleMap<string>, k) => {
      all[k] = fn(rule[k] || '');
      return all;
    },
    {}
  );
}

function prune0Token(str: string): string {
  return str.replace(PATTERN_0_REGEX, '');
}

function extractILD(
  units: Record<string, UnitData>,
  currencies: Record<string, CurrencyData>,
  numbers: RawNumberData,
  numberingSystem: string
): NumberILD {
  return {
    decimal: {
      compactShort: extractDecimalFormatILD(
        numbers.decimal[numberingSystem].short
      ),
      compactLong: extractDecimalFormatILD(
        numbers.decimal[numberingSystem].long
      ),
    },
    currency: {
      compactShort: extractDecimalFormatILD(
        numbers.currency[numberingSystem].short
      ),
    },
    symbols: numbers.symbols[numberingSystem],
    currencySymbols: Object.keys(currencies).reduce((all, code) => {
      all[code] = {
        currencyName: currencies[code].displayName,
        currencySymbol: currencies[code].symbol,
        currencyNarrowSymbol:
          currencies[code].narrow || currencies[code].symbol,
      };
      return all;
    }, {} as NumberILD['currencySymbols']),
    unitSymbols: Object.keys(units).reduce((all, unit) => {
      all[unit] = {
        unitSymbol: processLDMLMap(units[unit].short, prune0Token),
        unitNarrowSymbol: processLDMLMap(units[unit].narrow!, prune0Token),
        unitName: processLDMLMap(units[unit].long, prune0Token),
      };
      return all;
    }, {} as NumberILD['unitSymbols']),
  };
}

// Credit: https://github.com/andyearnshaw/Intl.js/blob/master/scripts/utils/reduce.js
// Matches CLDR number patterns, e.g. #,##0.00, #,##,##0.00, #,##0.##, #E0, etc.
const NUMBER_PATTERN = /[#0](?:[\.,][#0]+)*/g;
const SCIENTIFIC_SLOT = [
  InternalSlotToken.number,
  InternalSlotToken.scientificSeparator,
  InternalSlotToken.scientificExponent,
]
  .map(t => `{${t}}`)
  .join('');
// Matches things like `foo {0}`, `foo{0}`, `{0}foo`
const PATTERN_0_REGEX = /\s?\{0\}\s?/g;
const DUMMY_PATTERN = '#';

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
      negativePattern = positivePattern;
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
      .replace(/^(\{0\}\s?)(.+)$/, `$1{${tokenType}}`)
      // Handle `foo{0}` & `foo {0}`
      .replace(/^(.*?)(\s?\{0\})$/, `{${tokenType}}$2`)
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
 * Turn compact pattern like `0 trillion` or `¤0 trillion` to `0 {compactSymbol}`
 * @param pattern
 */
function extractCompactSymbol(
  pattern: string,
  slotToken: InternalSlotToken = InternalSlotToken.compactSymbol
): string {
  const compactUnit = pattern.replace(/[¤0]/g, '').trim();
  return pattern.replace(compactUnit, `{${slotToken}}`);
}

function extractDecimalPattern(d: RawNumberData): SignDisplayPattern {
  return SIGN_DISPLAYS.reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: extractSignPattern(
        // Dummy
        DUMMY_PATTERN,
        k
      ),
      scientific: extractSignPattern(SCIENTIFIC_SLOT, k),
      compactShort: extractSignPattern(
        extractCompactSymbol(d.decimal.latn.short['1000'] as string),
        k
      ),
      compactLong: extractSignPattern(
        extractCompactSymbol(
          d.decimal.latn.long['1000'] as string,
          InternalSlotToken.compactName
        ),
        k
      ),
    };
    return all;
  }, {} as SignDisplayPattern);
}

function extractPercentPattern(d: RawNumberData): SignDisplayPattern {
  return SIGN_DISPLAYS.reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: extractSignPattern(d.percent.latn, k),
      scientific: extractSignPattern(
        d.percent.latn.replace(NUMBER_PATTERN, SCIENTIFIC_SLOT),
        k
      ),
      compactShort: extractSignPattern(d.percent.latn, k),
      compactLong: extractSignPattern(d.percent.latn, k),
    };
    return all;
  }, {} as SignDisplayPattern);
}

function generateSymbolCurrencyPattern(
  {
    standard,
    unitPattern,
    currencySpacing,
  }: {
    standard: string;
    unitPattern: string;
    currencySpacing: CurrencySpacingData;
  },
  currencyDisplay: keyof CurrencyPattern,
  currency: string
): string {
  if (currencyDisplay === 'name') {
    return unitPattern.replace('{1}', `{${InternalSlotToken.currencyName}}`);
  }
  const currencyToken =
    currencyDisplay === 'symbol'
      ? InternalSlotToken.currencySymbol
      : currencyDisplay === 'code'
      ? InternalSlotToken.currencyCode
      : InternalSlotToken.currencyNarrowSymbol;

  // Check afterCurrency
  if (
    // surroundingMatch [:digit:] check
    /¤[#0]/.test(standard) &&
    // [:^S:]
    !/\p{S}$/u.test(currency)
  ) {
    return standard.replace(
      '¤',
      `{${currencyToken}}${currencySpacing.afterCurrency.insertBetween}`
    );
  }

  // Check beforeCurrency
  if (
    // surroundingMatch [:digit:] check
    /[#0]¤/.test(standard) &&
    // [:^S:]
    !/^\p{S}/u.test(currency)
  ) {
    return standard.replace(
      '¤',
      `${currencySpacing.beforeCurrency.insertBetween}{${currencyToken}}`
    );
  }
  return standard.replace('¤', `{${currencyToken}}`);
}

function extractCurrencyPattern(
  d: RawNumberData,
  c: Record<string, CurrencyData>
): Record<string, CurrencyPattern> {
  const availableCurrencies: Array<keyof typeof c> = Object.keys(c);
  return availableCurrencies.reduce(
    (allCurrencyData: Record<string, CurrencyPattern>, currency) => {
      const currencyData = c[currency];
      const currencyPattern = CURRENCY_DISPLAYS.reduce(
        (allCurrencyPatterns: CurrencyPattern, currencyDisplay) => {
          let resolvedCurrencyDisplay = currencyDisplay;
          if (
            resolvedCurrencyDisplay === 'narrowSymbol' &&
            !currencyData.narrow
          ) {
            resolvedCurrencyDisplay = 'symbol';
          }
          if (resolvedCurrencyDisplay === 'symbol' && !currencyData.symbol) {
            resolvedCurrencyDisplay = 'code';
          }
          const resolvedCurrency: string =
            resolvedCurrencyDisplay === 'code'
              ? currency
              : resolvedCurrencyDisplay === 'symbol'
              ? currencyData.symbol
              : resolvedCurrencyDisplay === 'name'
              ? (currencyData.displayName as string)
              : currencyData.narrow!;
          const currencyToken =
            resolvedCurrencyDisplay === 'code'
              ? InternalSlotToken.currencyCode
              : resolvedCurrencyDisplay === 'symbol'
              ? InternalSlotToken.currencySymbol
              : resolvedCurrencyDisplay === 'name'
              ? InternalSlotToken.currencyName
              : InternalSlotToken.currencyNarrowSymbol;
          allCurrencyPatterns[currencyDisplay] = {
            standard: SIGN_DISPLAYS.reduce(
              (all: SignDisplayPattern, signDisplay) => {
                all[signDisplay] = {
                  standard: extractSignPattern(
                    generateSymbolCurrencyPattern(
                      {
                        unitPattern: d.currency.latn.unitPattern.replace(
                          '{0}',
                          DUMMY_PATTERN
                        ),
                        standard: d.currency.latn.standard,
                        currencySpacing: d.currency.latn.currencySpacing,
                      },
                      resolvedCurrencyDisplay,
                      resolvedCurrency
                    ),
                    signDisplay,
                    currencyToken
                  ),
                  scientific: extractSignPattern(
                    generateSymbolCurrencyPattern(
                      {
                        unitPattern: d.currency.latn.unitPattern.replace(
                          '{0}',
                          SCIENTIFIC_SLOT
                        ),
                        standard: d.currency.latn.standard,
                        currencySpacing: d.currency.latn.currencySpacing,
                      },
                      resolvedCurrencyDisplay,
                      resolvedCurrency
                    ).replace(NUMBER_PATTERN, SCIENTIFIC_SLOT),
                    signDisplay,
                    currencyToken
                  ),
                  compactShort: extractSignPattern(
                    generateSymbolCurrencyPattern(
                      {
                        standard: extractCompactSymbol(
                          d.currency.latn.short
                            ? (d.currency.latn.short['1000'] as string)
                            : ''
                        ),
                        unitPattern: d.currency.latn.unitPattern.replace(
                          '{0}',
                          extractCompactSymbol(
                            d.decimal.latn.short['1000'] as string
                          )
                        ),
                        currencySpacing: d.currency.latn.currencySpacing,
                      },
                      resolvedCurrencyDisplay,
                      resolvedCurrency
                    ),
                    signDisplay
                  ),
                  compactLong: extractSignPattern(
                    generateSymbolCurrencyPattern(
                      {
                        standard: extractCompactSymbol(
                          d.currency.latn.short
                            ? (d.currency.latn.short['1000'] as string)
                            : ''
                        ),
                        unitPattern: d.currency.latn.unitPattern.replace(
                          '{0}',
                          extractCompactSymbol(
                            d.decimal.latn.long['1000'] as string,
                            InternalSlotToken.compactName
                          )
                        ),
                        currencySpacing: d.currency.latn.currencySpacing,
                      },
                      resolvedCurrencyDisplay,
                      resolvedCurrency
                    ),
                    signDisplay
                  ),
                };
                return all;
              },
              {} as SignDisplayPattern
            ),
            accounting: SIGN_DISPLAYS.reduce((all: SignDisplayPattern, k) => {
              all[k] = {
                standard: extractSignPattern(
                  generateSymbolCurrencyPattern(
                    {
                      unitPattern: d.currency.latn.unitPattern.replace(
                        '{0}',
                        DUMMY_PATTERN
                      ),
                      standard: d.currency.latn.accounting,
                      currencySpacing: d.currency.latn.currencySpacing,
                    },
                    resolvedCurrencyDisplay,
                    resolvedCurrency
                  ),
                  k,
                  currencyToken
                ),
                scientific: extractSignPattern(
                  generateSymbolCurrencyPattern(
                    {
                      unitPattern: d.currency.latn.unitPattern.replace(
                        '{0}',
                        SCIENTIFIC_SLOT
                      ),
                      standard: d.currency.latn.accounting,
                      currencySpacing: d.currency.latn.currencySpacing,
                    },
                    resolvedCurrencyDisplay,
                    resolvedCurrency
                  ).replace(NUMBER_PATTERN, SCIENTIFIC_SLOT),
                  k,
                  currencyToken
                ),
                compactShort: extractSignPattern(
                  generateSymbolCurrencyPattern(
                    {
                      standard: extractCompactSymbol(
                        d.currency.latn.short
                          ? (d.currency.latn.short['1000'] as string)
                          : ''
                      ),
                      unitPattern: d.currency.latn.unitPattern.replace(
                        '{0}',
                        extractCompactSymbol(
                          d.decimal.latn.short['1000'] as string
                        )
                      ),
                      currencySpacing: d.currency.latn.currencySpacing,
                    },
                    resolvedCurrencyDisplay,
                    resolvedCurrency
                  ),
                  k
                ),
                compactLong: extractSignPattern(
                  generateSymbolCurrencyPattern(
                    {
                      standard: extractCompactSymbol(
                        d.currency.latn.short
                          ? (d.currency.latn.short['1000'] as string)
                          : ''
                      ),
                      unitPattern: d.currency.latn.unitPattern.replace(
                        '{0}',
                        extractCompactSymbol(
                          d.decimal.latn.long['1000'] as string,
                          InternalSlotToken.compactName
                        )
                      ),
                      currencySpacing: d.currency.latn.currencySpacing,
                    },
                    resolvedCurrencyDisplay,
                    resolvedCurrency
                  ),
                  k
                ),
              };
              return all;
            }, {} as SignDisplayPattern),
          };
          return allCurrencyPatterns;
        },
        {} as CurrencyPattern
      );
      allCurrencyData[currency] = currencyPattern;
      return allCurrencyData;
    },
    {}
  );
}

function extractUnitPattern(
  d: RawNumberData,
  u: Record<string, UnitData>
): Record<string, UnitPattern> {
  const availableUnits = Object.keys(u);
  return availableUnits.reduce(
    (allUnitPatterns: Record<string, UnitPattern>, unit) => {
      const unitData = u[unit];
      allUnitPatterns[unit] = (['narrow', 'long', 'short'] as Array<
        keyof UnitPattern
      >).reduce((patterns, display) => {
        const unit =
          display === 'long'
            ? InternalSlotToken.unitName
            : display === 'short'
            ? InternalSlotToken.unitSymbol
            : InternalSlotToken.unitNarrowSymbol;
        const unitPattern = unitData[display as 'long'];
        const unitPatternStr =
          typeof unitPattern === 'string'
            ? unitPattern
            : unitPattern.other || '';
        patterns[display] = SIGN_DISPLAYS.reduce(
          (all: SignDisplayPattern, k) => {
            all[k] = {
              standard: extractSignPattern(
                partitionUnitPattern(unitPatternStr, unit).replace(
                  '{0}',
                  DUMMY_PATTERN
                ),
                k
              ),
              scientific: extractSignPattern(
                partitionUnitPattern(unitPatternStr, unit).replace(
                  '{0}',
                  SCIENTIFIC_SLOT
                ),
                k
              ),
              compactShort: extractSignPattern(
                partitionUnitPattern(unitPatternStr, unit).replace(
                  '{0}',
                  extractCompactSymbol(d.decimal.latn.short['1000'] as string)
                ),
                k
              ),
              compactLong: extractSignPattern(
                partitionUnitPattern(unitPatternStr, unit).replace(
                  '{0}',
                  extractCompactSymbol(
                    d.decimal.latn.long['1000'] as string,
                    InternalSlotToken.compactName
                  )
                ),
                k
              ),
            };
            return all;
          },
          {} as SignDisplayPattern
        );
        return patterns;
      }, {} as UnitPattern);
      return allUnitPatterns;
    },
    {}
  );
}

export function rawDataToInternalSlots(
  units: Record<string, UnitData>,
  currencies: Record<string, CurrencyData>,
  numbers: RawNumberData,
  numberingSystem: string
): NumberInternalSlots {
  return {
    nu: numbers.nu,
    patterns: {
      decimal: extractDecimalPattern(numbers),
      percent: extractPercentPattern(numbers),
      currency: extractCurrencyPattern(numbers, currencies),
      unit: extractUnitPattern(numbers, units),
    },
    ild: extractILD(units, currencies, numbers, numberingSystem),
  };
}

function generateContinuousILND(startChar: string): string[] {
  const startCharCode = startChar.charCodeAt(0);
  const arr = new Array<string>(10);
  for (let i = 0; i < 10; i++) {
    arr[i] = String.fromCharCode(startCharCode + i);
  }
  return arr;
}

// https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#table-numbering-system-digits
export const ILND: Record<string, string[]> = (function() {
  return {
    arab: generateContinuousILND('\u0660'),
    arabext: generateContinuousILND('\u06f0'),
    bali: generateContinuousILND('\u1b50'),
    beng: generateContinuousILND('\u09e6'),
    deva: generateContinuousILND('\u0966'),
    fullwide: generateContinuousILND('\uff10'),
    gujr: generateContinuousILND('\u0ae6'),
    guru: generateContinuousILND('\u0a66'),
    khmr: generateContinuousILND('\u17e0'),
    knda: generateContinuousILND('\u0ce6'),
    laoo: generateContinuousILND('\u0ed0'),
    latn: generateContinuousILND('\u0030'),
    limb: generateContinuousILND('\u1946'),
    mlym: generateContinuousILND('\u0d66'),
    mong: generateContinuousILND('\u1810'),
    mymr: generateContinuousILND('\u1040'),
    orya: generateContinuousILND('\u0b66'),
    tamldec: generateContinuousILND('\u0be6'),
    telu: generateContinuousILND('\u0c66'),
    thai: generateContinuousILND('\u0e50'),
    tibt: generateContinuousILND('\u0f20'),
    hanidec: [
      '\u3007',
      '\u4e00',
      '\u4e8c',
      '\u4e09',
      '\u56db',
      '\u4e94',
      '\u516d',
      '\u4e03',
      '\u516b',
      '\u4e5d',
    ],
  };
})();
