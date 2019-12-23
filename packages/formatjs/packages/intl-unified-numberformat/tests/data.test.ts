import {
  extractStandardCurrencyPattern,
  replaceCurrencySymbolWithToken,
} from '../src/data';
import {InternalSlotToken} from '@formatjs/intl-utils';
describe('data', function() {
  it('extractStandardCurrencyPattern', function() {
    expect(
      extractStandardCurrencyPattern(
        '¤#,##0.00',
        '{0} {1}',
        '¤0K',
        '0K',
        '0 thousand',
        'narrowSymbol'
      )
    ).toMatchSnapshot();
  });
  it('replaceCurrencySymbolWithToken', function() {
    expect(
      replaceCurrencySymbolWithToken(
        'ZWD',
        '{plusSign}¤{number}{compactSymbol}',
        ' ',
        InternalSlotToken.currencyNarrowSymbol
      )
    ).toMatchInlineSnapshot(
      `"{plusSign}{currencyNarrowSymbol} {number}{compactSymbol}"`
    );
  });
});
