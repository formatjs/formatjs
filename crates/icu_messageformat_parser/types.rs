use crate::error::Location;
use indexmap::IndexMap;
use serde::Serialize;

// Re-export types from icu-skeleton-parser
pub use formatjs_icu_skeleton_parser::{
    DateTimeFormatOptions, ExtendedNumberFormatOptions as NumberFormatOptions, NumberSkeletonToken,
};

/// Element type enum
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Type {
    /// Raw text
    Literal = 0,
    /// Variable w/o any format, e.g `var` in `this is a {var}`
    Argument = 1,
    /// Variable w/ number format
    Number = 2,
    /// Variable w/ date format
    Date = 3,
    /// Variable w/ time format
    Time = 4,
    /// Variable w/ select format
    Select = 5,
    /// Variable w/ plural format
    Plural = 6,
    /// Only possible within plural argument.
    /// This is the `#` symbol that will be substituted with the count.
    Pound = 7,
    /// XML-like tag
    Tag = 8,
}

impl Serialize for Type {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_u8(*self as u8)
    }
}

/// Skeleton type enum
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum SkeletonType {
    Number = 0,
    DateTime = 1,
}

impl Serialize for SkeletonType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_u8(*self as u8)
    }
}

/// Valid plural rules
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize)]
pub enum ValidPluralRule {
    Zero,
    One,
    Two,
    Few,
    Many,
    Other,
    /// Exact value match (e.g., "=0", "=1")
    Exact(String),
}

impl ValidPluralRule {
    pub fn from_str(s: &str) -> Self {
        match s {
            "zero" => Self::Zero,
            "one" => Self::One,
            "two" => Self::Two,
            "few" => Self::Few,
            "many" => Self::Many,
            "other" => Self::Other,
            _ => Self::Exact(s.to_string()),
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            Self::Zero => "zero",
            Self::One => "one",
            Self::Two => "two",
            Self::Few => "few",
            Self::Many => "many",
            Self::Other => "other",
            Self::Exact(s) => s.as_str(),
        }
    }
}

/// Plural type corresponding to Intl.PluralRulesOptions['type']
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PluralType {
    Cardinal,
    Ordinal,
}

/// Base element with type and value
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct BaseElement {
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
}

/// Literal element
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct LiteralElement {
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
}

/// Argument element
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ArgumentElement {
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
}

/// Tag element with children
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct TagElement {
    pub value: String,
    pub children: Vec<MessageFormatElement>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
}

/// Simple format element with optional style
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SimpleFormatElement<S> {
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<S>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
}

/// Number element
pub type NumberElement = SimpleFormatElement<NumberSkeletonOrStyle>;

/// Date element
pub type DateElement = SimpleFormatElement<DateTimeSkeletonOrStyle>;

/// Time element
pub type TimeElement = SimpleFormatElement<DateTimeSkeletonOrStyle>;

/// Style can be either a string or a skeleton
#[derive(Debug, Clone, PartialEq)]
pub enum NumberSkeletonOrStyle {
    String(String),
    Skeleton(NumberSkeleton),
}

impl Serialize for NumberSkeletonOrStyle {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            Self::String(s) => s.serialize(serializer),
            Self::Skeleton(skeleton) => skeleton.serialize(serializer),
        }
    }
}

/// Style can be either a string or a skeleton
#[derive(Debug, Clone, PartialEq)]
pub enum DateTimeSkeletonOrStyle {
    String(String),
    Skeleton(DateTimeSkeleton),
}

impl Serialize for DateTimeSkeletonOrStyle {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            Self::String(s) => s.serialize(serializer),
            Self::Skeleton(skeleton) => skeleton.serialize(serializer),
        }
    }
}

/// Plural or select option with message elements
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct PluralOrSelectOption {
    pub value: Vec<MessageFormatElement>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
}

/// Select element
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct SelectElement {
    pub value: String,
    pub options: IndexMap<String, PluralOrSelectOption>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
}

