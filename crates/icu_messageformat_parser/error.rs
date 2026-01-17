use serde::Serialize;

/// Location details for error reporting
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct LocationDetails {
    pub offset: usize,
    pub line: usize,
    pub column: usize,
}

/// Location range in the source string
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct Location {
    pub start: LocationDetails,
    pub end: LocationDetails,
}

/// Parser error with location information
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ParserError {
    pub kind: ErrorKind,
    pub message: String,
    pub location: Location,
}

impl ParserError {
    /// Create a new parser error
    pub fn new(kind: ErrorKind, message: String, location: Location) -> Self {
        Self {
            kind,
            message,
            location,
        }
    }
}

impl std::fmt::Display for ParserError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{} at line {}, column {}: {}",
            self.kind, self.location.start.line, self.location.start.column, self.message
        )
    }
}

impl std::error::Error for ParserError {}

/// Error kinds that can occur during parsing
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum ErrorKind {
    /// Argument is unclosed (e.g. `{0`)
    ExpectArgumentClosingBrace = 1,
    /// Argument is empty (e.g. `{}`).
    EmptyArgument = 2,
    /// Argument is malformed (e.g. `{foo!}`)
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
    /// Expect a number skeleton following the `::` (e.g. `{foo, number, ::}`)
    ExpectNumberSkeleton = 9,
    /// Expect a date time skeleton following the `::` (e.g. `{foo, date, ::}`)
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
    /// The tag is malformed. (e.g. `<bold!>foo</bold!>`)
    InvalidTag = 23,
    /// The tag name is invalid. (e.g. `<123>foo</123>`)
    InvalidTagName = 25,
    /// The closing tag does not match the opening tag. (e.g. `<bold>foo</italic>`)
    UnmatchedClosingTag = 26,
    /// The opening tag has unmatched closing tag. (e.g. `<bold>foo`)
    UnclosedTag = 27,
}

impl std::fmt::Display for ErrorKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
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

impl Serialize for ErrorKind {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_u8(*self as u8)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_kind_discriminants() {
        // Verify that error kinds have the correct numeric values
        assert_eq!(ErrorKind::ExpectArgumentClosingBrace as u8, 1);
        assert_eq!(ErrorKind::EmptyArgument as u8, 2);
        assert_eq!(ErrorKind::MalformedArgument as u8, 3);
        assert_eq!(ErrorKind::InvalidTagName as u8, 25);
        assert_eq!(ErrorKind::UnmatchedClosingTag as u8, 26);
        assert_eq!(ErrorKind::UnclosedTag as u8, 27);
    }

    #[test]
    fn test_parser_error_display() {
        let location = Location {
            start: LocationDetails {
                offset: 0,
                line: 1,
                column: 5,
            },
            end: LocationDetails {
                offset: 10,
                line: 1,
                column: 15,
            },
        };
        let error = ParserError::new(
            ErrorKind::EmptyArgument,
            "Argument is empty".to_string(),
            location,
        );
        let display = format!("{}", error);
        assert!(display.contains("EMPTY_ARGUMENT"));
        assert!(display.contains("line 1"));
        assert!(display.contains("column 5"));
        assert!(display.contains("Argument is empty"));
    }

    #[test]
    fn test_location_details() {
        let details = LocationDetails {
            offset: 10,
            line: 2,
            column: 5,
        };
        assert_eq!(details.offset, 10);
        assert_eq!(details.line, 2);
        assert_eq!(details.column, 5);
    }
}
