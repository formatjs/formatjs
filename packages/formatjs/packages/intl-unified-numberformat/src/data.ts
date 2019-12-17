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
  CurrencySignPattern,
  SignPattern,
  UnitPattern,
} from '@formatjs/intl-utils';

function extractDecimalFormatILD(
  data:
    | Record<DecimalFormatNum, string | Record<LDMLPluralRule, string>>
    | undefined
):
  | Record<DecimalFormatNum, string | Record<LDMLPluralRule, string>>
  | undefined {
  if (!data) {
    return;
  }
  return (Object.keys(data) as Array<DecimalFormatNum>).reduce((all, num) => {
    let pattern = data[num];
    if (typeof pattern === 'string') {
      pattern = pattern.replace(/[¤0]/g, '').trim();
    } else {
      pattern = (Object.keys(pattern) as Array<LDMLPluralRule>).reduce(
        (all, p) => {
          all[p] = (pattern as Record<LDMLPluralRule, string>)[p]
            .replace(/[¤0]/g, '')
            .trim();
          return all;
        },
        {} as Record<LDMLPluralRule, string>
      );
    }
    all[num] = pattern;
    return all;
  }, {} as Record<DecimalFormatNum, string | Record<LDMLPluralRule, string>>);
}

function processLDMLMap (rule: string | Record<LDMLPluralRule, string> , fn: (s: string) => string): string | Record<LDMLPluralRule, string>
function processLDMLMap (rule: string | Record<LDMLPluralRule, string> | undefined , fn: (s: string) => string): string | Record<LDMLPluralRule, string> | undefined {
  if (!rule) {
    return rule
  }
  if (typeof rule === 'string') {
    return fn(rule)
  }
  
  return (Object.keys(rule) as Array<LDMLPluralRule>).reduce((all, k) => {
    all[k] = fn(rule[k])
    return all
  }, {} as Record<LDMLPluralRule, string>)
}

function shortenUnit(unit: string) {
  return unit.replace(/^(.*?)-/, '');
}

function prune0Token (str: string): string {
  return str.replace(PATTERN_0_REGEX, '')
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
        currencyNarrowSymbol: currencies[code].narrow,
      };
      return all;
    }, {} as NumberILD['currencySymbols']),
    unitSymbols: Object.keys(units).reduce((all, unit) => {
      all[shortenUnit(unit)] = {
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

function extractDecimalPattern(d: RawNumberData): SignDisplayPattern {
  return (['auto', 'always', 'never', 'exceptZero'] as Array<
    keyof SignDisplayPattern
  >).reduce((all: SignDisplayPattern, k) => {
    all[k] = {
      standard: extractSignPattern(
        // Dummy
        DUMMY_PATTERN,
        k
      ),
      scientific: SCIENTIFIC_SIGN_PATTERN,
      compactShort: extractSignPattern(
        extractCompactSymbol(
          d.decimal.latn.short['1000'] as string,
          InternalSlotToken.compactSymbol
        ),
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
  return (['auto', 'always', 'never', 'exceptZero'] as Array<
    keyof SignDisplayPattern
  >).reduce((all: SignDisplayPattern, k) => {
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

function extractCurrencyPattern(d: RawNumberData): CurrencySignPattern {
  return {
    standard: (['auto', 'always', 'never', 'exceptZero'] as Array<
      keyof SignDisplayPattern
    >).reduce((all: SignDisplayPattern, k) => {
      all[k] = {
        standard: extractSignPattern(d.currency.latn.standard, k),
        scientific: extractSignPattern(
          d.currency.latn.standard.replace(NUMBER_PATTERN, SCIENTIFIC_SLOT),
          k
        ),
        compactShort: extractSignPattern(
          extractCompactSymbol(
            d.currency.latn.short
              ? (d.currency.latn.short['1000'] as string)
              : '',
            InternalSlotToken.compactSymbol
          ),
          k
        ),
        compactLong: extractSignPattern(
          extractCompactSymbol(
            d.currency.latn.short
              ? (d.currency.latn.short['1000'] as string)
              : '',
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
        standard: extractSignPattern(d.currency.latn.accounting, k),
        scientific: extractSignPattern(DUMMY_PATTERN, k),
        compactShort: extractSignPattern(
          extractCompactSymbol(
            d.currency.latn.short
              ? (d.currency.latn.short['1000'] as string)
              : '',
            InternalSlotToken.compactSymbol
          ),
          k
        ),
        compactLong: extractSignPattern(
          extractCompactSymbol(
            d.currency.latn.short
              ? (d.currency.latn.short['1000'] as string)
              : '',
            InternalSlotToken.compactSymbol
          ),
          k
        ),
      };
      return all;
    }, {} as SignDisplayPattern),
  };
}

function extractUnitPattern(
  d: RawNumberData,
  u: Record<string, UnitData>
): UnitPattern {
  return (['narrow', 'long', 'short'] as Array<keyof UnitPattern>).reduce(
    (patterns, display) => {
      const unit =
        display === 'long'
          ? InternalSlotToken.unitName
          : display === 'short'
          ? InternalSlotToken.unitSymbol
          : InternalSlotToken.unitNarrowSymbol;
      const unitPattern = u['digital-bit'][display as 'long'];
      const unitPatternStr =
        typeof unitPattern === 'string' ? unitPattern : unitPattern.other;
      patterns[display] = (['auto', 'always', 'never', 'exceptZero'] as Array<
        keyof SignDisplayPattern
      >).reduce((all: SignDisplayPattern, k) => {
        all[k] = {
          standard: extractSignPattern(
            partitionUnitPattern(unitPatternStr, unit).replace(
              '{0}',
              DUMMY_PATTERN
            ),
            k
          ),
          scientific: extractSignPattern(
            partitionUnitPattern(
              unitPatternStr,
              InternalSlotToken.unitSymbol
            ).replace('{0}', SCIENTIFIC_SLOT),
            k
          ),
          compactShort: extractSignPattern(
            partitionUnitPattern(
              unitPatternStr,
              InternalSlotToken.unitSymbol
            ).replace(
              '{0}',
              extractCompactSymbol(
                d.decimal.latn.short['1000'] as string,
                InternalSlotToken.compactSymbol
              )
            ),
            k
          ),
          compactLong: extractSignPattern(
            partitionUnitPattern(
              unitPatternStr,
              InternalSlotToken.unitSymbol
            ).replace(
              '{0}',
              extractCompactSymbol(
                d.decimal.latn.short['1000'] as string,
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
      currency: extractCurrencyPattern(numbers),
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