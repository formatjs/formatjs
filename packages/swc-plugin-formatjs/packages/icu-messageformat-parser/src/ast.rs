use serde::ser::{SerializeMap, SerializeStruct};
use serde::{Serialize, Serializer};
use serde_repr::Serialize_repr;
use std::fmt;
#[cfg(feature = "utf16")]
use widestring::Utf16Str;

use crate::intl::date_time_format_options::JsIntlDateTimeFormatOptions;
use crate::intl::number_format_options::JsIntlNumberFormatOptions;

/// The type of an error that occurred while building an AST.
#[derive(Clone, Debug, Eq, PartialEq, Serialize_repr)]
#[repr(u8)]
pub enum ErrorKind {
    /// Argument is unclosed (e.g. `{0`)
    ExpectArgumentClosingBrace = 1,
    /// Argument is empty (e.g. `{}`).
    EmptyArgument = 2,
    /// Argument is malformed (e.g. `{foo!}``)
    MalformedArgument = 3,
    /// Expect an argument type (e.g. `{foo,}`)
    ExpectArgumentType = 4,
    /// Unsupported argument type (e.g. `{foo,foo}`)
    InvalidArgumentType = 5,
    /// Expect an argument style (e.g. `{foo, number, }`)
    ExpectArgumentStyle = 6,
    /// The number skeleton is invalid.
    InvalidNumberSkeleton = 7,
    /// The date time skeleton is invalid.
    InvalidDateTimeSkeleton = 8,
    /// Exepct a number skeleton following the `::` (e.g. `{foo, number, ::}`)
    ExpectNumberSkeleton = 9,
    /// Exepct a date time skeleton following the `::` (e.g. `{foo, date, ::}`)
    ExpectDateTimeSkeleton = 10,
    /// Unmatched apostrophes in the argument style (e.g. `{foo, number, 'test`)
    UnclosedQuoteInArgumentStyle = 11,
    /// Missing select argument options (e.g. `{foo, select}`)
    ExpectSelectArgumentOptions = 12,

    /// Expecting an offset value in `plural` or `selectordinal` argument (e.g `{foo, plural, offset}`)
    ExpectPluralArgumentOffsetValue = 13,
    /// Offset value in `plural` or `selectordinal` is invalid (e.g. `{foo, plural, offset: x}`)
    InvalidPluralArgumentOffsetValue = 14,

    /// Expecting a selector in `select` argument (e.g `{foo, select}`)
    ExpectSelectArgumentSelector = 15,
    /// Expecting a selector in `plural` or `selectordinal` argument (e.g `{foo, plural}`)
    ExpectPluralArgumentSelector = 16,

    /// Expecting a message fragment after the `select` selector (e.g. `{foo, select, apple}`)
    ExpectSelectArgumentSelectorFragment = 17,
    /// Expecting a message fragment after the `plural` or `selectordinal` selector
    /// (e.g. `{foo, plural, one}`)
    ExpectPluralArgumentSelectorFragment = 18,

    /// Selector in `plural` or `selectordinal` is malformed (e.g. `{foo, plural, =x {#}}`)
    InvalidPluralArgumentSelector = 19,

    /// Duplicate selectors in `plural` or `selectordinal` argument.
    /// (e.g. {foo, plural, one {#} one {#}})
    DuplicatePluralArgumentSelector = 20,
    /// Duplicate selectors in `select` argument.
    /// (e.g. {foo, select, apple {apple} apple {apple}})
    DuplicateSelectArgumentSelector = 21,

    /// Plural or select argument option must have `other` clause.
    MissingOtherClause = 22,

    /// The tag is malformed. (e.g. `<bold!>foo</bold!>)
    InvalidTag = 23,
    /// The tag name is invalid. (e.g. `<123>foo</123>`)
    InvalidTagName = 25,
    /// The closing tag does not match the opening tag. (e.g. `<bold>foo</italic>`)
    UnmatchedClosingTag = 26,
    /// The opening tag has unmatched closing tag. (e.g. `<bold>foo`)
    UnclosedTag = 27,
}

