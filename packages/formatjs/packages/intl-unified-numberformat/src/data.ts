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
  UnitPattern,
  CurrencyPattern,
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

import {memoize} from 'lodash';

function extractDecimalFormatILD(
  data?: Record<DecimalFormatNum, LDMLPluralRuleMap<string>> | undefined
): Record<DecimalFormatNum, LDMLPluralRuleMap<string>> | undefined {
  if (!data) {
    return;
  }
  return (Object.keys(data) as Array<DecimalFormatNum>).reduce((all, num) => {
    const pattern = data[num];

    all[num] = (Object.keys(pattern) as Array<LDMLPluralRule>).reduce(
      (all: LDMLPluralRuleMap<string>, p) => {
        all[p] = (pattern[p] || '').replace(/[¤0]/g, '').trim();
        return all;
      },
      {other: pattern.other.replace(/[¤0]/g, '').trim()}
    );
    return all;
  }, {} as Record<DecimalFormatNum, LDMLPluralRuleMap<string>>);
}

function extractLDMLPluralRuleMap<T extends object, K extends keyof T>(
  m: LDMLPluralRuleMap<T>,
  k: K
): LDMLPluralRuleMap<T[K]> {
  return (Object.keys(m) as Array<LDMLPluralRule>).reduce(
    (all: LDMLPluralRuleMap<T[K]>, rule) => {
      all[rule] = m[rule]![k];
      return all;
    },
    {other: m.other[k]}
  );
}

export function extractILD(
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
        unitSymbol: extractLDMLPluralRuleMap(units[unit].short, 'symbol'),
        unitNarrowSymbol: extractLDMLPluralRuleMap(
          units[unit].narrow,
          'symbol'
        ),
        unitName: extractLDMLPluralRuleMap(units[unit].long, 'symbol'),
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

const DUMMY_PATTERN = '#';

function produceSignPattern(positivePattern: string, negativePattern = '') {
  if (!negativePattern) {
    negativePattern = `{${InternalSlotToken.minusSign}}${positivePattern}`;
  }
  const zeroPattern = positivePattern;
  const alwaysPositivePattern = positivePattern.includes(
    `{${InternalSlotToken.plusSign}}`
  )
    ? positivePattern
    : `{${InternalSlotToken.plusSign}}${positivePattern}`;

  return {
    always: {
      positivePattern: alwaysPositivePattern,
      zeroPattern: alwaysPositivePattern,
      negativePattern,
    },
    exceptZero: {
      positivePattern: alwaysPositivePattern,
      zeroPattern,
      negativePattern,
    },
    never: {
      positivePattern,
      zeroPattern,
      negativePattern: positivePattern,
    },
    auto: {
      positivePattern,
      zeroPattern,
      negativePattern,
    },
  };
}

function extractSignPattern(
  pattern: string,
  currencyToken: InternalSlotToken = InternalSlotToken.currencyCode
) {
  const patterns = pattern.split(';');

  const [positivePattern, negativePattern] = patterns.map(p =>
    p
      .replace(NUMBER_PATTERN, `{${InternalSlotToken.number}}`)
      .replace('+', `{${InternalSlotToken.plusSign}}`)
      .replace('-', `{${InternalSlotToken.minusSign}}`)
      .replace('%', `{${InternalSlotToken.percentSign}}`)
      .replace('¤', `{${currencyToken}}`)
  );

  return produceSignPattern(positivePattern, negativePattern);
}

const dummySignPattern = extractSignPattern(
  // Dummy
  DUMMY_PATTERN
);

const scientificSignPattern = extractSignPattern(SCIENTIFIC_SLOT);

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

export function extractDecimalPattern(d: RawNumberData): SignDisplayPattern {
  const compactShortSignPattern = extractSignPattern(
    extractCompactSymbol(d.decimal.latn.short['1000'].other)
  );
  const compactLongSignPattern = extractSignPattern(
    extractCompactSymbol(
      d.decimal.latn.long['1000'].other,
      InternalSlotToken.compactName
    )
  );
  return SIGN_DISPLAYS.reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: dummySignPattern[k],
      scientific: scientificSignPattern[k],
      compactShort: compactShortSignPattern[k],
      compactLong: compactLongSignPattern[k],
    };
    return all;
  }, {} as SignDisplayPattern);
}

export function extractPercentPattern(d: RawNumberData): SignDisplayPattern {
  const percentSignPattern = extractSignPattern(d.percent.latn);
  const scientificPercentSignPattern = extractSignPattern(
    d.percent.latn.replace(NUMBER_PATTERN, SCIENTIFIC_SLOT)
  );
  return SIGN_DISPLAYS.reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: percentSignPattern[k],
      scientific: scientificPercentSignPattern[k],
      compactShort: percentSignPattern[k],
      compactLong: percentSignPattern[k],
    };
    return all;
  }, {} as SignDisplayPattern);
}