/// Plural element
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct PluralElement {
    pub value: String,
    pub options: IndexMap<ValidPluralRule, PluralOrSelectOption>,
    pub offset: i32,
    pub plural_type: PluralType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
}

/// Pound element (#)
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct PoundElement {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Location>,
}

/// Message format element (enum of all possible elements)
#[derive(Debug, Clone, PartialEq)]
pub enum MessageFormatElement {
    Literal(LiteralElement),
    Argument(ArgumentElement),
    Number(NumberElement),
    Date(DateElement),
    Time(TimeElement),
    Select(SelectElement),
    Plural(PluralElement),
    Pound(PoundElement),
    Tag(TagElement),
}

impl MessageFormatElement {
    pub fn element_type(&self) -> Type {
        match self {
            Self::Literal(_) => Type::Literal,
            Self::Argument(_) => Type::Argument,
            Self::Number(_) => Type::Number,
            Self::Date(_) => Type::Date,
            Self::Time(_) => Type::Time,
            Self::Select(_) => Type::Select,
            Self::Plural(_) => Type::Plural,
            Self::Pound(_) => Type::Pound,
            Self::Tag(_) => Type::Tag,
        }
    }

    pub fn is_literal(&self) -> bool {
        matches!(self, Self::Literal(_))
    }

    pub fn is_argument(&self) -> bool {
        matches!(self, Self::Argument(_))
    }

    pub fn is_number(&self) -> bool {
        matches!(self, Self::Number(_))
    }

    pub fn is_date(&self) -> bool {
        matches!(self, Self::Date(_))
    }

    pub fn is_time(&self) -> bool {
        matches!(self, Self::Time(_))
    }

    pub fn is_select(&self) -> bool {
        matches!(self, Self::Select(_))
    }

    pub fn is_plural(&self) -> bool {
        matches!(self, Self::Plural(_))
    }

    pub fn is_pound(&self) -> bool {
        matches!(self, Self::Pound(_))
    }

    pub fn is_tag(&self) -> bool {
        matches!(self, Self::Tag(_))
    }
}

// Custom serialization for MessageFormatElement to match TypeScript format
impl Serialize for MessageFormatElement {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeMap;