impl fmt::Display for ErrorKind {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ErrorKind::ExpectArgumentClosingBrace => write!(f, "EXPECT_ARGUMENT_CLOSING_BRACE"),
            ErrorKind::EmptyArgument => write!(f, "EMPTY_ARGUMENT"),
            ErrorKind::MalformedArgument => write!(f, "MALFORMED_ARGUMENT"),
            ErrorKind::ExpectArgumentType => write!(f, "EXPECT_ARGUMENT_TYPE"),
            ErrorKind::InvalidArgumentType => write!(f, "INVALID_ARGUMENT_TYPE"),
            ErrorKind::ExpectArgumentStyle => write!(f, "EXPECT_ARGUMENT_STYLE"),
            ErrorKind::InvalidNumberSkeleton => write!(f, "INVALID_NUMBER_SKELETON"),
            ErrorKind::InvalidDateTimeSkeleton => write!(f, "INVALID_DATE_TIME_SKELETON"),
            ErrorKind::ExpectNumberSkeleton => write!(f, "EXPECT_NUMBER_SKELETON"),
            ErrorKind::ExpectDateTimeSkeleton => write!(f, "EXPECT_DATE_TIME_SKELETON"),
            ErrorKind::UnclosedQuoteInArgumentStyle => {
                write!(f, "UNCLOSED_QUOTE_IN_ARGUMENT_STYLE")
            }
            ErrorKind::ExpectSelectArgumentOptions => write!(f, "EXPECT_SELECT_ARGUMENT_OPTIONS"),
            ErrorKind::ExpectPluralArgumentOffsetValue => {
                write!(f, "EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE")
            }
            ErrorKind::InvalidPluralArgumentOffsetValue => {
                write!(f, "INVALID_PLURAL_ARGUMENT_OFFSET_VALUE")
            }
            ErrorKind::ExpectSelectArgumentSelector => write!(f, "EXPECT_SELECT_ARGUMENT_SELECTOR"),
            ErrorKind::ExpectPluralArgumentSelector => write!(f, "EXPECT_PLURAL_ARGUMENT_SELECTOR"),
            ErrorKind::ExpectSelectArgumentSelectorFragment => {
                write!(f, "EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT")
            }
            ErrorKind::ExpectPluralArgumentSelectorFragment => {
                write!(f, "EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT")
            }
            ErrorKind::InvalidPluralArgumentSelector => {
                write!(f, "INVALID_PLURAL_ARGUMENT_SELECTOR")
            }
            ErrorKind::DuplicatePluralArgumentSelector => {
                write!(f, "DUPLICATE_PLURAL_ARGUMENT_SELECTOR")
            }
            ErrorKind::DuplicateSelectArgumentSelector => {
                write!(f, "DUPLICATE_SELECT_ARGUMENT_SELECTOR")
            }
            ErrorKind::MissingOtherClause => write!(f, "MISSING_OTHER_CLAUSE"),
            ErrorKind::InvalidTag => write!(f, "INVALID_TAG"),
            ErrorKind::InvalidTagName => write!(f, "INVALID_TAG_NAME"),
            ErrorKind::UnmatchedClosingTag => write!(f, "UNMATCHED_CLOSING_TAG"),
            ErrorKind::UnclosedTag => write!(f, "UNCLOSED_TAG"),
        }
    }
}

/// A single position in an ICU message.
///
/// A position encodes one half of a span, and include the code unit offset, line
/// number and column number.
#[derive(Clone, Copy, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Position {
    pub offset: usize,
    pub line: usize,
    pub column: usize,
}

impl Position {
    pub fn new(offset: usize, line: usize, column: usize) -> Position {
        Position {
            offset,
            line,
            column,
        }
    }
}

impl fmt::Debug for Position {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "Position::new({:?}, {:?}, {:?})",
            self.offset, self.line, self.column
        )
    }
}

/// Span represents the position information of a single AST item.
///
/// All span positions are absolute byte offsets that can be used on the
/// original regular expression that was parsed.
#[derive(Clone, Copy, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Span {
    /// The start byte offset.
    pub start: Position,
    /// The end byte offset.
    pub end: Position,
}

impl fmt::Debug for Span {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Span::new({:?}, {:?})", self.start, self.end)
    }
}

impl Span {
    /// Create a new span with the given positions.
    pub fn new(start: Position, end: Position) -> Span {
        Span { start, end }
    }
}

/// An error that occurred while parsing an ICU message into an abstract
/// syntax tree.
#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct Error {
    /// The kind of error.
    pub kind: ErrorKind,
    /// The original message that the parser generated the error from. Every
    /// span in an error is a valid range into this string.
    pub message: String,
    /// The span of this error.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Span>,
}

