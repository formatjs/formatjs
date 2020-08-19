import {LocaleData} from './types';

type LanguageTag = string;
type RegionCode = string;
type ScriptCode = string;
type CurrencyCode = string;

export interface DisplayNamesData {
  /**
   * Note that for style fields, `short` and `narrow` might not exist.
   * At runtime, the fallback order will be narrow -> short -> long.
   */
  types: {
    /**
     * Maps language subtag like `zh-CN` to their display names.
     */
    language: {
      narrow: Record<LanguageTag, string>;
      short: Record<LanguageTag, string>;
      long: Record<LanguageTag, string>;
    };
    region: {
      narrow: Record<RegionCode, string>;
      short: Record<RegionCode, string>;
      long: Record<RegionCode, string>;
    };
    script: {
      narrow: Record<ScriptCode, string>;
      short: Record<ScriptCode, string>;
      long: Record<ScriptCode, string>;
    };
    currency: {
      narrow: Record<CurrencyCode, string>;
      short: Record<CurrencyCode, string>;
      long: Record<CurrencyCode, string>;
    };
  };
  /**
   * Not in spec, but we need this to display both language and region in display name.
   * e.g. zh-Hans-SG + "{0}（{1}）" -> 简体中文（新加坡）
   * Here {0} is replaced by language display name and {1} is replaced by region display name.
   */
  patterns: {
    locale: string;
  };
}

export type DisplayNamesLocaleData = LocaleData<DisplayNamesData>;