        match self {
            Self::Literal(el) => {
                let field_count = 2 + if el.location.is_some() { 1 } else { 0 };
                let mut map = serializer.serialize_map(Some(field_count))?;
                map.serialize_entry("type", &Type::Literal)?;
                map.serialize_entry("value", &el.value)?;
                if el.location.is_some() {
                    map.serialize_entry("location", &el.location)?;
                }
                map.end()
            }
            Self::Argument(el) => {
                let field_count = 2 + if el.location.is_some() { 1 } else { 0 };
                let mut map = serializer.serialize_map(Some(field_count))?;
                map.serialize_entry("type", &Type::Argument)?;
                map.serialize_entry("value", &el.value)?;
                if el.location.is_some() {
                    map.serialize_entry("location", &el.location)?;
                }
                map.end()
            }
            Self::Number(el) => {
                let field_count = 3 + if el.location.is_some() { 1 } else { 0 };
                let mut map = serializer.serialize_map(Some(field_count))?;
                map.serialize_entry("type", &Type::Number)?;
                map.serialize_entry("value", &el.value)?;
                map.serialize_entry("style", &el.style)?;
                if el.location.is_some() {
                    map.serialize_entry("location", &el.location)?;
                }
                map.end()
            }
            Self::Date(el) => {
                let field_count = 3 + if el.location.is_some() { 1 } else { 0 };
                let mut map = serializer.serialize_map(Some(field_count))?;
                map.serialize_entry("type", &Type::Date)?;
                map.serialize_entry("value", &el.value)?;
                map.serialize_entry("style", &el.style)?;
                if el.location.is_some() {
                    map.serialize_entry("location", &el.location)?;
                }
                map.end()
            }
            Self::Time(el) => {
                let field_count = 3 + if el.location.is_some() { 1 } else { 0 };
                let mut map = serializer.serialize_map(Some(field_count))?;
                map.serialize_entry("type", &Type::Time)?;
                map.serialize_entry("value", &el.value)?;
                map.serialize_entry("style", &el.style)?;
                if el.location.is_some() {
                    map.serialize_entry("location", &el.location)?;
                }
                map.end()
            }
            Self::Select(el) => {
                let field_count = 3 + if el.location.is_some() { 1 } else { 0 };
                let mut map = serializer.serialize_map(Some(field_count))?;
                map.serialize_entry("type", &Type::Select)?;
                map.serialize_entry("value", &el.value)?;
                map.serialize_entry("options", &el.options)?;
                if el.location.is_some() {
                    map.serialize_entry("location", &el.location)?;
                }
                map.end()
            }
            Self::Plural(el) => {
                // Convert IndexMap<ValidPluralRule, ...> to IndexMap<String, ...> for JSON serialization
                // Preserving insertion order for LDML ordering (zero, one, two, few, many, other)
                let options_map: IndexMap<String, &PluralOrSelectOption> = el
                    .options
                    .iter()
                    .map(|(k, v)| (k.as_str().to_string(), v))
                    .collect();

                let field_count = 5 + if el.location.is_some() { 1 } else { 0 };
                let mut map = serializer.serialize_map(Some(field_count))?;
                map.serialize_entry("type", &Type::Plural)?;
                map.serialize_entry("value", &el.value)?;
                map.serialize_entry("options", &options_map)?;
                map.serialize_entry("offset", &el.offset)?;
                map.serialize_entry("pluralType", &el.plural_type)?;
                if el.location.is_some() {
                    map.serialize_entry("location", &el.location)?;
                }
                map.end()
            }
            Self::Pound(el) => {
                let field_count = 1 + if el.location.is_some() { 1 } else { 0 };
                let mut map = serializer.serialize_map(Some(field_count))?;
                map.serialize_entry("type", &Type::Pound)?;
                if el.location.is_some() {
                    map.serialize_entry("location", &el.location)?;
                }
                map.end()
            }
            Self::Tag(el) => {
                let field_count = 3 + if el.location.is_some() { 1 } else { 0 };
                let mut map = serializer.serialize_map(Some(field_count))?;
                map.serialize_entry("type", &Type::Tag)?;
                map.serialize_entry("value", &el.value)?;
                map.serialize_entry("children", &el.children)?;
                if el.location.is_some() {
                    map.serialize_entry("location", &el.location)?;
                }
                map.end()
            }
        }
    }
}

/// Number skeleton with tokens and parsed options
#[derive(Debug, Clone, PartialEq)]
pub struct NumberSkeleton {
    pub tokens: Vec<NumberSkeletonToken>,
    pub location: Option<Location>,
    // Note: NumberFormatOptions would need to be defined separately
    // This is a placeholder for the parsed options
    pub parsed_options: NumberFormatOptions,
}

impl Serialize for NumberSkeleton {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeMap;
        let field_count = 3 + if self.location.is_some() { 1 } else { 0 };
        let mut map = serializer.serialize_map(Some(field_count))?;
        map.serialize_entry("type", &SkeletonType::Number)?;
        map.serialize_entry("tokens", &self.tokens)?;
        if self.location.is_some() {
            map.serialize_entry("location", &self.location)?;
        }
        map.serialize_entry("parsedOptions", &self.parsed_options)?;
        map.end()
    }
}

// NumberFormatOptions and NumberSkeletonToken are now imported from icu-skeleton-parser above

/// Date/Time skeleton with pattern and parsed options
#[derive(Debug, Clone, PartialEq)]
pub struct DateTimeSkeleton {
    pub pattern: String,
    pub location: Option<Location>,
    // Note: DateTimeFormatOptions corresponds to Intl.DateTimeFormatOptions
    pub parsed_options: DateTimeFormatOptions,
}