/// An abstract syntax tree for a ICU message. Adapted from:
/// https://github.com/formatjs/formatjs/blob/c03d4989323a33765798acdd74fb4f5b01f0bdcd/packages/intl-messageformat-parser/src/types.ts
pub type Ast<'s> = Vec<AstElement<'s>>;

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum PluralType {
    Cardinal,
    Ordinal,
}

#[derive(Clone, Debug, PartialEq)]
pub enum AstElement<'s> {
    /// Raw text
    Literal {
        value: String,
        span: Option<Span>,
    },
    /// Variable w/o any format, e.g `var` in `this is a {var}`
    Argument { value: String, span: Option<Span> },
    /// Variable w/ number format
    Number {
        value: String,
        span: Option<Span>,
        style: Option<NumberArgStyle<'s>>,
    },
    /// Variable w/ date format
    Date {
        value: String,
        span: Option<Span>,
        style: Option<DateTimeArgStyle<'s>>,
    },
    /// Variable w/ time format
    Time {
        value: String,
        span: Option<Span>,
        style: Option<DateTimeArgStyle<'s>>,
    },
    /// Variable w/ select format
    Select {
        value: String,
        span: Option<Span>,
        options: PluralOrSelectOptions<'s>,
    },
    /// Variable w/ plural format
    Plural {
        value: String,
        plural_type: PluralType,
        span: Option<Span>,
        // TODO: want to use double here but it does not implement Eq trait.
        offset: i64,
        options: PluralOrSelectOptions<'s>,
    },
    /// Only possible within plural argument.
    /// This is the `#` symbol that will be substituted with the count.
    Pound(Span),
    /// XML-like tag
    Tag {
        value: &'s str,
        span: Option<Span>,
        children: Box<Ast<'s>>,
    },
}

// Until this is resolved, we have to roll our own serialization: https://github.com/serde-rs/serde/issues/745
impl<'s> Serialize for AstElement<'s> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            AstElement::Literal {
                ref value,
                ref span,
            } => {
                let mut state = serializer.serialize_struct("Literal", 3)?;
                state.serialize_field("type", &0)?;
                state.serialize_field("value", value)?;
                if span.is_some() {
                    state.serialize_field("location", span)?;
                }
                state.end()
            }
            AstElement::Argument {
                ref value,
                ref span,
            } => {
                let mut state = serializer.serialize_struct("Argument", 3)?;
                state.serialize_field("type", &1)?;
                state.serialize_field("value", value)?;
                if span.is_some() {
                    state.serialize_field("location", span)?;
                }
                state.end()
            }
            AstElement::Number {
                ref value,
                ref span,
                ref style,
            } => {
                let mut state = serializer.serialize_struct("Number", 4)?;
                state.serialize_field("type", &2)?;
                state.serialize_field("value", value)?;
                if span.is_some() {
                    state.serialize_field("location", span)?;
                }
                if style.is_some() {
                    state.serialize_field("style", style)?;
                }
                state.end()
            }
            AstElement::Date {
                ref value,
                ref span,
                ref style,
            } => {
                let mut state = serializer.serialize_struct("Date", 4)?;
                state.serialize_field("type", &3)?;
                state.serialize_field("value", value)?;
                if span.is_some() {
                    state.serialize_field("location", span)?;
                }
                if style.is_some() {
                    state.serialize_field("style", style)?;
                }
                state.end()
            }
            AstElement::Time {
                ref value,
                ref span,
                ref style,
            } => {
                let mut state = serializer.serialize_struct("Time", 4)?;
                state.serialize_field("type", &4)?;
                state.serialize_field("value", value)?;
                if span.is_some() {
                    state.serialize_field("location", span)?;
                }
                if style.is_some() {
                    state.serialize_field("style", style)?;
                }
                state.end()
            }
            AstElement::Select {
                ref value,
                ref span,
                ref options,
            } => {
                let mut state = serializer.serialize_struct("Select", 4)?;
                state.serialize_field("type", &5)?;
                state.serialize_field("value", value)?;
                state.serialize_field("options", options)?;
                if span.is_some() {
                    state.serialize_field("location", span)?;
                }
                state.end()
            }
            AstElement::Plural {
                ref value,
                ref span,
                ref plural_type,
                ref offset,
                ref options,
            } => {
                let mut state = serializer.serialize_struct("Plural", 6)?;
                state.serialize_field("type", &6)?;
                state.serialize_field("value", value)?;
                state.serialize_field("options", options)?;
                state.serialize_field("offset", offset)?;
                state.serialize_field("pluralType", plural_type)?;
                if span.is_some() {
                    state.serialize_field("location", span)?;
                }
                state.end()
            }
            AstElement::Pound(ref span) => {
                let mut state = serializer.serialize_struct("Pound", 2)?;
                state.serialize_field("type", &7)?;
                state.serialize_field("location", span)?;
                state.end()
            }
            AstElement::Tag {
                ref value,
                ref span,
                ref children,
            } => {
                let mut state = serializer.serialize_struct("Pound", 2)?;
                state.serialize_field("type", &8)?;
                state.serialize_field("value", value)?;
                state.serialize_field("children", children)?;
                if span.is_some() {
                    state.serialize_field("location", span)?;
                }
                state.end()
            }
        }
    }
}

