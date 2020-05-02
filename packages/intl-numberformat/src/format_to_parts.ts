import {
  DecimalFormatNum,
  LDMLPluralRule,
  LDMLPluralRuleMap,
  NumberFormatLocaleInternalData,
  RawNumberFormatResult,
  SymbolsData,
  toRawFixed,
  UnitData,
} from '@formatjs/intl-utils';
import {
  NumberFormatOptionsCompactDisplay,
  NumberFormatOptionsCurrencyDisplay,
  NumberFormatOptionsCurrencySign,
  NumberFormatOptionsNotation,
  NumberFormatOptionsStyle,
  NumberFormatOptionsUnitDisplay,
  NumberFormatPart,
} from './types';
import * as digitMapping from './data/digit-mapping.json';

// This is from: unicode-12.1.0/General_Category/Symbol/regex.js
// IE11 does not support unicode flag, otherwise this is just /\p{S}/u.
const S_UNICODE_REGEX = /[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20BF\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B98-\u2BFF\u2CE5-\u2CEA\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uFB29\uFBB2-\uFBC1\uFDFC\uFDFD\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9B\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD10-\uDD6C\uDD70-\uDDAC\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED5\uDEE0-\uDEEC\uDEF0-\uDEFA\uDF00-\uDF73\uDF80-\uDFD8\uDFE0-\uDFEB]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD00-\uDD0B\uDD0D-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDE53\uDE60-\uDE6D\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95]/;
// /^\p{S}/u
const CARET_S_UNICODE_REGEX = new RegExp(`^${S_UNICODE_REGEX.source}`);
// /\p{S}$/u
const S_DOLLAR_UNICODE_REGEX = new RegExp(`${S_UNICODE_REGEX.source}$`);