impl Serialize for DateTimeSkeleton {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeMap;
        let field_count = 3 + if self.location.is_some() { 1 } else { 0 };
        let mut map = serializer.serialize_map(Some(field_count))?;
        map.serialize_entry("type", &SkeletonType::DateTime)?;
        map.serialize_entry("pattern", &self.pattern)?;
        if self.location.is_some() {
            map.serialize_entry("location", &self.location)?;
        }
        map.serialize_entry("parsedOptions", &self.parsed_options)?;
        map.end()
    }
}

/// Placeholder for DateTimeFormatOptions
/// This corresponds to Intl.DateTimeFormatOptions
// DateTimeFormatOptions is now imported from icu-skeleton-parser above

/// Skeleton union type
#[derive(Debug, Clone, PartialEq, Serialize)]
pub enum Skeleton {
    Number(NumberSkeleton),
    DateTime(DateTimeSkeleton),
}

impl Skeleton {
    pub fn skeleton_type(&self) -> SkeletonType {
        match self {
            Self::Number(_) => SkeletonType::Number,
            Self::DateTime(_) => SkeletonType::DateTime,
        }
    }

    pub fn is_number_skeleton(&self) -> bool {
        matches!(self, Self::Number(_))
    }

    pub fn is_date_time_skeleton(&self) -> bool {
        matches!(self, Self::DateTime(_))
    }
}

// Helper constructors
impl LiteralElement {
    pub fn new(value: String) -> Self {
        Self {
            value,
            location: None,
        }
    }

    pub fn with_location(value: String, location: Location) -> Self {
        Self {
            value,
            location: Some(location),
        }
    }
}

impl ArgumentElement {
    pub fn new(value: String) -> Self {
        Self {
            value,
            location: None,
        }
    }

    pub fn with_location(value: String, location: Location) -> Self {
        Self {
            value,
            location: Some(location),
        }
    }
}

impl MessageFormatElement {
    pub fn literal(value: String) -> Self {
        Self::Literal(LiteralElement::new(value))
    }

    pub fn argument(value: String) -> Self {
        Self::Argument(ArgumentElement::new(value))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_type_enum() {
        assert_eq!(Type::Literal, Type::Literal);
        assert_ne!(Type::Literal, Type::Argument);
    }

    #[test]
    fn test_valid_plural_rule() {
        assert_eq!(ValidPluralRule::from_str("one"), ValidPluralRule::One);
        assert_eq!(ValidPluralRule::from_str("other"), ValidPluralRule::Other);
        assert_eq!(
            ValidPluralRule::from_str("=5"),
            ValidPluralRule::Exact("=5".to_string())
        );
        assert_eq!(ValidPluralRule::One.as_str(), "one");
    }

    #[test]
    fn test_literal_element() {
        let elem = LiteralElement::new("hello".to_string());
        assert_eq!(elem.value, "hello");
        assert!(elem.location.is_none());
    }

    #[test]
    fn test_message_format_element_type_guards() {
        let literal = MessageFormatElement::literal("test".to_string());
        assert!(literal.is_literal());
        assert!(!literal.is_argument());
        assert_eq!(literal.element_type(), Type::Literal);

        let arg = MessageFormatElement::argument("x".to_string());
        assert!(arg.is_argument());
        assert!(!arg.is_literal());
        assert_eq!(arg.element_type(), Type::Argument);
    }

    #[test]
    fn test_skeleton_type() {
        let dt_skeleton = Skeleton::DateTime(DateTimeSkeleton {
            pattern: "yyyy-MM-dd".to_string(),
            location: None,
            parsed_options: DateTimeFormatOptions::default(),
        });
        assert!(dt_skeleton.is_date_time_skeleton());
        assert!(!dt_skeleton.is_number_skeleton());
        assert_eq!(dt_skeleton.skeleton_type(), SkeletonType::DateTime);
    }
}