#[cfg(feature = "utf16")]
#[derive(Clone, Debug, PartialEq)]
pub struct PluralOrSelectOptions<'s>(pub Vec<(&'s Utf16Str, PluralOrSelectOption<'s>)>);

/// Workaround of Rust's orphan impl rule
#[cfg(not(feature = "utf16"))]
#[derive(Clone, Debug, PartialEq)]
pub struct PluralOrSelectOptions<'s>(pub Vec<(&'s str, PluralOrSelectOption<'s>)>);

impl<'s> Serialize for PluralOrSelectOptions<'s> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let options = &self.0;
        let mut state = serializer.serialize_map(Some(options.len()))?;
        for (selector, fragment) in options {
            #[cfg(feature = "utf16")]
            let s = selector.to_string();
            #[cfg(feature = "utf16")]
            let s = s.as_str();
            #[cfg(not(feature = "utf16"))]
            let s = selector;
            state.serialize_entry(s, fragment)?;
        }
        state.end()
    }
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(untagged)]
pub enum NumberArgStyle<'s> {
    Style(&'s str),
    Skeleton(NumberSkeleton<'s>),
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NumberSkeleton<'s> {
    #[serde(rename = "type")]
    pub skeleton_type: SkeletonType,
    pub tokens: Vec<NumberSkeletonToken<'s>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Span>,
    pub parsed_options: JsIntlNumberFormatOptions,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NumberSkeletonToken<'s> {
    pub stem: &'s str,
    pub options: Vec<&'s str>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(untagged)]
pub enum DateTimeArgStyle<'s> {
    Style(&'s str),
    Skeleton(DateTimeSkeleton),
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize_repr)]
#[repr(u8)]
pub enum SkeletonType {
    Number,
    DateTime,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DateTimeSkeleton {
    #[serde(rename = "type")]
    pub skeleton_type: SkeletonType,
    pub pattern: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Span>,
    pub parsed_options: JsIntlDateTimeFormatOptions,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluralOrSelectOption<'s> {
    pub value: Ast<'s>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<Span>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::intl::number_format_options::JsIntlNumberFormatOptions;
    use serde_json::json;

    #[test]
    fn serialize_number_arg_style_with_skeleton() {
        similar_asserts::assert_eq!(
            serde_json::to_value(NumberArgStyle::Skeleton(NumberSkeleton {
                skeleton_type: SkeletonType::Number,
                tokens: vec![NumberSkeletonToken {
                    stem: "foo",
                    options: vec!["bar", "baz"]
                }],
                location: Some(Span::new(Position::new(0, 1, 1), Position::new(11, 1, 12))),
                parsed_options: JsIntlNumberFormatOptions::default(),
            }))
            .unwrap(),
            json!({
                "tokens": [{
                    "stem": "foo",
                    "options": [
                        "bar",
                        "baz"
                    ]
                }],
                "location": {
                    "start": {
                        "offset": 0,
                        "line": 1,
                        "column": 1,
                    },
                    "end": {
                        "offset": 11,
                        "line": 1,
                        "column": 12,
                    }
                },
                "type": 0,
                "parsedOptions": {},
            })
        );
    }

    #[test]
    fn serialize_number_arg_style_string() {
        similar_asserts::assert_eq!(
            serde_json::to_value(NumberArgStyle::Style("percent")).unwrap(),
            json!("percent")
        )
    }

    #[test]
    fn serialize_plural_type() {
        similar_asserts::assert_eq!(
            serde_json::to_value(PluralType::Cardinal).unwrap(),
            json!("cardinal")
        )
    }
}
