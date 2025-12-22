use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NumberFormatNotation {
    Standard,
    Scientific,
    Engineering,
    Compact,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RoundingPriorityType {
    Auto,
    MorePrecision,
    LessPrecision,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RoundingModeType {
    Ceil,
    Floor,
    Expand,
    Trunc,
    HalfCeil,
    HalfFloor,
    HalfExpand,
    HalfTrunc,
    HalfEven,
}

/// String values for UseGroupingType
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UseGroupingString {
    Min2,
    Auto,
    Always,
}

/// UseGroupingType can be either a boolean or a string value.
/// - `Bool(bool)`: Accepts JSON boolean values: `true` or `false`
/// - `String(UseGroupingString)`: Accepts JSON string values: `"min2"`, `"auto"`, `"always"`
///
/// The `#[serde(untagged)]` attribute allows Serde to deserialize both types:
/// - JSON `true`/`false` (boolean) → `UseGroupingType::Bool(bool)`
/// - JSON `"min2"`/`"auto"`/`"always"` (string) → `UseGroupingType::String(UseGroupingString)`
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum UseGroupingType {
    String(UseGroupingString),
    Bool(bool),
}

impl From<bool> for UseGroupingType {
    fn from(value: bool) -> Self {
        UseGroupingType::Bool(value)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NumberFormatOptionsStyle {
    Decimal,
    Percent,
    Currency,
    Unit,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NumberFormatOptionsCompactDisplay {
    Short,
    Long,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum NumberFormatOptionsCurrencyDisplay {
    Symbol,
    Code,
    Name,
    NarrowSymbol,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NumberFormatOptionsCurrencySign {
    Standard,
    Accounting,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum NumberFormatOptionsSignDisplay {
    Auto,
    Always,
    Never,
    ExceptZero,
    Negative,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NumberFormatOptionsUnitDisplay {
    Long,
    Short,
    Narrow,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TrailingZeroDisplay {
    Auto,
    StripIfInteger,
}

/// NumberFormatOptions matching the ECMA-402 NumberFormatOptions interface
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NumberFormatOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<NumberFormatOptionsStyle>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit_display: Option<NumberFormatOptionsUnitDisplay>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_grouping: Option<UseGroupingType>,

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

    // ES2020 NumberFormat
    #[serde(skip_serializing_if = "Option::is_none")]
    pub compact_display: Option<NumberFormatOptionsCompactDisplay>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency_display: Option<NumberFormatOptionsCurrencyDisplay>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency_sign: Option<NumberFormatOptionsCurrencySign>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub notation: Option<NumberFormatNotation>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub sign_display: Option<NumberFormatOptionsSignDisplay>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub numbering_system: Option<String>,

    // ES2023 NumberFormat
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trailing_zero_display: Option<TrailingZeroDisplay>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub rounding_priority: Option<RoundingPriorityType>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub rounding_increment: Option<u32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub rounding_mode: Option<RoundingModeType>,
}

/// ExtendedNumberFormatOptions extends NumberFormatOptions with the scale property
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ExtendedNumberFormatOptions {
    #[serde(flatten)]
    pub base: NumberFormatOptions,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
}

impl ExtendedNumberFormatOptions {
    /// Create a new ExtendedNumberFormatOptions with default values
    pub fn new() -> Self {
        Self::default()
    }

    // Getters
    pub fn scale(&self) -> Option<f64> {
        self.scale
    }

    pub fn style(&self) -> Option<&NumberFormatOptionsStyle> {
        self.base.style.as_ref()
    }

    pub fn currency(&self) -> Option<&str> {
        self.base.currency.as_deref()
    }

    pub fn unit(&self) -> Option<&str> {
        self.base.unit.as_deref()
    }

    pub fn unit_display(&self) -> Option<&NumberFormatOptionsUnitDisplay> {
        self.base.unit_display.as_ref()
    }

    pub fn use_grouping(&self) -> Option<&UseGroupingType> {
        self.base.use_grouping.as_ref()
    }

    pub fn minimum_integer_digits(&self) -> Option<u32> {
        self.base.minimum_integer_digits
    }

    pub fn minimum_fraction_digits(&self) -> Option<u32> {
        self.base.minimum_fraction_digits
    }

    pub fn maximum_fraction_digits(&self) -> Option<u32> {
        self.base.maximum_fraction_digits
    }

    pub fn minimum_significant_digits(&self) -> Option<u32> {
        self.base.minimum_significant_digits
    }

    pub fn maximum_significant_digits(&self) -> Option<u32> {
        self.base.maximum_significant_digits
    }

    pub fn compact_display(&self) -> Option<&NumberFormatOptionsCompactDisplay> {
        self.base.compact_display.as_ref()
    }

    pub fn currency_display(&self) -> Option<&NumberFormatOptionsCurrencyDisplay> {
        self.base.currency_display.as_ref()
    }

    pub fn currency_sign(&self) -> Option<&NumberFormatOptionsCurrencySign> {
        self.base.currency_sign.as_ref()
    }

    pub fn notation(&self) -> Option<&NumberFormatNotation> {
        self.base.notation.as_ref()
    }

    pub fn sign_display(&self) -> Option<&NumberFormatOptionsSignDisplay> {
        self.base.sign_display.as_ref()
    }

    pub fn numbering_system(&self) -> Option<&str> {
        self.base.numbering_system.as_deref()
    }

    pub fn trailing_zero_display(&self) -> Option<&TrailingZeroDisplay> {
        self.base.trailing_zero_display.as_ref()
    }

    pub fn rounding_priority(&self) -> Option<&RoundingPriorityType> {
        self.base.rounding_priority.as_ref()
    }

    pub fn rounding_increment(&self) -> Option<u32> {
        self.base.rounding_increment
    }

    pub fn rounding_mode(&self) -> Option<&RoundingModeType> {
        self.base.rounding_mode.as_ref()
    }

    // Setters (builder pattern)
    /// Set the scale property
    pub fn with_scale(mut self, scale: f64) -> Self {
        self.scale = Some(scale);
        self
    }

    /// Set the style property
    pub fn with_style(mut self, style: NumberFormatOptionsStyle) -> Self {
        self.base.style = Some(style);
        self
    }

    /// Set the currency property
    pub fn with_currency(mut self, currency: impl Into<String>) -> Self {
        self.base.currency = Some(currency.into());
        self
    }

    /// Set the notation property
    pub fn with_notation(mut self, notation: NumberFormatNotation) -> Self {
        self.base.notation = Some(notation);
        self
    }

    /// Set the compact_display property
    pub fn with_compact_display(mut self, compact_display: NumberFormatOptionsCompactDisplay) -> Self {
        self.base.compact_display = Some(compact_display);
        self
    }

    /// Set the use_grouping property
    pub fn with_use_grouping(mut self, use_grouping: impl Into<UseGroupingType>) -> Self {
        self.base.use_grouping = Some(use_grouping.into());
        self
    }

    /// Set the unit property
    pub fn with_unit(mut self, unit: impl Into<String>) -> Self {
        self.base.unit = Some(unit.into());
        self
    }

    /// Set the currency_display property
    pub fn with_currency_display(mut self, currency_display: NumberFormatOptionsCurrencyDisplay) -> Self {
        self.base.currency_display = Some(currency_display);
        self
    }

    /// Set the unit_display property
    pub fn with_unit_display(mut self, unit_display: NumberFormatOptionsUnitDisplay) -> Self {
        self.base.unit_display = Some(unit_display);
        self
    }

    /// Set the sign_display property
    pub fn with_sign_display(mut self, sign_display: NumberFormatOptionsSignDisplay) -> Self {
        self.base.sign_display = Some(sign_display);
        self
    }

    /// Set the currency_sign property
    pub fn with_currency_sign(mut self, currency_sign: NumberFormatOptionsCurrencySign) -> Self {
        self.base.currency_sign = Some(currency_sign);
        self
    }

    /// Set the minimum_integer_digits property
    pub fn with_minimum_integer_digits(mut self, digits: u32) -> Self {
        self.base.minimum_integer_digits = Some(digits);
        self
    }

    /// Set the minimum_fraction_digits property
    pub fn with_minimum_fraction_digits(mut self, digits: u32) -> Self {
        self.base.minimum_fraction_digits = Some(digits);
        self
    }

    /// Set the maximum_fraction_digits property
    pub fn with_maximum_fraction_digits(mut self, digits: u32) -> Self {
        self.base.maximum_fraction_digits = Some(digits);
        self
    }

    /// Set the minimum_significant_digits property
    pub fn with_minimum_significant_digits(mut self, digits: u32) -> Self {
        self.base.minimum_significant_digits = Some(digits);
        self
    }

    /// Set the maximum_significant_digits property
    pub fn with_maximum_significant_digits(mut self, digits: u32) -> Self {
        self.base.maximum_significant_digits = Some(digits);
        self
    }

    /// Set the rounding_mode property
    pub fn with_rounding_mode(mut self, rounding_mode: RoundingModeType) -> Self {
        self.base.rounding_mode = Some(rounding_mode);
        self
    }

    /// Set the rounding_priority property
    pub fn with_rounding_priority(mut self, rounding_priority: RoundingPriorityType) -> Self {
        self.base.rounding_priority = Some(rounding_priority);
        self
    }

    /// Set the trailing_zero_display property
    pub fn with_trailing_zero_display(mut self, trailing_zero_display: TrailingZeroDisplay) -> Self {
        self.base.trailing_zero_display = Some(trailing_zero_display);
        self
    }

    /// Set the numbering_system property
    pub fn with_numbering_system(mut self, numbering_system: impl Into<String>) -> Self {
        self.base.numbering_system = Some(numbering_system.into());
        self
    }

    /// Set the rounding_increment property
    pub fn with_rounding_increment(mut self, rounding_increment: u32) -> Self {
        self.base.rounding_increment = Some(rounding_increment);
        self
    }

    /// Merge another ExtendedNumberFormatOptions into this one
    ///
    /// Values from `other` take precedence over values in `self`.
    /// This is useful for combining options from multiple sources.
    ///
    /// # Arguments
    /// * `other` - The options to merge into this instance
    ///
    /// # Returns
    /// Self with the merged options
    pub fn merge(mut self, other: Self) -> Self {
        if let Some(v) = other.scale() {
            self = self.with_scale(v);
        }
        if let Some(v) = other.style() {
            self = self.with_style(v.clone());
        }
        if let Some(v) = other.currency() {
            self = self.with_currency(v);
        }
        if let Some(v) = other.unit() {
            self = self.with_unit(v);
        }
        if let Some(v) = other.unit_display() {
            self = self.with_unit_display(v.clone());
        }
        if let Some(v) = other.use_grouping() {
            self = self.with_use_grouping(v.clone());
        }
        if let Some(v) = other.minimum_integer_digits() {
            self = self.with_minimum_integer_digits(v);
        }
        if let Some(v) = other.minimum_fraction_digits() {
            self = self.with_minimum_fraction_digits(v);
        }
        if let Some(v) = other.maximum_fraction_digits() {
            self = self.with_maximum_fraction_digits(v);
        }
        if let Some(v) = other.minimum_significant_digits() {
            self = self.with_minimum_significant_digits(v);
        }
        if let Some(v) = other.maximum_significant_digits() {
            self = self.with_maximum_significant_digits(v);
        }
        if let Some(v) = other.compact_display() {
            self = self.with_compact_display(v.clone());
        }
        if let Some(v) = other.currency_display() {
            self = self.with_currency_display(v.clone());
        }
        if let Some(v) = other.currency_sign() {
            self = self.with_currency_sign(v.clone());
        }
        if let Some(v) = other.notation() {
            self = self.with_notation(v.clone());
        }
        if let Some(v) = other.sign_display() {
            self = self.with_sign_display(v.clone());
        }
        if let Some(v) = other.numbering_system() {
            self = self.with_numbering_system(v);
        }
        if let Some(v) = other.trailing_zero_display() {
            self = self.with_trailing_zero_display(v.clone());
        }
        if let Some(v) = other.rounding_priority() {
            self = self.with_rounding_priority(v.clone());
        }
        if let Some(v) = other.rounding_increment() {
            self = self.with_rounding_increment(v);
        }
        if let Some(v) = other.rounding_mode() {
            self = self.with_rounding_mode(v.clone());
        }
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extended_number_format_options_creation() {
        let options = ExtendedNumberFormatOptions::new()
            .with_scale(100.0)
            .with_style(NumberFormatOptionsStyle::Percent)
            .with_currency("USD");

        assert_eq!(options.scale(), Some(100.0));
        assert_eq!(options.style(), Some(&NumberFormatOptionsStyle::Percent));
        assert_eq!(options.currency(), Some("USD"));
    }

    #[test]
    fn test_serialization() {
        let options = ExtendedNumberFormatOptions::new()
            .with_scale(100.0)
            .with_style(NumberFormatOptionsStyle::Percent);

        let json = serde_json::to_string(&options).unwrap();
        assert!(json.contains("\"scale\":100"));
        assert!(json.contains("\"style\":\"percent\""));
    }

    #[test]
    fn test_deserialization() {
        let json = r#"{"scale":100.0,"style":"percent"}"#;
        let options: ExtendedNumberFormatOptions = serde_json::from_str(json).unwrap();

        assert_eq!(options.scale(), Some(100.0));
        assert_eq!(options.style(), Some(&NumberFormatOptionsStyle::Percent));
    }

    #[test]
    fn test_use_grouping_bool_conversion() {
        let options = ExtendedNumberFormatOptions::new()
            .with_use_grouping(true);

        assert_eq!(options.use_grouping(), Some(&UseGroupingType::Bool(true)));

        let json = serde_json::to_string(&options).unwrap();
        assert!(json.contains("\"useGrouping\":true"));
    }

    #[test]
    fn test_use_grouping_string_values() {
        // Test with string value
        let json = r#"{"useGrouping":"min2"}"#;
        let options: ExtendedNumberFormatOptions = serde_json::from_str(json).unwrap();
        assert_eq!(options.use_grouping(), Some(&UseGroupingType::String(UseGroupingString::Min2)));

        // Test with boolean value
        let json_bool = r#"{"useGrouping":false}"#;
        let options_bool: ExtendedNumberFormatOptions = serde_json::from_str(json_bool).unwrap();
        assert_eq!(options_bool.use_grouping(), Some(&UseGroupingType::Bool(false)));
    }

    #[test]
    fn test_all_enums() {
        let options = ExtendedNumberFormatOptions::new()
            .with_style(NumberFormatOptionsStyle::Currency)
            .with_notation(NumberFormatNotation::Compact)
            .with_compact_display(NumberFormatOptionsCompactDisplay::Long)
            .with_currency_display(NumberFormatOptionsCurrencyDisplay::NarrowSymbol)
            .with_currency_sign(NumberFormatOptionsCurrencySign::Accounting)
            .with_sign_display(NumberFormatOptionsSignDisplay::Always)
            .with_unit_display(NumberFormatOptionsUnitDisplay::Short)
            .with_rounding_mode(RoundingModeType::HalfEven)
            .with_rounding_priority(RoundingPriorityType::MorePrecision)
            .with_trailing_zero_display(TrailingZeroDisplay::StripIfInteger);

        assert_eq!(options.style(), Some(&NumberFormatOptionsStyle::Currency));
        assert_eq!(options.notation(), Some(&NumberFormatNotation::Compact));
        assert_eq!(options.compact_display(), Some(&NumberFormatOptionsCompactDisplay::Long));
        assert_eq!(options.currency_display(), Some(&NumberFormatOptionsCurrencyDisplay::NarrowSymbol));
        assert_eq!(options.currency_sign(), Some(&NumberFormatOptionsCurrencySign::Accounting));
        assert_eq!(options.sign_display(), Some(&NumberFormatOptionsSignDisplay::Always));
        assert_eq!(options.unit_display(), Some(&NumberFormatOptionsUnitDisplay::Short));
        assert_eq!(options.rounding_mode(), Some(&RoundingModeType::HalfEven));
        assert_eq!(options.rounding_priority(), Some(&RoundingPriorityType::MorePrecision));
        assert_eq!(options.trailing_zero_display(), Some(&TrailingZeroDisplay::StripIfInteger));
    }
}
