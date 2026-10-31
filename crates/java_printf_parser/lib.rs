//! Parses Java Formatter syntax without formatting values.
//!
//! ```
//! use formatjs_java_printf_parser::{parse, Element};
//!
//! let elements = parse("Hello %2$s, %s %<s %%").unwrap();
//! let indices: Vec<_> = elements.iter().filter_map(|element| match element {
//!     Element::Specifier(specifier) => specifier.argument.map(|argument| argument.index),
//!     Element::Literal(_) => None,
//! }).collect();
//! assert_eq!(indices, [2, 1, 1]);
//! ```
//!
//! Follows Java SE 17 `java.util.Formatter`. Validation excludes runtime argument
//! types, values, and translation compatibility. In particular, `#` on `%s` and
//! signed flags on octal/hexadecimal conversions depend on the Java argument type.

use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Span {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArgumentReference {
    Implicit,
    Explicit,
    Previous,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Argument {
    /// One-based index, resolved independently of other indexing styles.
    pub index: u32,
    pub reference: ArgumentReference,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Conversion {
    Boolean,
    HashCode,
    String,
    Character,
    Decimal,
    Octal,
    Hexadecimal,
    Scientific,
    GeneralFloat,
    DecimalFloat,
    HexFloat,
    DateTime(char),
    Percent,
    LineSeparator,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Literal<'a> {
    pub value: &'a str,
    pub span: Span,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Specifier<'a> {
    pub raw: &'a str,
    pub span: Span,
    /// Explicit index as written, including on non-consuming conversions.
    pub argument_index: Option<u32>,
    /// None for `%%` and `%n`, regardless of an explicit index.
    pub argument: Option<Argument>,
    /// Original flag order, including `<` for relative indexing.
    pub flags: &'a str,
    pub width: Option<u32>,
    pub precision: Option<u32>,
    pub conversion: Conversion,
    /// For date/time conversions, reflects the `T` prefix, not the suffix.
    pub uppercase: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Element<'a> {
    Literal(Literal<'a>),
    Specifier(Specifier<'a>),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NumberKind {
    ArgumentIndex,
    Width,
    Precision,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[non_exhaustive]
pub enum ErrorKind {
    MissingConversion,
    UnknownConversion(char),
    UnknownDateTimeSuffix(char),
    InvalidNumber(NumberKind),
    MissingPrecision,
    DuplicateFlag(char),
    UnsupportedFlag(char),
    ConflictingFlags(char, char),
    MissingWidth,
    UnsupportedWidth,
    UnsupportedPrecision,
    MissingPreviousArgument,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ParseError {
    pub kind: ErrorKind,
    pub span: Span,
}

impl fmt::Display for ParseError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "{:?} at bytes {}..{}",
            self.kind, self.span.start, self.span.end
        )
    }
}

impl std::error::Error for ParseError {}

/// Parses a complete string; every returned span indexes the original UTF-8 input.
pub fn parse(input: &str) -> Result<Vec<Element<'_>>, ParseError> {
    let mut parser = Parser {
        input,
        position: 0,
        implicit_index: 0,
        previous_index: None,
    };
    let mut elements = Vec::new();
    while parser.position < input.len() {
        let start = parser.position;
        if input.as_bytes()[start] != b'%' {
            let end = input[start..]
                .find('%')
                .map_or(input.len(), |offset| start + offset);
            elements.push(Element::Literal(Literal {
                value: &input[start..end],
                span: Span { start, end },
            }));
            parser.position = end;
        } else {
            elements.push(Element::Specifier(parser.specifier()?));
        }
    }
    Ok(elements)
}

struct Parser<'a> {
    input: &'a str,
    position: usize,
    implicit_index: u32,
    previous_index: Option<u32>,
}

impl<'a> Parser<'a> {
    fn error(&self, start: usize, kind: ErrorKind) -> ParseError {
        ParseError {
            kind,
            span: Span {
                start,
                end: self.position,
            },
        }
    }

    fn digits(&mut self) -> &'a str {
        let start = self.position;
        while self
            .input
            .as_bytes()
            .get(self.position)
            .is_some_and(u8::is_ascii_digit)
        {
            self.position += 1;
        }
        &self.input[start..self.position]
    }

    fn number(&self, start: usize, digits: &str, kind: NumberKind) -> Result<u32, ParseError> {
        digits
            .parse::<u32>()
            .ok()
            .filter(|value| {
                *value <= i32::MAX as u32 && (*value > 0 || kind == NumberKind::Precision)
            })
            .ok_or_else(|| self.error(start, ErrorKind::InvalidNumber(kind)))
    }

    fn character(&mut self, start: usize) -> Result<char, ParseError> {
        let character = self.input[self.position..]
            .chars()
            .next()
            .ok_or_else(|| self.error(start, ErrorKind::MissingConversion))?;
        self.position += character.len_utf8();
        Ok(character)
    }

    fn specifier(&mut self) -> Result<Specifier<'a>, ParseError> {
        let start = self.position;
        self.position += 1;
        let digits_start = self.position;
        let digits = self.digits();
        let argument_index = if self.input.as_bytes().get(self.position) == Some(&b'$') {
            self.position += 1;
            Some(self.number(start, digits, NumberKind::ArgumentIndex)?)
        } else {
            self.position = digits_start;
            None
        };
        let flags_start = self.position;
        while let Some(&flag) = self.input.as_bytes().get(self.position) {
            if !b"-#+ 0,(<".contains(&flag) {
                break;
            }
            self.position += 1;
            if self.input.as_bytes()[flags_start..self.position - 1].contains(&flag) {
                return Err(self.error(start, ErrorKind::DuplicateFlag(flag as char)));
            }
        }
        let flags = &self.input[flags_start..self.position];
        let width_digits = self.digits();
        let width = if width_digits.is_empty() {
            None
        } else {
            Some(self.number(start, width_digits, NumberKind::Width)?)
        };
        let precision = if self.input.as_bytes().get(self.position) == Some(&b'.') {
            self.position += 1;
            let digits = self.digits();
            if digits.is_empty() {
                return Err(self.error(start, ErrorKind::MissingPrecision));
            }
            Some(self.number(start, digits, NumberKind::Precision)?)
        } else {
            None
        };
        let character = self.character(start)?;
        let conversion = match character {
            'b' | 'B' => Conversion::Boolean,
            'h' | 'H' => Conversion::HashCode,
            's' | 'S' => Conversion::String,
            'c' | 'C' => Conversion::Character,
            'd' => Conversion::Decimal,
            'o' => Conversion::Octal,
            'x' | 'X' => Conversion::Hexadecimal,
            'e' | 'E' => Conversion::Scientific,
            'g' | 'G' => Conversion::GeneralFloat,
            'f' => Conversion::DecimalFloat,
            'a' | 'A' => Conversion::HexFloat,
            't' | 'T' => {
                let suffix = self.character(start)?;
                if !"HIklMSLNpzZsQBbhAaCYyjmdeRTrDFc".contains(suffix) {
                    return Err(self.error(start, ErrorKind::UnknownDateTimeSuffix(suffix)));
                }
                Conversion::DateTime(suffix)
            }
            '%' => Conversion::Percent,
            'n' => Conversion::LineSeparator,
            other => return Err(self.error(start, ErrorKind::UnknownConversion(other))),
        };
        let mut specifier = Specifier {
            raw: &self.input[start..self.position],
            span: Span {
                start,
                end: self.position,
            },
            argument_index,
            argument: None,
            flags,
            width,
            precision,
            conversion,
            uppercase: character.is_ascii_uppercase(),
        };
        self.validate(&specifier)?;
        if !matches!(conversion, Conversion::Percent | Conversion::LineSeparator) {
            let argument = if flags.contains('<') {
                Argument {
                    index: self
                        .previous_index
                        .ok_or_else(|| self.error(start, ErrorKind::MissingPreviousArgument))?,
                    reference: ArgumentReference::Previous,
                }
            } else if let Some(index) = argument_index {
                Argument {
                    index,
                    reference: ArgumentReference::Explicit,
                }
            } else {
                self.implicit_index = self
                    .implicit_index
                    .checked_add(1)
                    .filter(|index| *index <= i32::MAX as u32)
                    .ok_or_else(|| {
                        self.error(start, ErrorKind::InvalidNumber(NumberKind::ArgumentIndex))
                    })?;
                Argument {
                    index: self.implicit_index,
                    reference: ArgumentReference::Implicit,
                }
            };
            self.previous_index = Some(argument.index);
            specifier.argument = Some(argument);
        }
        Ok(specifier)
    }

    fn validate(&self, specifier: &Specifier<'_>) -> Result<(), ParseError> {
        use Conversion::*;
        let start = specifier.span.start;
        let allowed = match specifier.conversion {
            Boolean | HashCode | Character | DateTime(_) => "-<",
            String => "-#<",
            Decimal => "-+ 0,(<",
            Octal | Hexadecimal => "-#+ 0(<",
            Scientific => "-#+ 0(<",
            DecimalFloat => "-#+ 0,(<",
            GeneralFloat => "-+ 0,(<",
            HexFloat => "-#+ 0<",
            Percent => "-",
            LineSeparator => "",
        };
        for flag in specifier.flags.chars() {
            if !allowed.contains(flag) {
                return Err(self.error(start, ErrorKind::UnsupportedFlag(flag)));
            }
        }
        for (first, second) in [('+', ' '), ('-', '0')] {
            if specifier.flags.contains(first) && specifier.flags.contains(second) {
                return Err(self.error(start, ErrorKind::ConflictingFlags(first, second)));
            }
        }
        if specifier.width.is_none()
            && (specifier.flags.contains('-') || specifier.flags.contains('0'))
        {
            return Err(self.error(start, ErrorKind::MissingWidth));
        }
        if specifier.width.is_some() && matches!(specifier.conversion, LineSeparator) {
            return Err(self.error(start, ErrorKind::UnsupportedWidth));
        }
        if specifier.precision.is_some()
            && !matches!(
                specifier.conversion,
                Boolean | HashCode | String | Scientific | GeneralFloat | DecimalFloat | HexFloat
            )
        {
            return Err(self.error(start, ErrorKind::UnsupportedPrecision));
        }
        Ok(())
    }
}
