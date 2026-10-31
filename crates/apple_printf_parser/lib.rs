//! Parses the documented Apple Foundation printf dialect without formatting values.
//!
//! ```
//! use formatjs_apple_printf_parser::{parse, Element};
//! let elements = parse("Hello %2$@, %1$ld %%").unwrap();
//! let indices: Vec<_> = elements.iter().filter_map(|element| match element {
//!     Element::Specifier(specifier) => specifier.argument.map(|argument| argument.index),
//!     Element::Literal(_) => None,
//! }).collect();
//! assert_eq!(indices, [2, 1]);
//! ```
//!
//! Uses Foundation's conversion meanings, not libc's platform-dependent aliases.
//! Rejects undefined mixed/gapped positional arguments, `%n`, `.stringsdict`
//! references and logging extensions. Spans index UTF-8 bytes. Runtime values,
//! platform ABI differences and translation compatibility remain caller concerns.

use std::{collections::BTreeSet, fmt};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Span {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArgumentReference {
    Implicit,
    Explicit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Argument {
    pub index: u32,
    pub reference: ArgumentReference,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Amount {
    Fixed(u32),
    Argument(Argument),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Length {
    None,
    Char,
    Short,
    Long,
    LongLong,
    IntMax,
    Size,
    PtrDiff,
    LongDouble,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Conversion {
    Object,
    SignedInteger,
    UnsignedInteger,
    Octal,
    Hexadecimal,
    FloatingPoint,
    Character,
    Utf16Character,
    String,
    Utf16String,
    Pointer,
    Percent,
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
    pub argument: Option<Argument>,
    pub flags: &'a str,
    pub width: Option<Amount>,
    pub precision: Option<Amount>,
    pub length: Length,
    pub conversion: Conversion,
    /// Original conversion character, preserving presentation choices.
    pub conversion_character: char,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Element<'a> {
    Literal(Literal<'a>),
    Specifier(Specifier<'a>),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[non_exhaustive]
pub enum ErrorKind {
    MissingConversion,
    UnknownConversion(char),
    InvalidNumber,
    InvalidLength,
    InvalidPercent,
    MixedIndexing,
    MissingArgument(u32),
    UnsupportedWriteCount,
    UnsupportedNamedReference,
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

/// Parses complete messages using documented Foundation conversions and POSIX indexing rules.
pub fn parse(input: &str) -> Result<Vec<Element<'_>>, ParseError> {
    let mut parser = Parser {
        input,
        position: 0,
        next_index: 0,
        indexing: None,
        indices: BTreeSet::new(),
    };
    let mut elements = Vec::new();
    while parser.position < input.len() {
        let start = parser.position;
        if input.as_bytes()[start] == b'%' {
            elements.push(Element::Specifier(parser.specifier()?));
        } else {
            let end = input[start..]
                .find('%')
                .map_or(input.len(), |offset| start + offset);
            elements.push(Element::Literal(Literal {
                value: &input[start..end],
                span: Span { start, end },
            }));
            parser.position = end;
        }
    }
    if parser.indexing == Some(ArgumentReference::Explicit) {
        for (offset, index) in parser.indices.iter().enumerate() {
            let expected = offset as u32 + 1;
            if *index != expected {
                return Err(ParseError {
                    kind: ErrorKind::MissingArgument(expected),
                    span: Span {
                        start: 0,
                        end: input.len(),
                    },
                });
            }
        }
    }
    Ok(elements)
}

struct Parser<'a> {
    input: &'a str,
    position: usize,
    next_index: u32,
    indexing: Option<ArgumentReference>,
    indices: BTreeSet<u32>,
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
    fn byte(&self) -> Option<u8> {
        self.input.as_bytes().get(self.position).copied()
    }
    fn digits(&mut self) -> &'a str {
        let start = self.position;
        while self.byte().is_some_and(|byte| byte.is_ascii_digit()) {
            self.position += 1;
        }
        &self.input[start..self.position]
    }
    fn number(&self, start: usize, digits: &str) -> Result<u32, ParseError> {
        digits
            .parse::<u32>()
            .ok()
            .filter(|value| *value <= i32::MAX as u32)
            .ok_or_else(|| self.error(start, ErrorKind::InvalidNumber))
    }
    fn explicit_index(&mut self, start: usize) -> Result<Option<u32>, ParseError> {
        let saved = self.position;
        let digits = self.digits();
        if self.byte() != Some(b'$') {
            self.position = saved;
            return Ok(None);
        }
        self.position += 1;
        let index = self.number(start, digits)?;
        if index == 0 || index > 127 || digits.starts_with('0') {
            return Err(self.error(start, ErrorKind::InvalidNumber));
        }
        Ok(Some(index))
    }
    fn argument(&mut self, start: usize, index: Option<u32>) -> Result<Argument, ParseError> {
        let reference = if index.is_some() {
            ArgumentReference::Explicit
        } else {
            ArgumentReference::Implicit
        };
        if self.indexing.is_some_and(|previous| previous != reference) {
            return Err(self.error(start, ErrorKind::MixedIndexing));
        }
        self.indexing = Some(reference);
        let index = match index {
            Some(index) => index,
            None => {
                self.next_index = self
                    .next_index
                    .checked_add(1)
                    .ok_or_else(|| self.error(start, ErrorKind::InvalidNumber))?;
                self.next_index
            }
        };
        self.indices.insert(index);
        Ok(Argument { index, reference })
    }
    fn amount(&mut self, start: usize, precision: bool) -> Result<Option<Amount>, ParseError> {
        if self.byte() == Some(b'*') {
            self.position += 1;
            let index = self.explicit_index(start)?;
            return Ok(Some(Amount::Argument(self.argument(start, index)?)));
        }
        let digits = self.digits();
        if digits.is_empty() {
            Ok(precision.then_some(Amount::Fixed(0)))
        } else {
            Ok(Some(Amount::Fixed(self.number(start, digits)?)))
        }
    }
    fn specifier(&mut self) -> Result<Specifier<'a>, ParseError> {
        let start = self.position;
        self.position += 1;
        let index = self.explicit_index(start)?;
        let flags_start = self.position;
        while self.byte().is_some_and(|byte| b"-+ #0".contains(&byte)) {
            self.position += 1;
        }
        let flags = &self.input[flags_start..self.position];
        let width = self.amount(start, false)?;
        let precision = if self.byte() == Some(b'.') {
            self.position += 1;
            self.amount(start, true)?
        } else {
            None
        };
        let length = match self.byte() {
            Some(b'h') => {
                self.position += 1;
                if self.byte() == Some(b'h') {
                    self.position += 1;
                    Length::Char
                } else {
                    Length::Short
                }
            }
            Some(b'l') => {
                self.position += 1;
                if self.byte() == Some(b'l') {
                    self.position += 1;
                    Length::LongLong
                } else {
                    Length::Long
                }
            }
            Some(b'q') => {
                self.position += 1;
                Length::LongLong
            }
            Some(b'j') => {
                self.position += 1;
                Length::IntMax
            }
            Some(b'z') => {
                self.position += 1;
                Length::Size
            }
            Some(b't') => {
                self.position += 1;
                Length::PtrDiff
            }
            Some(b'L') => {
                self.position += 1;
                Length::LongDouble
            }
            _ => Length::None,
        };
        let character = self.input[self.position..]
            .chars()
            .next()
            .ok_or_else(|| self.error(start, ErrorKind::MissingConversion))?;
        self.position += character.len_utf8();
        let conversion = match character {
            '@' if flags.contains('#') => {
                return Err(self.error(start, ErrorKind::UnsupportedNamedReference));
            }
            '@' => Conversion::Object,
            'd' | 'i' | 'D' => Conversion::SignedInteger,
            'u' | 'U' => Conversion::UnsignedInteger,
            'o' | 'O' => Conversion::Octal,
            'x' | 'X' => Conversion::Hexadecimal,
            'a' | 'A' | 'e' | 'E' | 'f' | 'F' | 'g' | 'G' => Conversion::FloatingPoint,
            'c' => Conversion::Character,
            'C' => Conversion::Utf16Character,
            's' => Conversion::String,
            'S' => Conversion::Utf16String,
            'p' => Conversion::Pointer,
            '%' => Conversion::Percent,
            'n' => return Err(self.error(start, ErrorKind::UnsupportedWriteCount)),
            other => return Err(self.error(start, ErrorKind::UnknownConversion(other))),
        };
        let valid_length = match conversion {
            Conversion::SignedInteger
            | Conversion::UnsignedInteger
            | Conversion::Octal
            | Conversion::Hexadecimal => {
                length != Length::LongDouble
                    && (!matches!(character, 'D' | 'U' | 'O') || length == Length::None)
            }
            Conversion::FloatingPoint => {
                matches!(length, Length::None | Length::Long | Length::LongDouble)
            }
            _ => length == Length::None,
        };
        if !valid_length {
            return Err(self.error(start, ErrorKind::InvalidLength));
        }
        let argument = if conversion == Conversion::Percent {
            if self.position - start != 2 {
                return Err(self.error(start, ErrorKind::InvalidPercent));
            }
            None
        } else {
            Some(self.argument(start, index)?)
        };
        Ok(Specifier {
            raw: &self.input[start..self.position],
            span: Span {
                start,
                end: self.position,
            },
            argument,
            flags,
            width,
            precision,
            length,
            conversion,
            conversion_character: character,
        })
    }
}
