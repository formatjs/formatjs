use serde::Serialize;

use super::options::{Notation, LocaleMatcherFormatOptions, CompactDisplay, NumberFormatOptionsStyle, NumberFormatOptionsCurrencySign, NumberFormatOptionsTrailingZeroDisplay, NumberFormatOptionsRoundingPriority, UnitDisplay, NumberFormatOptionsSignDisplay, NumberFormatOptionsCurrencyDisplay};

/// Subset of options that will be parsed from the ICU message number skeleton.
#[derive(Default, Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JsIntlNumberFormatOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notation: Option<Notation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub compact_display: Option<CompactDisplay>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub locale_matcher: Option<LocaleMatcherFormatOptions>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<NumberFormatOptionsStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency_sign: Option<NumberFormatOptionsCurrencySign>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sign_display: Option<NumberFormatOptionsSignDisplay>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub numbering_system: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trailing_zero_display: Option<NumberFormatOptionsTrailingZeroDisplay>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rounding_priority: Option<NumberFormatOptionsRoundingPriority>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_grouping: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub minimum_integer_digits: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minimum_fraction_digits: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maximum_fraction_digits: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minimum_significant_digits: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maximum_significant_digits: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency_display: Option<NumberFormatOptionsCurrencyDisplay>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit_display: Option<UnitDisplay>,
}