function shouldInsertBefore(currency: string, pattern: string) {
  // surroundingMatch [:digit:] check
  return (
    /[#0]¤/.test(pattern) &&
    // [:^S:]
    !/^\p{S}/u.test(currency)
  );
}

function shouldInsertAfter(currency: string, pattern: string) {
  return (
    /¤[#0]/.test(pattern) &&
    // [:^S:]
    !/\p{S}$/u.test(currency)
  );
}

function generateSymbolCurrencyPattern(
  standard: string,
  unitPattern: string,
  currencyDisplay: keyof CurrencyPattern,
  insertBetween: string,
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
  if (shouldInsertAfter(currency, standard)) {
    return standard.replace(
      '¤',
      `{${currencyToken}}${insertBetween}`
    );
  }

  // Check beforeCurrency
  if (shouldInsertBefore(currency, standard)) {
    return standard.replace(
      '¤',
      `${insertBetween}{${currencyToken}}`
    );
  }
  return standard.replace('¤', `{${currencyToken}}`);
}

function extractStandardCurrencyPattern(
  standardPattern: string,
  unitPattern: string,
  shortPattern: string,
  decimalShortPattern: string,
  decimalLongPattern: string,
  insertBetween: string,
  currencyDisplay: keyof CurrencyPattern,
  resolvedCurrency: string,
  currencyToken: InternalSlotToken
) {
  return SIGN_DISPLAYS.reduce((all: SignDisplayPattern, signDisplay) => {
    all[signDisplay] = {
      standard: extractSignPattern(
        generateSymbolCurrencyPattern(
          standardPattern,
          unitPattern.replace('{0}', DUMMY_PATTERN),
          currencyDisplay,
          insertBetween,
          resolvedCurrency
        ),
        currencyToken
      )[signDisplay],
      scientific: extractSignPattern(
        generateSymbolCurrencyPattern(
          standardPattern,
          unitPattern.replace('{0}', SCIENTIFIC_SLOT),
          currencyDisplay,
          insertBetween,
          resolvedCurrency
        ).replace(NUMBER_PATTERN, SCIENTIFIC_SLOT),
        currencyToken
      )[signDisplay],
      compactShort: extractSignPattern(
        generateSymbolCurrencyPattern(
          extractCompactSymbol(
            shortPattern
          ),
          unitPattern.replace(
            '{0}',
            extractCompactSymbol(decimalShortPattern),
          ),
          currencyDisplay,
          insertBetween,
          resolvedCurrency
        )
      )[signDisplay],
      compactLong: extractSignPattern(
        generateSymbolCurrencyPattern(
          extractCompactSymbol(
            shortPattern
          ),
          unitPattern.replace(
            '{0}',
            extractCompactSymbol(
              decimalLongPattern,
              InternalSlotToken.compactName
            )
          ),
          currencyDisplay,
          insertBetween,
          resolvedCurrency
        )
      )[signDisplay],
    };
    return all;
  }, {} as SignDisplayPattern);
}

function extractAccountingCurrencyPattern(
  d: RawNumberData,
  currencyDisplay: keyof CurrencyPattern,
  resolvedCurrency: string,
  currencyToken: InternalSlotToken
) {
  return SIGN_DISPLAYS.reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: extractSignPattern(
        generateSymbolCurrencyPattern(
          d.currency.latn.accounting,
          d.currency.latn.unitPattern.replace('{0}', DUMMY_PATTERN),
          currencyDisplay,
          d.currency.latn.currencySpacing.beforeInsertBetween,
          resolvedCurrency
        ),
        currencyToken
      )[k],
      scientific: extractSignPattern(
        generateSymbolCurrencyPattern(
          d.currency.latn.accounting,
          d.currency.latn.unitPattern.replace('{0}', SCIENTIFIC_SLOT),
          currencyDisplay,
          d.currency.latn.currencySpacing.beforeInsertBetween,
          resolvedCurrency
        ).replace(NUMBER_PATTERN, SCIENTIFIC_SLOT),
        currencyToken
      )[k],
      compactShort: extractSignPattern(
        generateSymbolCurrencyPattern(
          extractCompactSymbol(
            d.currency.latn.short ? d.currency.latn.short['1000'].other : ''
          ),
          d.currency.latn.unitPattern.replace(
            '{0}',
            extractCompactSymbol(d.decimal.latn.short['1000'].other)
          ),
          currencyDisplay,
          d.currency.latn.currencySpacing.beforeInsertBetween,
          resolvedCurrency
        )
      )[k],
      compactLong: extractSignPattern(
        generateSymbolCurrencyPattern(
          extractCompactSymbol(
            d.currency.latn.short ? d.currency.latn.short['1000'].other : ''
          ),
          d.currency.latn.unitPattern.replace(
            '{0}',
            extractCompactSymbol(
              d.decimal.latn.long['1000'].other,
              InternalSlotToken.compactName
            )
          ),
          currencyDisplay,
          d.currency.latn.currencySpacing.beforeInsertBetween,
          resolvedCurrency
        )
      )[k],
    };
    return all;
  }, {} as SignDisplayPattern);
}