const CLDR_NUMBER_PATTERN = /[#0](?:[\.,][#0]+)*/g;

interface NumberResult {
  formattedString: string;
  roundedNumber: number;
  sign: -1 | 0 | 1;
  // Example: 100K has exponent 3 and magnitude 5.
  exponent: number;
  magnitude: number;
}

export default function formatToParts(
  numberResult: NumberResult,
  data: NumberFormatLocaleInternalData,
  pl: Intl.PluralRules,
  options: {
    numberingSystem: string;
    useGrouping: boolean;
    style: NumberFormatOptionsStyle;
    // Notation
    notation: NumberFormatOptionsNotation;
    // Compact notation
    compactDisplay?: NumberFormatOptionsCompactDisplay;
    // Currency
    currency?: string;
    currencyDisplay?: NumberFormatOptionsCurrencyDisplay;
    currencySign?: NumberFormatOptionsCurrencySign;
    // Unit
    unit?: string;
    unitDisplay?: NumberFormatOptionsUnitDisplay;
  }
): NumberFormatPart[] {
  const {sign, exponent, magnitude} = numberResult;
  const {notation, style, numberingSystem} = options;
  const defaultNumberingSystem = data.numbers.nu[0];

  // Part 1: partition and interpolate the CLDR number pattern.
  // ----------------------------------------------------------

  let compactNumberPattern: string | null = null;
  if (notation === 'compact' && magnitude) {
    compactNumberPattern = getCompactDisplayPattern(
      numberResult,
      pl,
      data,
      style,
      options.compactDisplay!,
      options.currencyDisplay,
      numberingSystem
    );
  }

  // This is used multiple times
  let nonNameCurrencyPart: string | undefined;
  if (style === 'currency' && options.currencyDisplay !== 'name') {
    const byCurrencyDisplay = data.currencies[options.currency!];
    if (byCurrencyDisplay) {
      switch (options.currencyDisplay!) {
        case 'code':
          nonNameCurrencyPart = options.currency!;
          break;
        case 'symbol':
          nonNameCurrencyPart = byCurrencyDisplay.symbol;
          break;
        default:
          nonNameCurrencyPart = byCurrencyDisplay.narrow;
          break;
      }
    } else {
      // Fallback for unknown currency
      nonNameCurrencyPart = options.currency!;
    }
  }

  let numberPattern: string;
  if (!compactNumberPattern) {
    // Note: if the style is unit, or is currency and the currency display is name,
    // its unit parts will be interpolated in part 2. So here we can fallback to decimal.
    if (
      style === 'decimal' ||
      style === 'unit' ||
      (style === 'currency' && options.currencyDisplay === 'name')
    ) {
      // Shortcut for decimal
      numberPattern = sign === 0 ? '0' : sign === -1 ? '-0' : '+0';
    } else if (style === 'currency') {
      const currencyData =
        data.numbers.currency[numberingSystem] ||
        data.numbers.currency[defaultNumberingSystem];

      // We replace number pattern part with `0` for easier postprocessing.
      numberPattern = getPatternForSign(
        currencyData[options.currencySign!],
        sign
      ).replace(CLDR_NUMBER_PATTERN, '0');
    } else {
      // percent
      const percentPattern =
        data.numbers.percent[numberingSystem] ||
        data.numbers.percent[defaultNumberingSystem];
      numberPattern = getPatternForSign(percentPattern, sign);
    }
  } else {
    numberPattern = compactNumberPattern;
  }

  // Handle currency spacing (both compact and non-compact).
  if (style === 'currency' && options.currencyDisplay !== 'name') {
    const currencyData =
      data.numbers.currency[numberingSystem] ||
      data.numbers.currency[defaultNumberingSystem];
    // See `currencySpacing` substitution rule in TR-35.
    // Here we always assume the currencyMatch is "[:^S:]" and surroundingMatch is "[:digit:]".
    //
    // Example 1: for pattern "#,##0.00¤" with symbol "US$", we replace "¤" with the symbol,
    // but insert an extra non-break space before the symbol, because "[:^S:]" matches "U" in
    // "US$" and "[:digit:]" matches the latn numbering system digits.
    //
    // Example 2: for pattern "¤#,##0.00" with symbol "US$", there is no spacing between symbol
    // a  nd number, because `$` does not match "[:^S:]".
    //
    // Implementation note: here we do the best effort to infer the insertion.
    // We also assume that `beforeInsertBetween` and `afterInsertBetween` will never be `;`.
    const afterCurrency = currencyData.currencySpacing.afterInsertBetween;
    if (afterCurrency && !S_DOLLAR_UNICODE_REGEX.test(nonNameCurrencyPart!)) {
      numberPattern = numberPattern.replace('¤0', `¤${afterCurrency}0`);
    }
    const beforeCurrency = currencyData.currencySpacing.beforeInsertBetween;
    if (beforeCurrency && !CARET_S_UNICODE_REGEX.test(nonNameCurrencyPart!)) {
      numberPattern = numberPattern.replace('0¤', `0${beforeCurrency}¤`);
    }
  }

  // Now we start to substitute patterns
  // 1. replace strings like `0` and `#,##0.00` with `{0}`
  // 2. unquote characters (invariant: the quoted characters does not contain the special tokens)
  numberPattern = numberPattern
    .replace(CLDR_NUMBER_PATTERN, '{0}')
    .replace(/'(.)'/g, '$1');

  // The following tokens are special: `{0}`, `¤`, `%`, `-`, `+`, `{c:...}.
  const numberPatternParts = numberPattern.split(/({c:[^}]+}|\{0\}|[¤%\-\+])/g);
  const numberParts: NumberFormatPart[] = [];

  const symbols =
    data.numbers.symbols[numberingSystem] ||
    data.numbers.symbols[defaultNumberingSystem];

  for (const part of numberPatternParts) {
    if (!part) {
      continue;
    }
    switch (part) {
      case '{0}': {
        // We only need to handle scientific and engineering notation here.
        numberParts.push(
          ...paritionNumberIntoParts(
            symbols,
            numberResult,
            notation,
            exponent,
            numberingSystem,
            // If compact number pattern exists, do not insert group separators.
            !compactNumberPattern && options.useGrouping
          )
        );
        break;
      }
      case '-':
        numberParts.push({type: 'minusSign', value: symbols.minusSign});
        break;
      case '+':
        numberParts.push({type: 'plusSign', value: symbols.plusSign});
        break;
      case '%':
        numberParts.push({type: 'percentSign', value: symbols.percentSign});
        break;
      case '¤':
        // Computed above when handling currency spacing.
        numberParts.push({type: 'currency', value: nonNameCurrencyPart!});
        break;
      default:
        if (/^\{c:/.test(part)) {
          numberParts.push({
            type: 'compact',
            value: part.substring(3, part.length - 1),
          });
        } else {
          // literal
          numberParts.push({type: 'literal', value: part});
        }
        break;
    }
  }

  // Part 2: interpolate unit pattern if necessary.
  // ----------------------------------------------

  switch (style) {
    case 'currency': {
      // `currencyDisplay: 'name'` has similar pattern handling as units.
      if (options.currencyDisplay === 'name') {
        const unitPattern = (
          data.numbers.currency[numberingSystem] ||
          data.numbers.currency[defaultNumberingSystem]
        ).unitPattern;

        // Select plural
        let unitName: string;
        const currencyNameData = data.currencies[options.currency!];
        if (currencyNameData) {
          unitName = selectPlural(
            pl,
            // NOTE: Google Chrome's Intl.NumberFormat uses the original number to determine the plurality,
            // but the mantissa for unit. We think this is a bug in ICU, but will still replicate the behavior.
            // TODO: use original number.
            numberResult.roundedNumber * 10 ** exponent,
            currencyNameData.displayName
          );
        } else {
          // Fallback for unknown currency
          unitName = options.currency!;
        }

        // Do {0} and {1} substitution
        const unitPatternParts = unitPattern.split(/(\{[01]\})/g);

        const result: NumberFormatPart[] = [];
        for (const part of unitPatternParts) {
          switch (part) {
            case '{0}':
              result.push(...numberParts);
              break;
            case '{1}':
              result.push({type: 'currency', value: unitName});
              break;
            default:
              if (part) {
                result.push({type: 'literal', value: part});
              }
              break;
          }
        }
        return result;
      } else {
        return numberParts;
      }
    }
    case 'unit': {
      const {unit, unitDisplay} = options;

      let unitData: UnitData | undefined = data.units.simple[unit!];

      let unitPattern: string;
      if (unitData) {
        // Simple unit pattern
        unitPattern = selectPlural(
          pl,
          numberResult.roundedNumber,
          data.units.simple[unit!][unitDisplay!]
        );
      } else {
        // See: http://unicode.org/reports/tr35/tr35-general.html#perUnitPatterns
        // If cannot find unit in the simple pattern, it must be "per" compound pattern.
        // Implementation note: we are not following TR-35 here because we need to format to parts!
        const [numeratorUnit, denominatorUnit] = unit!.split('-per-');
        unitData = data.units.simple[numeratorUnit];

        const numeratorUnitPattern = selectPlural(
          pl,
          numberResult.roundedNumber,
          data.units.simple[numeratorUnit!][unitDisplay!]
        );
        const perUnitPattern =
          data.units.simple[denominatorUnit].perUnit[unitDisplay!];

        if (perUnitPattern) {
          // perUnitPattern exists, combine it with numeratorUnitPattern
          unitPattern = perUnitPattern.replace('{0}', numeratorUnitPattern);
        } else {
          // get compoundUnit pattern (e.g. "{0} per {1}"), repalce {0} with numerator pattern and {1} with
          // the denominator pattern in singular form.
          const perPattern = data.units.compound.per[unitDisplay!];
          const denominatorPattern = selectPlural(
            pl,
            1,
            data.units.simple[denominatorUnit][unitDisplay!]
          );
          unitPattern = unitPattern = perPattern
            .replace('{0}', numeratorUnitPattern)
            .replace('{1}', denominatorPattern.replace('{0}', ''));
        }
      }

      const result: NumberFormatPart[] = [];
      // We need spacing around "{0}" because they are not treated as "unit" parts, but "literal".
      for (const part of unitPattern.split(/(\s*\{0\}\s*)/)) {
        const interpolateMatch = /^(\s*)\{0\}(\s*)$/.exec(part);
        if (interpolateMatch) {
          // Space before "{0}"
          if (interpolateMatch[1]) {
            result.push({type: 'literal', value: interpolateMatch[1]});
          }
          // "{0}" itself
          result.push(...numberParts);
          // Space after "{0}"
          if (interpolateMatch[2]) {
            result.push({type: 'literal', value: interpolateMatch[2]});
          }
        } else if (part) {
          result.push({type: 'unit', value: part});
        }
      }

      return result;
    }
    default:
      return numberParts;
  }
}

// A subset of https://tc39.es/ecma402/#sec-partitionnotationsubpattern
// Plus the exponent parts handling.
function paritionNumberIntoParts(
  symbols: SymbolsData,
  numberResult: Pick<
    RawNumberFormatResult,
    'formattedString' | 'roundedNumber'
  >,
  notation: NumberFormatOptionsNotation,
  exponent: number,
  numberingSystem: string,
  useGrouping: boolean
): NumberFormatPart[] {
  const result: NumberFormatPart[] = [];
  // eslint-disable-next-line prefer-const
  let {formattedString: n, roundedNumber: x} = numberResult;

  if (isNaN(x)) {
    return [{type: 'nan', value: n}];
  } else if (!isFinite(x)) {
    return [{type: 'infinity', value: n}];
  }

  const digitReplacementTable = digitMapping[numberingSystem as 'arab'];
  if (digitReplacementTable) {
    n = n.replace(/\d/g, digit => digitReplacementTable[+digit] || digit);
  }
  // TODO: Else use an implementation dependent algorithm to map n to the appropriate
  // representation of n in the given numbering system.
  const decimalSepIndex = n.indexOf('.');
  let integer: string;
  let fraction: string | undefined;
  if (decimalSepIndex > 0) {
    integer = n.slice(0, decimalSepIndex);
    fraction = n.slice(decimalSepIndex + 1);
  } else {
    integer = n;
  }

  // The weird compact and x >= 10000 check is to ensure consistency with Node.js and Chrome.
  // Note that `de` does not have compact form for thousands, but Node.js does not insert grouping separator
  // unless the rounded number is greater than 10000:
  //   NumberFormat('de', {notation: 'compact', compactDisplay: 'short'}).format(1234) //=> "1234"
  //   NumberFormat('de').format(1234) //=> "1.234"
  if (useGrouping && (notation !== 'compact' || x >= 10000)) {
    const groupSepSymbol = symbols.group;
    const groups: string[] = [];
    // Assuming that the group separator is always inserted between every 3 digits.
    let i = integer.length - 3;
    for (; i > 0; i -= 3) {
      groups.push(integer.slice(i, i + 3));
    }
    groups.push(integer.slice(0, i + 3));
    while (groups.length > 0) {
      const integerGroup = groups.pop()!;
      result.push({type: 'integer', value: integerGroup});
      if (groups.length > 0) {
        result.push({type: 'group', value: groupSepSymbol});
      }
    }
  } else {
    result.push({type: 'integer', value: integer});
  }

  if (fraction !== undefined) {
    result.push(
      {type: 'decimal', value: symbols.decimal},
      {type: 'fraction', value: fraction}
    );
  }

  if (
    (notation === 'scientific' || notation === 'engineering') &&
    isFinite(x)
  ) {
    result.push({type: 'exponentSeparator', value: symbols.exponential});
    if (exponent < 0) {
      result.push({type: 'exponentMinusSign', value: symbols.minusSign});
      exponent = -exponent;
    }
    const exponentResult = toRawFixed(exponent, 0, 0);
    result.push({
      type: 'exponentInteger',
      value: exponentResult.formattedString,
    });
  }

  return result;
}

function getPatternForSign(pattern: string, sign: -1 | 0 | 1): string {
  if (pattern.indexOf(';') < 0) {
    pattern = `${pattern};-${pattern}`;
  }
  const [zeroPattern, negativePattern] = pattern.split(';');
  switch (sign) {
    case 0:
      return zeroPattern;
    case -1:
      return negativePattern;
    default:
      return negativePattern.indexOf('-') >= 0
        ? negativePattern.replace(/-/g, '+')
        : `+${zeroPattern}`;
  }
}

// Find the CLDR pattern for compact notation based on the magnitude of data and style.
//
// Example return value: "¤ {c:laki}000;¤{c:laki} -0" (`sw` locale):
// - Notice the `{c:...}` token that wraps the compact literal.
// - The consecutive zeros are normalized to single zero to match CLDR_NUMBER_PATTERN.
//
// Returning null means the compact display pattern cannot be found.
function getCompactDisplayPattern(
  numberResult: NumberResult,
  pl: Intl.PluralRules,
  data: NumberFormatLocaleInternalData,
  style: NumberFormatOptionsStyle,
  compactDisplay: NumberFormatOptionsCompactDisplay,
  currencyDisplay: NumberFormatOptionsCurrencyDisplay | undefined,
  numberingSystem: string
): string | null {
  const {roundedNumber, sign, magnitude} = numberResult;
  const magnitudeKey = String(10 ** magnitude) as DecimalFormatNum;
  const defaultNumberingSystem = data.numbers.nu[0];

  let pattern: string;
  if (style === 'currency' && currencyDisplay !== 'name') {
    const byNumberingSystem = data.numbers.currency;
    const currencyData =
      byNumberingSystem[numberingSystem] ||
      byNumberingSystem[defaultNumberingSystem];

    // NOTE: compact notation ignores currencySign!
    const compactPluralRules = currencyData.short?.[magnitudeKey];
    if (!compactPluralRules) {
      return null;
    }
    pattern = selectPlural(pl, roundedNumber, compactPluralRules);
  } else {
    const byNumberingSystem = data.numbers.decimal;
    const byCompactDisplay =
      byNumberingSystem[numberingSystem] ||
      byNumberingSystem[defaultNumberingSystem];

    const compactPlaralRule = byCompactDisplay[compactDisplay][magnitudeKey];
    if (!compactPlaralRule) {
      return null;
    }
    pattern = selectPlural(pl, roundedNumber, compactPlaralRule);
  }
  // See https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
  // > If the value is precisely “0”, either explicit or defaulted, then the normal number format
  // > pattern for that sort of object is supplied.
  if (pattern === '0') {
    return null;
  }

  pattern = getPatternForSign(pattern, sign)
    // Extract compact literal from the pattern
    .replace(/([^\s;\-\+\d¤]+)/g, '{c:$1}')
    // We replace one or more zeros with a single zero so it matches `CLDR_NUMBER_PATTERN`.
    .replace(/0+/, '0');

  return pattern;
}

function selectPlural<T>(
  pl: Intl.PluralRules,
  x: number,
  rules: LDMLPluralRuleMap<T>
): T {
  return rules[pl.select(x) as LDMLPluralRule] || rules.other;
}
