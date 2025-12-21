use crate::error::Location;
use std::collections::HashMap;

/// Element type enum
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Type {
    /// Raw text
    Literal,
    /// Variable w/o any format, e.g `var` in `this is a {var}`
    Argument,
    /// Variable w/ number format
    Number,
    /// Variable w/ date format
    Date,
    /// Variable w/ time format
    Time,
    /// Variable w/ select format
    Select,
    /// Variable w/ plural format
    Plural,
    /// Only possible within plural argument.
    /// This is the `#` symbol that will be substituted with the count.
    Pound,
    /// XML-like tag
    Tag,
}

/// Skeleton type enum
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SkeletonType {
    Number,
    DateTime,
}

/// Valid plural rules
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
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
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PluralType {
    Cardinal,
    Ordinal,
}

/// Base element with type and value
#[derive(Debug, Clone, PartialEq)]
pub struct BaseElement {
    pub value: String,
    pub location: Option<Location>,
}

/// Literal element
#[derive(Debug, Clone, PartialEq)]
pub struct LiteralElement {
    pub value: String,
    pub location: Option<Location>,
}

/// Argument element
#[derive(Debug, Clone, PartialEq)]
pub struct ArgumentElement {
    pub value: String,
    pub location: Option<Location>,
}

/// Tag element with children
#[derive(Debug, Clone, PartialEq)]
pub struct TagElement {
    pub value: String,
    pub children: Vec<MessageFormatElement>,
    pub location: Option<Location>,
}

/// Simple format element with optional style
#[derive(Debug, Clone, PartialEq)]
pub struct SimpleFormatElement<S> {
    pub value: String,
    pub style: Option<S>,
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

/// Style can be either a string or a skeleton
#[derive(Debug, Clone, PartialEq)]
pub enum DateTimeSkeletonOrStyle {
    String(String),
    Skeleton(DateTimeSkeleton),
}

/// Plural or select option with message elements
#[derive(Debug, Clone, PartialEq)]
pub struct PluralOrSelectOption {
    pub value: Vec<MessageFormatElement>,
    pub location: Option<Location>,
}

/// Select element
#[derive(Debug, Clone, PartialEq)]
pub struct SelectElement {
    pub value: String,
    pub options: HashMap<String, PluralOrSelectOption>,
    pub location: Option<Location>,
}

/// Plural element
#[derive(Debug, Clone, PartialEq)]
pub struct PluralElement {
    pub value: String,
    pub options: HashMap<ValidPluralRule, PluralOrSelectOption>,
    pub offset: i32,
    pub plural_type: PluralType,
    pub location: Option<Location>,
}

/// Pound element (#)
#[derive(Debug, Clone, PartialEq)]
pub struct PoundElement {
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

/// Number skeleton with tokens and parsed options
#[derive(Debug, Clone, PartialEq)]
pub struct NumberSkeleton {
    pub tokens: Vec<NumberSkeletonToken>,
    pub location: Option<Location>,
    // Note: NumberFormatOptions would need to be defined separately
    // This is a placeholder for the parsed options
    pub parsed_options: NumberFormatOptions,
}

/// Placeholder for NumberFormatOptions
/// This would need to be expanded with actual Intl.NumberFormatOptions fields
#[derive(Debug, Clone, PartialEq)]
pub struct NumberFormatOptions {
    pub scale: Option<f64>,
    // Add other options as needed
}

/// Placeholder for NumberSkeletonToken
/// This should be imported from the icu-skeleton-parser crate
#[derive(Debug, Clone, PartialEq)]
pub struct NumberSkeletonToken {
    // This is a placeholder - actual implementation would come from
    // the icu-skeleton-parser package
    pub stem: String,
    pub options: Vec<String>,
}

/// Date/Time skeleton with pattern and parsed options
#[derive(Debug, Clone, PartialEq)]
pub struct DateTimeSkeleton {
    pub pattern: String,
    pub location: Option<Location>,
    // Note: DateTimeFormatOptions corresponds to Intl.DateTimeFormatOptions
    pub parsed_options: DateTimeFormatOptions,
}

/// Placeholder for DateTimeFormatOptions
/// This corresponds to Intl.DateTimeFormatOptions
#[derive(Debug, Clone, PartialEq, Default)]
pub struct DateTimeFormatOptions {
    pub hour: Option<String>,
    pub minute: Option<String>,
    pub second: Option<String>,
    pub year: Option<String>,
    pub month: Option<String>,
    pub day: Option<String>,
    pub weekday: Option<String>,
    pub era: Option<String>,
    pub time_zone_name: Option<String>,
    pub hour12: Option<bool>,
    // Add other options as needed
}

/// Skeleton union type
#[derive(Debug, Clone, PartialEq)]
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