export function extractCurrencyPattern(
  d: RawNumberData,
  c: Record<string, CurrencyData>
): Record<string, CurrencyPattern> {
  const availableCurrencies: Array<keyof typeof c> = Object.keys(c);
  return availableCurrencies.reduce(
    (allCurrencyData: Record<string, CurrencyPattern>, currency) => {
      const currencyData = c[currency];
      const currencyPattern = CURRENCY_DISPLAYS.reduce(
        (allCurrencyPatterns: CurrencyPattern, currencyDisplay) => {
          const resolvedCurrency: string =
            currencyDisplay === 'code'
              ? currency
              : currencyDisplay === 'symbol'
              ? currencyData.symbol
              : currencyDisplay === 'name'
              ? currencyData.displayName.other
              : currencyData.narrow;
          const currencyToken =
            currencyDisplay === 'code'
              ? InternalSlotToken.currencyCode
              : currencyDisplay === 'symbol'
              ? InternalSlotToken.currencySymbol
              : currencyDisplay === 'name'
              ? InternalSlotToken.currencyName
              : InternalSlotToken.currencyNarrowSymbol;
          allCurrencyPatterns[currencyDisplay] = {
            standard: extractStandardCurrencyPattern(
              d.currency.latn.standard,
              d.currency.latn.unitPattern,
              d.currency.latn.short ? d.currency.latn.short['1000'].other : '',
              d.decimal.latn.short['1000'].other,
              d.decimal.latn.long['1000'].other,
              d.currency.latn.currencySpacing.beforeInsertBetween,
              currencyDisplay,
              resolvedCurrency,
              currencyToken
            ),
            accounting: extractAccountingCurrencyPattern(
              d,
              currencyDisplay,
              resolvedCurrency,
              currencyToken
            ),
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

const STANDARD_PATTERN_REGEX = /{(\d)}/g;

function generateUnitPatternPayload(
  unitPatternStr: string,
  display: keyof UnitPattern,
  compactShortDecimalPattern: string,
  compactLongDecimalPattern: string
) {
  const unitToken =
    display === 'long'
      ? InternalSlotToken.unitName
      : display === 'short'
      ? InternalSlotToken.unitSymbol
      : InternalSlotToken.unitNarrowSymbol;
  const standardUnitPatternStr = unitPatternStr.replace(
    STANDARD_PATTERN_REGEX,
    (_, p) => (p === '0' ? DUMMY_PATTERN : `{${unitToken}}`)
  );

  const scientificUnitPatternStr = unitPatternStr.replace(
    STANDARD_PATTERN_REGEX,
    (_, p) => (p === '0' ? SCIENTIFIC_SLOT : `{${unitToken}}`)
  );

  const compactShortUnitPatternStr = unitPatternStr.replace(
    STANDARD_PATTERN_REGEX,
    (_, p) =>
      p === '0'
        ? extractCompactSymbol(compactShortDecimalPattern)
        : `{${unitToken}}`
  );

  const compactLongUnitPatternStr = unitPatternStr.replace(
    STANDARD_PATTERN_REGEX,
    (_, p) =>
      p === '0'
        ? extractCompactSymbol(
            compactLongDecimalPattern,
            InternalSlotToken.compactName
          )
        : `{${unitToken}}`
  );

  const standard = extractSignPattern(standardUnitPatternStr);
  const scientific = extractSignPattern(scientificUnitPatternStr);
  const compactShort = extractSignPattern(compactShortUnitPatternStr);
  const compactLong = extractSignPattern(compactLongUnitPatternStr);
  return SIGN_DISPLAYS.reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: standard[k],
      scientific: scientific[k],
      compactShort: compactShort[k],
      compactLong: compactLong[k],
    };
    return all;
  }, {} as SignDisplayPattern);
}

const memoizedGenerateUnitPatternPayload = memoize(
  generateUnitPatternPayload,
  (...args) => args.join('_$_')
);

export function extractUnitPattern(
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
        patterns[display] = memoizedGenerateUnitPatternPayload(
          unitData[display].other.pattern,
          display,
          d.decimal.latn.short['1000'].other,
          d.decimal.latn.long['1000'].other
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
