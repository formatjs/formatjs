/* eslint-disable @typescript-eslint/no-var-requires */
import '@formatjs/intl-getcanonicallocales/polyfill';
import '../src/polyfill';
import '../dist/locale-data/zh';
import '../dist/locale-data/en';
import type {DisplayNames} from '../src';
const PolyfilledDisplayNames = (Intl as any)
  .DisplayNames as typeof DisplayNames;
describe('.of()', () => {
  it('accepts case-insensitive language code with region subtag', () => {
    expect(
      new PolyfilledDisplayNames('zh', {type: 'language'}).of('zh-hANs-sG')
    ).toBe('简体中文（新加坡）');
  });

  it('accepts case-insensitive currency code', () => {
    expect(
      new PolyfilledDisplayNames('en-US', {type: 'currency', style: 'long'}).of(
        'cNy'
      )
    ).toBe('Chinese Yuan');
  });

  it('preserves unrecognized region subtag in language code when fallback option is code', () => {
    expect(
      new PolyfilledDisplayNames('zh', {fallback: 'code'}).of('zh-Hans-Xy')
    ).toBe('简体中文（XY）');
  });

  describe('with fallback set to "none"', () => {
    it('returns undefined when called with language code that has unrecognized region subtag', () => {
      expect(
        new PolyfilledDisplayNames('zh', {fallback: 'none'}).of('zh-Hans-XY')
      ).toBe(undefined);
    });

    it('returns undefined when called with language code that valid region subtag but invalid language subtag', () => {
      expect(
        new PolyfilledDisplayNames('zh', {fallback: 'none'}).of('xx-CN')
      ).toBe(undefined);
    });
  });
});

// TODO: add snapshot tests
