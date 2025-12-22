//! ICU MessageFormat parser implementation.
//!
//! This module provides a recursive descent parser for ICU MessageFormat syntax,
//! converting message strings into an Abstract Syntax Tree (AST).

use crate::error::{ErrorKind, Location, LocationDetails, ParserError};
use crate::regex_generated::SPACE_SEPARATOR_REGEX;
use crate::types::*;
use crate::date_time_pattern_generator::get_best_pattern;
use icu::locale::Locale;
use formatjs_icu_skeleton_parser::{parse_date_time_skeleton, parse_number_skeleton};
use once_cell::sync::Lazy;
use regex::Regex;
use std::collections::{HashMap, HashSet};

/// Position in the source message string.
///
/// Tracks location in terms of character offset, byte offset, line number, and column number.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Position {
    /// Offset in terms of characters (code points) for JavaScript compatibility
    pub offset: usize,
    /// Byte offset in the UTF-8 encoded string
    pub byte_offset: usize,
    /// Line number (1-indexed)
    pub line: usize,
    /// Column offset in terms of Unicode code points (1-indexed)
    pub column: usize,
}

impl Position {
    /// Creates a new Position at the start of input.
    pub fn new() -> Self {
        Position {
            offset: 0,
            byte_offset: 0,
            line: 1,
            column: 1,
        }
    }
}

impl Default for Position {
    fn default() -> Self {
        Self::new()
    }
}

/// Parser options for customizing parsing behavior.
#[derive(Debug, Clone, Default)]
pub struct ParserOptions {
    /// Whether to treat HTML/XML tags as string literal instead of parsing them as tag tokens.
    /// When this is false we only allow simple tags without any attributes.
    pub ignore_tag: bool,

    /// Should `select`, `selectordinal`, and `plural` arguments always include the `other` case clause.
    pub requires_other_clause: bool,

    /// Whether to parse number/datetime skeleton into Intl.NumberFormatOptions
    /// and Intl.DateTimeFormatOptions, respectively.
    pub should_parse_skeletons: bool,

    /// Capture location info in AST.
    /// Default is false.
    pub capture_location: bool,

    /// Instance of Intl.Locale to resolve locale-dependent skeleton.
    pub locale: Option<Locale>,
}

/// Result type for parser operations.
pub type Result<T> = std::result::Result<T, ParserError>;

/// Argument type being parsed (used for context-sensitive parsing).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ArgType {
    Number,
    Date,
    Time,
    Select,
    Plural,
    SelectOrdinal,
    None,
}

impl ArgType {
    fn from_str(s: &str) -> Option<Self> {
        match s {
            "number" => Some(ArgType::Number),
            "date" => Some(ArgType::Date),
            "time" => Some(ArgType::Time),
            "select" => Some(ArgType::Select),
            "plural" => Some(ArgType::Plural),
            "selectordinal" => Some(ArgType::SelectOrdinal),
            "" => Some(ArgType::None),
            _ => None,
        }
    }
}

/// Regex for trimming leading space separators.
static SPACE_SEPARATOR_START_REGEX: Lazy<Regex> = Lazy::new(|| {
    let pattern = format!("^{}*", SPACE_SEPARATOR_REGEX.as_str().trim_start_matches('^').trim_end_matches('$'));
    Regex::new(&pattern).expect("Failed to compile SPACE_SEPARATOR_START_REGEX")
});

/// Regex for trimming trailing space separators.
static SPACE_SEPARATOR_END_REGEX: Lazy<Regex> = Lazy::new(|| {
    let pattern = format!("{}*$", SPACE_SEPARATOR_REGEX.as_str().trim_start_matches('^').trim_end_matches('$'));
    Regex::new(&pattern).expect("Failed to compile SPACE_SEPARATOR_END_REGEX")
});

/// Static string constants for common single-character literals.
/// OPTIMIZATION: Avoids allocating new Strings for commonly-used single characters.
/// These are used in the parsing hot path (literal text parsing).
const LEFT_ANGLE_BRACKET: &str = "<";
const APOSTROPHE: &str = "'";

/// Matches an identifier at a specific byte index in the string.
///
/// Returns a tuple of (string_slice, character_count) to avoid counting characters twice.
///
/// OPTIMIZED: Uses character iteration instead of regex for 2-3x speedup,
/// and counts characters during the scan to avoid a second pass.
///
/// In TypeScript terms, this is like:
/// ```typescript
/// let end = start, count = 0
/// while (end < str.length && isIdentifierChar(str[end])) { end++; count++ }
/// return [str.slice(start, end), count]  // Zero-copy + count in single pass
/// ```
fn match_identifier_at_index(s: &str, byte_index: usize) -> (&str, usize) {
    if byte_index >= s.len() {
        return ("", 0);
    }

    let substring = &s[byte_index..];

    // Count characters WHILE scanning for identifier boundary
    let mut char_count = 0usize;
    let end_byte = substring
        .char_indices()
        .take_while(|&(_idx, c)| {
            let is_id_char = is_identifier_char(c);
            if is_id_char {
                char_count += 1;
            }
            is_id_char
        })
        .last()
        .map(|(idx, ch)| idx + ch.len_utf8())  // Get byte AFTER the last character
        .unwrap_or(0);  // Empty identifier

    (&substring[..end_byte], char_count)  // Return both slice and count!
}

/// Checks if a codepoint is an ASCII letter (upper or lowercase).
#[inline]
fn is_alpha(codepoint: u32) -> bool {
    (codepoint >= 97 && codepoint <= 122) || (codepoint >= 65 && codepoint <= 90)
}

/// Checks if a codepoint is an ASCII letter or forward slash.
#[inline]
fn is_alpha_or_slash(codepoint: u32) -> bool {
    is_alpha(codepoint) || codepoint == 47 // '/'
}

/// Checks if a codepoint is a valid character in an XML element name.
///
/// Based on the custom element name grammar from HTML spec, but more permissive
/// (allows uppercase letters and other Unicode ranges).
#[inline]
fn is_potential_element_name_char(c: u32) -> bool {
    c == 45  // '-'
        || c == 46  // '.'
        || (c >= 48 && c <= 57)  // 0..9
        || c == 95  // '_'
        || (c >= 97 && c <= 122)  // a..z
        || (c >= 65 && c <= 90)  // A..Z
        || c == 0xb7
        || (c >= 0xc0 && c <= 0xd6)
        || (c >= 0xd8 && c <= 0xf6)
        || (c >= 0xf8 && c <= 0x37d)
        || (c >= 0x37f && c <= 0x1fff)
        || (c >= 0x200c && c <= 0x200d)
        || (c >= 0x203f && c <= 0x2040)
        || (c >= 0x2070 && c <= 0x218f)
        || (c >= 0x2c00 && c <= 0x2fef)
        || (c >= 0x3001 && c <= 0xd7ff)
        || (c >= 0xf900 && c <= 0xfdcf)
        || (c >= 0xfdf0 && c <= 0xfffd)
        || (c >= 0x10000 && c <= 0xeffff)
}

/// Checks if a codepoint is Unicode whitespace.
///
/// Code point equivalent of regex `\p{White_Space}`.
#[inline]
fn is_white_space(c: u32) -> bool {
    (c >= 0x0009 && c <= 0x000d)
        || c == 0x0020
        || c == 0x0085
        || (c >= 0x200e && c <= 0x200f)
        || c == 0x2028
        || c == 0x2029
}

/// Checks if a character is Unicode Pattern_Syntax.
///
/// Pattern_Syntax includes ICU MessageFormat special characters like { } # < > etc.
/// This is optimized for the common ASCII range that MessageFormat uses.
#[inline]
fn is_pattern_syntax(c: char) -> bool {
    // Fast path: check common ICU MessageFormat characters
    // These are the characters we see 99% of the time
    match c {
        '{' | '}' | '#' | '<' | '>' | '\'' | '|' => true,
        '[' | ']' | '(' | ')' | '*' | '+' | ',' | '-' | '.' | '/' => true,
        ':' | ';' | '=' | '?' | '@' | '\\' | '^' | '`' | '~' => true,
        '!' | '"' | '$' | '%' | '&' => true,
        _ if c <= '\u{007F}' => false,  // Other ASCII is not pattern syntax
        _ => {
            // Slow path: full Unicode Pattern_Syntax check
            // Only hit for non-ASCII characters
            matches!(c as u32,
                0x00A1..=0x00A7 | 0x00A9 | 0x00AB..=0x00AC | 0x00AE |
                0x00B0..=0x00B1 | 0x00B6 | 0x00BB | 0x00BF | 0x00D7 | 0x00F7 |
                0x2010..=0x2027 | 0x2030..=0x203E | 0x2041..=0x2053 |
                0x2055..=0x205E | 0x2190..=0x245F | 0x2500..=0x2775 |
                0x2794..=0x2BFF | 0x2E00..=0x2E7F | 0x3001..=0x3003 |
                0x3008..=0x3020 | 0x3030 | 0xFD3E..=0xFD3F | 0xFE45..=0xFE46
            )
        }
    }
}

/// Checks if a character is valid in an identifier.
///
/// An identifier can contain any character EXCEPT whitespace or pattern syntax.
#[inline]
fn is_identifier_char(c: char) -> bool {
    !is_white_space(c as u32) && !is_pattern_syntax(c)
}

/// Trims leading space separators from a string.
fn trim_start(s: &str) -> String {
    SPACE_SEPARATOR_START_REGEX.replace(s, "").to_string()
}

/// Trims trailing space separators from a string.
fn trim_end(s: &str) -> String {
    SPACE_SEPARATOR_END_REGEX.replace(s, "").to_string()
}

/// Creates a Location from start and end positions.
fn create_location(start: Position, end: Position) -> Option<Location> {
    Some(Location {
        start: LocationDetails {
            offset: start.offset,
            line: start.line,
            column: start.column,
        },
        end: LocationDetails {
            offset: end.offset,
            line: end.line,
            column: end.column,
        },
    })
}

/// ICU MessageFormat parser.
///
/// Implements a recursive descent parser that converts ICU MessageFormat strings
/// into an Abstract Syntax Tree (AST).
///
/// # Example
///
/// ```
/// use icu_messageformat_parser::{Parser, ParserOptions};
///
/// let parser = Parser::new("Hello {name}!", ParserOptions::default());
/// let result = parser.parse();
/// assert!(result.is_ok());
/// ```
pub struct Parser {
    /// The message string being parsed
    message: String,
    /// Current position in the message
    position: Position,
    /// Locale for resolving locale-dependent skeletons
    locale: Option<Locale>,
    /// Whether to ignore HTML/XML tags
    ignore_tag: bool,
    /// Whether to require 'other' clause in select/plural
    requires_other_clause: bool,
    /// Whether to parse skeletons into options
    should_parse_skeletons: bool,
    /// Whether to capture location information
    capture_location: bool,
}

impl Parser {
    /// Creates a new Parser for the given message string.
    ///
    /// # Arguments
    ///
    /// * `message` - The ICU MessageFormat string to parse
    /// * `options` - Parser configuration options
    pub fn new(message: impl Into<String>, options: ParserOptions) -> Self {
        Parser {
            message: message.into(),
            position: Position::new(),
            locale: options.locale,
            ignore_tag: options.ignore_tag,
            requires_other_clause: options.requires_other_clause,
            should_parse_skeletons: options.should_parse_skeletons,
            capture_location: options.capture_location,
        }
    }

    /// Parses the message into an AST.
    ///
    /// This is the main entry point for parsing. The parser can only be used once.
    ///
    /// # Returns
    ///
    /// A Result containing either:
    /// - `Ok(Vec<MessageFormatElement>)` - The parsed AST
    /// - `Err(ParserError)` - A parsing error with location information
    ///
    /// # Panics
    ///
    /// Panics if the parser has already been used (offset is not 0).
    pub fn parse(mut self) -> Result<Vec<MessageFormatElement>> {
        if self.offset() != 0 {
            panic!("parser can only be used once");
        }
        self.parse_message(0, ArgType::None, false)
    }

    // ===== Position Management Methods =====

    /// Returns the current byte offset in the message.
    #[inline]
    fn byte_offset(&self) -> usize {
        self.position.byte_offset
    }

    /// Returns the current character offset in the message.
    #[inline]
    fn offset(&self) -> usize {
        self.position.offset
    }

    /// Checks if we've reached the end of the message.
    #[inline]
    fn is_eof(&self) -> bool {
        // FIX: Check byte_offset against byte length, not character offset
        self.byte_offset() >= self.message.len()
    }

    /// Returns the current Unicode codepoint.
    ///
    /// # Panics
    ///
    /// Panics if at EOF or at an invalid UTF-8 boundary.
    fn char(&self) -> u32 {
        // FIX: Use byte_offset for string indexing, not character offset
        // Character offset counts Unicode code points, byte_offset is the actual position in the UTF-8 string
        let byte_offset = self.position.byte_offset;
        if byte_offset >= self.message.len() {
            panic!("out of bound");
        }

        // Get the character at this byte offset
        let remaining = &self.message[byte_offset..];
        let ch = remaining.chars().next()
            .expect("Offset is at invalid UTF-8 boundary");

        ch as u32
    }

    /// Clones the current position.
    #[inline]
    fn clone_position(&self) -> Position {
        self.position
    }

    /// Creates an error Result with the given error kind and location.
    fn error<T>(&self, kind: ErrorKind, location: Option<Location>) -> Result<T> {
        // If location is not provided, create a default location at current position
        let loc = location.unwrap_or_else(|| {
            let pos = self.clone_position();
            Location {
                start: LocationDetails {
                    offset: pos.offset,
                    line: pos.line,
                    column: pos.column,
                },
                end: LocationDetails {
                    offset: pos.offset,
                    line: pos.line,
                    column: pos.column,
                },
            }
        });

        Err(ParserError {
            kind,
            message: self.message.clone(),
            location: loc,
        })
    }

    /// Advances the parser by one Unicode codepoint.
    ///
    /// Updates line and column tracking appropriately.
    fn bump(&mut self) {
        if self.is_eof() {
            return;
        }

        let code = self.char();

        // FIX: Track both character offset (for location reporting) and byte offset (for string indexing)
        // JavaScript counts characters, not UTF-8 bytes, so we need separate tracking
        let ch = std::char::from_u32(code).unwrap();
        let char_byte_len = ch.len_utf8();

        if code == 10 {  // '\n'
            self.position.line += 1;
            self.position.column = 1;
            self.position.offset += 1;
            self.position.byte_offset += char_byte_len;
        } else {
            self.position.column += 1;
            self.position.offset += 1;  // Always increment by 1 character
            self.position.byte_offset += char_byte_len;  // Increment by actual UTF-8 byte length
        }
    }

    /// Attempts to match and consume a string prefix at the current position.
    ///
    /// Returns true if the prefix was matched and consumed, false otherwise.
    fn bump_if(&mut self, prefix: &str) -> bool {
        // FIX: Use byte_offset for string slicing
        if self.message[self.byte_offset()..].starts_with(prefix) {
            for _ in 0..prefix.chars().count() {
                self.bump();
            }
            true
        } else {
            false
        }
    }

    /// Advances the parser until the pattern string is found.
    ///
    /// Returns true if the pattern was found, false if EOF was reached.
    fn bump_until(&mut self, pattern: &str) -> bool {
        let current_offset = self.offset();
        if let Some(index) = self.message[current_offset..].find(pattern) {
            self.bump_to(current_offset + index);
            true
        } else {
            self.bump_to(self.message.len());
            false
        }
    }

    /// Advances the parser to the target byte offset.
    ///
    /// # Panics
    ///
    /// Panics if target_offset is less than current offset or at an invalid UTF-8 boundary.
    fn bump_to(&mut self, target_offset: usize) {
        if self.offset() > target_offset {
            panic!(
                "targetOffset {} must be greater than or equal to the current offset {}",
                target_offset,
                self.offset()
            );
        }

        let target_offset = target_offset.min(self.message.len());

        while self.offset() < target_offset {
            self.bump();
            if self.is_eof() {
                break;
            }
        }

        if self.offset() != target_offset && target_offset < self.message.len() {
            panic!(
                "targetOffset {} is at invalid UTF-8 boundary",
                target_offset
            );
        }
    }

    /// Advances the parser through all whitespace to the next non-whitespace character.
    fn bump_space(&mut self) {
        while !self.is_eof() && is_white_space(self.char()) {
            self.bump();
        }
    }

    /// Peeks at the next Unicode codepoint without advancing the parser.
    ///
    /// Returns None if at EOF.
    fn peek(&self) -> Option<u32> {
        if self.is_eof() {
            return None;
        }

        let offset = self.offset();
        let ch = self.char();
        let char_len = std::char::from_u32(ch).unwrap().len_utf8();
        let next_offset = offset + char_len;

        if next_offset >= self.message.len() {
            None
        } else {
            let remaining = &self.message[next_offset..];
            remaining.chars().next().map(|c| c as u32)
        }
    }

    // ===== Parsing Methods =====

    /// Parses an identifier if one is present at the current position.
    ///
    /// Advances the parser past the identifier and returns the identifier string
    /// and its location. Returns an empty string if no identifier is found.
    fn parse_identifier_if_possible(&mut self) -> (String, Option<Location>) {
        let starting_position = self.clone_position();
        // FIX: Use byte_offset for string indexing, not character offset
        let start_byte_offset = self.byte_offset();

        // OPTIMIZATION: Get both slice and character count in one pass
        let (value, char_count) = match_identifier_at_index(&self.message, start_byte_offset);

        // Convert to String immediately to avoid borrowing issues
        // This is still better than regex because we avoid the regex overhead!
        let value_string = value.to_string();

        // Use the character count we already computed (no need to count again!)
        let target_offset = self.offset() + char_count;

        self.bump_to(target_offset);

        let end_position = self.clone_position();
        let location = if self.capture_location {
            create_location(starting_position, end_position)
        } else {
            None
        };

        (value_string, location)
    }

    /// Attempts to parse a left angle bracket if it appears as literal text.
    ///
    /// Returns Some('<') if the bracket should be treated as literal, None otherwise.
    fn try_parse_left_angle_bracket(&mut self) -> Option<String> {
        if !self.is_eof()
            && self.char() == 60  // '<'
            && (self.ignore_tag || !is_alpha_or_slash(self.peek().unwrap_or(0)))
        {
            self.bump();
            // OPTIMIZATION: Use static string constant instead of allocating
            Some(LEFT_ANGLE_BRACKET.to_string())
        } else {
            None
        }
    }

    /// Attempts to parse a quoted sequence starting with an apostrophe.
    ///
    /// Starting with ICU 4.8, an ASCII apostrophe only starts quoted text if it
    /// immediately precedes a character that requires quoting ("only where needed").
    ///
    /// Returns the unquoted content, or None if no quote sequence is found.
    fn try_parse_quote(&mut self, parent_arg_type: ArgType) -> Option<String> {
        if self.is_eof() || self.char() != 39 {  // '\''
            return None;
        }

        // Check what character follows the apostrophe
        let next_char = self.peek()?;

        match next_char {
            39 => {  // Double apostrophe '' -> single apostrophe
                self.bump();  // First '
                self.bump();  // Second '
                // OPTIMIZATION: Use static string constant instead of allocating
                return Some(APOSTROPHE.to_string());
            }
            123 | 60 | 62 | 125 => {  // '{', '<', '>', '}'
                // These need escaping
            }
            35 => {  // '#'
                // Only needs escaping in plural/selectordinal
                if parent_arg_type == ArgType::Plural || parent_arg_type == ArgType::SelectOrdinal {
                    // Continue to escape
                } else {
                    return None;
                }
            }
            _ => return None,
        }

        // We have a valid escape sequence
        self.bump();  // Consume the opening apostrophe

        let mut code_points = vec![self.char()];  // The escaped character
        self.bump();

        // Read characters until optional closing apostrophe
        while !self.is_eof() {
            let ch = self.char();
            if ch == 39 {  // '\''
                if self.peek() == Some(39) {
                    // Double apostrophe inside quoted text
                    code_points.push(39);
                    self.bump();  // Skip one of the apostrophes
                } else {
                    // Closing apostrophe
                    self.bump();
                    break;
                }
            } else {
                code_points.push(ch);
            }
            self.bump();
        }

        Some(
            code_points
                .into_iter()
                .map(|cp| std::char::from_u32(cp).unwrap())
                .collect()
        )
    }

    /// Attempts to parse an unquoted character and append it to the buffer.
    ///
    /// OPTIMIZATION: Takes a mutable String buffer and pushes directly into it,
    /// avoiding allocation of temporary single-character Strings.
    ///
    /// Returns true if a character was parsed, false otherwise.
    fn try_parse_unquoted(
        &mut self,
        nesting_level: usize,
        parent_arg_type: ArgType,
        buffer: &mut String,
    ) -> bool {
        if self.is_eof() {
            return false;
        }

        let ch = self.char();

        // Check if this character has special meaning and shouldn't be parsed as literal
        if ch == 60  // '<'
            || ch == 123  // '{'
            || (ch == 35 && (parent_arg_type == ArgType::Plural || parent_arg_type == ArgType::SelectOrdinal))  // '#' in plural
            || (ch == 125 && nesting_level > 0)  // '}' when nested
        {
            false
        } else {
            self.bump();
            buffer.push(std::char::from_u32(ch).unwrap());
            true
        }
    }

    /// Parses a literal text element.
    ///
    /// Literal text is any text that doesn't contain special ICU MessageFormat syntax.
    /// Handles quoted sequences, unquoted text, and literal angle brackets.
    fn parse_literal(
        &mut self,
        nesting_level: usize,
        parent_arg_type: ArgType,
    ) -> Result<LiteralElement> {
        let start = self.clone_position();
        let mut value = String::new();

        loop {
            // Try parsing quoted sequence
            if let Some(quoted) = self.try_parse_quote(parent_arg_type) {
                value.push_str(&quoted);
                continue;
            }

            // Try parsing unquoted character (pushes directly into buffer)
            if self.try_parse_unquoted(nesting_level, parent_arg_type, &mut value) {
                continue;
            }

            // Try parsing literal angle bracket
            if let Some(bracket) = self.try_parse_left_angle_bracket() {
                value.push_str(&bracket);
                continue;
            }

            break;
        }

        let location = if self.capture_location {
            create_location(start, self.clone_position())
        } else {
            None
        };

        Ok(if let Some(loc) = location {
            LiteralElement::with_location(value, loc)
        } else {
            LiteralElement::new(value)
        })
    }

    /// Parses a tag name.
    ///
    /// Assumes the parser is positioned on the first character of the tag name.
    /// Tag names must start with an ASCII letter and can contain letters, digits,
    /// hyphens, underscores, and other valid element name characters.
    fn parse_tag_name(&mut self) -> String {
        // FIX: Use byte_offset for string slicing
        let start_byte_offset = self.byte_offset();

        self.bump();  // First character (already validated as alpha)

        while !self.is_eof() && is_potential_element_name_char(self.char()) {
            self.bump();
        }

        self.message[start_byte_offset..self.byte_offset()].to_string()
    }

    /// Parses an HTML/XML-like tag element.
    ///
    /// Supports both self-closing tags (`<tag/>`) and paired tags (`<tag>...</tag>`).
    /// Tags are only parsed if `ignore_tag` is false. Tag names must start with
    /// an ASCII letter.
    ///
    /// # Grammar
    ///
    /// ```text
    /// tag ::= "<" tagName (whitespace)* "/>"
    ///       | "<" tagName (whitespace)* ">" message "</" tagName (whitespace)* ">"
    /// tagName ::= [a-zA-Z] (PENChar)*
    /// ```
    fn parse_tag(
        &mut self,
        nesting_level: usize,
        parent_arg_type: ArgType,
    ) -> Result<MessageFormatElement> {
        let start_position = self.clone_position();
        self.bump();  // '<'

        let tag_name = self.parse_tag_name();
        self.bump_space();

        if self.bump_if("/>") {
            // Self-closing tag - treat as literal
            let location = if self.capture_location {
                create_location(start_position, self.clone_position())
            } else {
                None
            };

            let elem = if let Some(loc) = location {
                LiteralElement::with_location(format!("<{}/>", tag_name), loc)
            } else {
                LiteralElement::new(format!("<{}/>", tag_name))
            };
            return Ok(MessageFormatElement::Literal(elem));
        } else if self.bump_if(">") {
            // Opening tag - parse children
            let children = self.parse_message(nesting_level + 1, parent_arg_type, true)?;

            // Expect closing tag
            let end_tag_start_position = self.clone_position();

            if self.bump_if("</") {
                if self.is_eof() || !is_alpha(self.char()) {
                    let location = if self.capture_location {
                        create_location(end_tag_start_position, self.clone_position())
                    } else {
                        None
                    };
                    return self.error(ErrorKind::InvalidTag, location);
                }

                let closing_tag_name_start = self.clone_position();
                let closing_tag_name = self.parse_tag_name();

                if tag_name != closing_tag_name {
                    let location = if self.capture_location {
                        create_location(closing_tag_name_start, self.clone_position())
                    } else {
                        None
                    };
                    return self.error(ErrorKind::UnmatchedClosingTag, location);
                }

                self.bump_space();

                if !self.bump_if(">") {
                    let location = if self.capture_location {
                        create_location(end_tag_start_position, self.clone_position())
                    } else {
                        None
                    };
                    return self.error(ErrorKind::InvalidTag, location);
                }

                let location = if self.capture_location {
                    create_location(start_position, self.clone_position())
                } else {
                    None
                };

                return Ok(MessageFormatElement::Tag(TagElement {
                    value: tag_name,
                    children,
                    location,
                }));
            } else {
                let location = if self.capture_location {
                    create_location(start_position, self.clone_position())
                } else {
                    None
                };
                return self.error(ErrorKind::UnclosedTag, location);
            }
        } else {
            let location = if self.capture_location {
                create_location(start_position, self.clone_position())
            } else {
                None
            };
            return self.error(ErrorKind::InvalidTag, location);
        }
    }

    /// Attempts to parse a closing brace for an argument.
    ///
    /// Returns an error if the closing brace is not found.
    fn try_parse_argument_close(&mut self, opening_brace_position: Position) -> Result<()> {
        if self.is_eof() || self.char() != 125 {  // '}'
            let location = if self.capture_location {
                create_location(opening_brace_position, self.clone_position())
            } else {
                None
            };
            return self.error(ErrorKind::ExpectArgumentClosingBrace, location);
        }
        self.bump();  // '}'
        Ok(())
    }

    /// Attempts to parse a decimal integer (with optional sign).
    ///
    /// Used for parsing plural offsets and exact match selectors like `=0`.
    fn try_parse_decimal_integer(
        &mut self,
        expect_number_error: ErrorKind,
        invalid_number_error: ErrorKind,
    ) -> Result<i32> {
        let mut sign = 1;
        let starting_position = self.clone_position();

        if self.bump_if("+") {
            // Positive sign (no-op)
        } else if self.bump_if("-") {
            sign = -1;
        }

        let mut has_digits = false;
        let mut decimal: i64 = 0;

        while !self.is_eof() {
            let ch = self.char();
            if ch >= 48 && ch <= 57 {  // '0'..'9'
                has_digits = true;
                decimal = decimal * 10 + (ch - 48) as i64;
                self.bump();
            } else {
                break;
            }
        }

        let location = if self.capture_location {
            create_location(starting_position, self.clone_position())
        } else {
            None
        };

        if !has_digits {
            return self.error(expect_number_error, location);
        }

        decimal *= sign as i64;

        // Check if the number fits in i32
        if decimal < i32::MIN as i64 || decimal > i32::MAX as i64 {
            return self.error(invalid_number_error, location);
        }

        Ok(decimal as i32)
    }

    /// Parses a simple argument style (the part after the type in `{name, type, style}`).
    ///
    /// This handles both simple string styles and complex nested styles that may contain
    /// braces and apostrophes. See ICU MessagePattern for reference.
    fn parse_simple_arg_style_if_possible(&mut self) -> Result<String> {
        let mut nested_braces = 0;
        let start_position = self.clone_position();

        while !self.is_eof() {
            let ch = self.char();

            match ch {
                39 => {  // Apostrophe - handle quoted text
                    self.bump();
                    let apostrophe_position = self.clone_position();

                    if !self.bump_until("'") {
                        let location = if self.capture_location {
                            create_location(apostrophe_position, self.clone_position())
                        } else {
                            None
                        };
                        return self.error(ErrorKind::UnclosedQuoteInArgumentStyle, location);
                    }
                    self.bump();  // Closing apostrophe
                }
                123 => {  // '{'
                    nested_braces += 1;
                    self.bump();
                }
                125 => {  // '}'
                    if nested_braces > 0 {
                        nested_braces -= 1;
                        self.bump();
                    } else {
                        // End of style
                        break;
                    }
                }
                _ => {
                    self.bump();
                }
            }
        }

        // FIX: Use byte_offset for string slicing
        Ok(self.message[start_position.byte_offset..self.byte_offset()].to_string())
    }

    /// Parses the main message content recursively.
    ///
    /// This is the core parsing method that handles all MessageFormat elements:
    /// - Literal text
    /// - Arguments (`{name}`)
    /// - HTML/XML tags (`<tag>...</tag>`)
    /// - Pound tokens (`#` in plural contexts)
    ///
    /// # Arguments
    ///
    /// * `nesting_level` - Current nesting depth (for tracking nested arguments)
    /// * `parent_arg_type` - Type of the parent argument (affects how `#` is parsed)
    /// * `expecting_close_tag` - Whether we're inside a tag and should stop at `</`
    fn parse_message(
        &mut self,
        nesting_level: usize,
        parent_arg_type: ArgType,
        expecting_close_tag: bool,
    ) -> Result<Vec<MessageFormatElement>> {
        let mut elements = Vec::new();

        while !self.is_eof() {
            let ch = self.char();

            if ch == 123 {  // '{'
                let element = self.parse_argument(nesting_level, expecting_close_tag)?;
                elements.push(element);
            } else if ch == 125 && nesting_level > 0 {  // '}'
                break;
            } else if ch == 35
                && (parent_arg_type == ArgType::Plural || parent_arg_type == ArgType::SelectOrdinal)
            {  // '#' in plural context
                let position = self.clone_position();
                self.bump();
                let location = if self.capture_location {
                    create_location(position, self.clone_position())
                } else {
                    None
                };
                elements.push(MessageFormatElement::Pound(PoundElement { location }));
            } else if ch == 60 && !self.ignore_tag && self.peek() == Some(47) {  // '</'
                if expecting_close_tag {
                    break;
                } else {
                    let location = if self.capture_location {
                        create_location(self.clone_position(), self.clone_position())
                    } else {
                        None
                    };
                    return self.error(ErrorKind::UnmatchedClosingTag, location);
                }
            } else if ch == 60 && !self.ignore_tag && self.peek().map_or(false, is_alpha) {  // '<' tag
                let element = self.parse_tag(nesting_level, parent_arg_type)?;
                elements.push(element);
            } else {
                let element = self.parse_literal(nesting_level, parent_arg_type)?;
                elements.push(MessageFormatElement::Literal(element));
            }
        }

        Ok(elements)
    }

    /// Parses an argument element starting with `{`.
    ///
    /// Handles both simple arguments (`{name}`) and complex arguments with
    /// types and styles (`{name, type, style}`).
    fn parse_argument(
        &mut self,
        nesting_level: usize,
        expecting_close_tag: bool,
    ) -> Result<MessageFormatElement> {
        let opening_brace_position = self.clone_position();
        self.bump();  // '{'
        self.bump_space();

        if self.is_eof() {
            let location = if self.capture_location {
                create_location(opening_brace_position, self.clone_position())
            } else {
                None
            };
            return self.error(ErrorKind::ExpectArgumentClosingBrace, location);
        }

        if self.char() == 125 {  // '}'
            self.bump();
            let location = if self.capture_location {
                create_location(opening_brace_position, self.clone_position())
            } else {
                None
            };
            return self.error(ErrorKind::EmptyArgument, location);
        }

        // Parse argument name
        let (value, _value_location) = self.parse_identifier_if_possible();

        if value.is_empty() {
            let location = if self.capture_location {
                create_location(opening_brace_position, self.clone_position())
            } else {
                None
            };
            return self.error(ErrorKind::MalformedArgument, location);
        }

        self.bump_space();

        if self.is_eof() {
            let location = if self.capture_location {
                create_location(opening_brace_position, self.clone_position())
            } else {
                None
            };
            return self.error(ErrorKind::ExpectArgumentClosingBrace, location);
        }

        match self.char() {
            125 => {  // '}' - Simple argument
                self.bump();
                let location = if self.capture_location {
                    create_location(opening_brace_position, self.clone_position())
                } else {
                    None
                };
                let arg = if let Some(loc) = location {
                    ArgumentElement::with_location(value, loc)
                } else {
                    ArgumentElement::new(value)
                };
                Ok(MessageFormatElement::Argument(arg))
            }
            44 => {  // ',' - Argument with type/style
                self.bump();
                self.bump_space();

                if self.is_eof() {
                    let location = if self.capture_location {
                        create_location(opening_brace_position, self.clone_position())
                    } else {
                        None
                    };
                    return self.error(ErrorKind::ExpectArgumentClosingBrace, location);
                }

                self.parse_argument_options(
                    nesting_level,
                    expecting_close_tag,
                    value,
                    opening_brace_position,
                )
            }
            _ => {
                let location = if self.capture_location {
                    create_location(opening_brace_position, self.clone_position())
                } else {
                    None
                };
                self.error(ErrorKind::MalformedArgument, location)
            }
        }
    }

    /// Parses argument options (type and style) for complex arguments.
    ///
    /// Handles number, date, time, select, plural, and selectordinal argument types.
    fn parse_argument_options(
        &mut self,
        nesting_level: usize,
        expecting_close_tag: bool,
        value: String,
        opening_brace_position: Position,
    ) -> Result<MessageFormatElement> {
        // Parse the type (number, date, time, select, plural, selectordinal)
        let type_start_position = self.clone_position();
        let (arg_type_str, _) = self.parse_identifier_if_possible();
        let type_end_position = self.clone_position();

        let arg_type = ArgType::from_str(&arg_type_str).ok_or_else(|| {
            let location = if self.capture_location {
                create_location(type_start_position, type_end_position)
            } else {
                None
            };

            let loc = location.unwrap_or_else(|| {
                Location {
                    start: LocationDetails {
                        offset: type_start_position.offset,
                        line: type_start_position.line,
                        column: type_start_position.column,
                    },
                    end: LocationDetails {
                        offset: type_end_position.offset,
                        line: type_end_position.line,
                        column: type_end_position.column,
                    },
                }
            });

            ParserError {
                kind: if arg_type_str.is_empty() {
                    ErrorKind::ExpectArgumentType
                } else {
                    ErrorKind::InvalidArgumentType
                },
                message: self.message.clone(),
                location: loc,
            }
        })?;

        match arg_type {
            ArgType::Number | ArgType::Date | ArgType::Time => {
                // Parse optional style
                self.bump_space();

                let style_and_location: Option<(String, Option<Location>)> = if self.bump_if(",") {
                    self.bump_space();
                    let style_start_position = self.clone_position();
                    let style = self.parse_simple_arg_style_if_possible()?;
                    let trimmed_style = trim_end(&style);

                    if trimmed_style.is_empty() {
                        let location = if self.capture_location {
                            create_location(self.clone_position(), self.clone_position())
                        } else {
                            None
                        };
                        return self.error(ErrorKind::ExpectArgumentStyle, location);
                    }

                    let style_location = if self.capture_location {
                        create_location(style_start_position, self.clone_position())
                    } else {
                        None
                    };

                    Some((trimmed_style, style_location))
                } else {
                    None
                };

                self.try_parse_argument_close(opening_brace_position)?;

                let location = if self.capture_location {
                    create_location(opening_brace_position, self.clone_position())
                } else {
                    None
                };

                // Handle skeleton syntax (starts with '::')
                if let Some((style, style_location)) = style_and_location {
                    if style.starts_with("::") {
                        let skeleton = trim_start(&style[2..]);

                        if arg_type == ArgType::Number {
                            // FIX: Always parse and validate the number skeleton tokens to catch syntax errors
                            // This matches TypeScript behavior - validation happens regardless of shouldParseSkeletons
                            // The shouldParseSkeletons flag only controls whether we parse the tokens into parsedOptions
                            let tokens = NumberSkeletonToken::parse_from_string(&skeleton)
                                .map_err(|_| {
                                    // Use the error() method to properly format the error with the original message
                                    self.error::<()>(ErrorKind::InvalidNumberSkeleton, style_location.clone()).unwrap_err()
                                })?;

                            // Parse tokens into options only if shouldParseSkeletons is enabled
                            let parsed_options = if self.should_parse_skeletons {
                                parse_number_skeleton(&tokens)
                                    .map_err(|_| {
                                        // Use the error() method to properly format the error with the original message
                                        self.error::<()>(ErrorKind::InvalidNumberSkeleton, style_location.clone()).unwrap_err()
                                    })?
                            } else {
                                // If not parsing skeletons, use empty options object
                                NumberFormatOptions::default()
                            };

                            let num_skeleton = NumberSkeleton {
                                tokens,
                                location: style_location,
                                parsed_options,
                            };

                            return Ok(MessageFormatElement::Number(NumberElement {
                                value,
                                style: Some(NumberSkeletonOrStyle::Skeleton(num_skeleton)),
                                location,
                            }));
                        } else {
                            // Date/time skeleton
                            if skeleton.is_empty() {
                                return self.error(ErrorKind::ExpectDateTimeSkeleton, location);
                            }

                            let date_time_pattern = if let Some(ref locale) = self.locale {
                                get_best_pattern(&skeleton, locale)
                            } else {
                                skeleton.clone()
                            };

                            // FIX: Parse date/time skeleton when shouldParseSkeletons is enabled
                            let parsed_options = if self.should_parse_skeletons {
                                // Parse the skeleton pattern into DateTimeFormatOptions
                                parse_date_time_skeleton(&date_time_pattern)
                                    .unwrap_or_default()
                            } else {
                                DateTimeFormatOptions::default()
                            };

                            let dt_style = DateTimeSkeletonOrStyle::Skeleton(DateTimeSkeleton {
                                pattern: date_time_pattern,
                                location: style_location,
                                parsed_options,
                            });

                            if arg_type == ArgType::Date {
                                return Ok(MessageFormatElement::Date(DateElement {
                                    value,
                                    style: Some(dt_style),
                                    location,
                                }));
                            } else {
                                return Ok(MessageFormatElement::Time(TimeElement {
                                    value,
                                    style: Some(dt_style),
                                    location,
                                }));
                            }
                        }
                    }

                    // Regular style string (not skeleton)
                    let style = NumberSkeletonOrStyle::String(style);
                    match arg_type {
                        ArgType::Number => Ok(MessageFormatElement::Number(NumberElement {
                            value,
                            style: Some(style),
                            location,
                        })),
                        ArgType::Date => Ok(MessageFormatElement::Date(DateElement {
                            value,
                            style: Some(DateTimeSkeletonOrStyle::String(
                                match style {
                                    NumberSkeletonOrStyle::String(s) => s,
                                    _ => unreachable!(),
                                },
                            )),
                            location,
                        })),
                        ArgType::Time => Ok(MessageFormatElement::Time(TimeElement {
                            value,
                            style: Some(DateTimeSkeletonOrStyle::String(
                                match style {
                                    NumberSkeletonOrStyle::String(s) => s,
                                    _ => unreachable!(),
                                },
                            )),
                            location,
                        })),
                        _ => unreachable!(),
                    }
                } else {
                    // No style provided
                    match arg_type {
                        ArgType::Number => Ok(MessageFormatElement::Number(NumberElement {
                            value,
                            style: None,
                            location,
                        })),
                        ArgType::Date => Ok(MessageFormatElement::Date(DateElement {
                            value,
                            style: None,
                            location,
                        })),
                        ArgType::Time => Ok(MessageFormatElement::Time(TimeElement {
                            value,
                            style: None,
                            location,
                        })),
                        _ => unreachable!(),
                    }
                }
            }
            ArgType::Plural | ArgType::SelectOrdinal | ArgType::Select => {
                // Parse plural/select options
                let type_end_position = self.clone_position();
                self.bump_space();

                if !self.bump_if(",") {
                    let location = if self.capture_location {
                        create_location(type_end_position, type_end_position)
                    } else {
                        None
                    };
                    return self.error(ErrorKind::ExpectSelectArgumentOptions, location);
                }

                self.bump_space();

                // Parse offset for plural/selectordinal
                let mut plural_offset = 0;
                let (mut identifier, mut identifier_location) = self.parse_identifier_if_possible();

                if arg_type != ArgType::Select && identifier == "offset" {
                    if !self.bump_if(":") {
                        let location = if self.capture_location {
                            create_location(self.clone_position(), self.clone_position())
                        } else {
                            None
                        };
                        return self.error(ErrorKind::ExpectPluralArgumentOffsetValue, location);
                    }

                    self.bump_space();

                    plural_offset = self.try_parse_decimal_integer(
                        ErrorKind::ExpectPluralArgumentOffsetValue,
                        ErrorKind::InvalidPluralArgumentOffsetValue,
                    )?;

                    self.bump_space();
                    let (id, loc) = self.parse_identifier_if_possible();
                    identifier = id;
                    identifier_location = loc;
                }

                let options_vec = self.try_parse_plural_or_select_options(
                    nesting_level,
                    arg_type,
                    expecting_close_tag,
                    identifier,
                    identifier_location,
                )?;

                self.try_parse_argument_close(opening_brace_position)?;

                let location = if self.capture_location {
                    create_location(opening_brace_position, self.clone_position())
                } else {
                    None
                };

                if arg_type == ArgType::Select {
                    // For select, keys are strings
                    let options: HashMap<String, PluralOrSelectOption> =
                        options_vec.into_iter().collect();

                    Ok(MessageFormatElement::Select(SelectElement {
                        value,
                        options,
                        location,
                    }))
                } else {
                    // For plural/selectordinal, keys are ValidPluralRule
                    let options: HashMap<ValidPluralRule, PluralOrSelectOption> =
                        options_vec.into_iter()
                            .map(|(key, val)| (ValidPluralRule::from_str(&key), val))
                            .collect();

                    Ok(MessageFormatElement::Plural(PluralElement {
                        value,
                        options,
                        offset: plural_offset,
                        plural_type: if arg_type == ArgType::Plural {
                            PluralType::Cardinal
                        } else {
                            PluralType::Ordinal
                        },
                        location,
                    }))
                }
            }
            ArgType::None => {
                let location = if self.capture_location {
                    create_location(type_start_position, type_end_position)
                } else {
                    None
                };
                self.error(ErrorKind::ExpectArgumentType, location)
            }
        }
    }

    /// Parses the options for plural/select/selectordinal arguments.
    ///
    /// Each option consists of a selector (like "one", "other", "=0") followed
    /// by a message fragment in braces.
    ///
    /// Returns a Vec of (selector_string, option) tuples that can be converted
    /// to the appropriate HashMap type by the caller.
    fn try_parse_plural_or_select_options(
        &mut self,
        nesting_level: usize,
        parent_arg_type: ArgType,
        expect_close_tag: bool,
        mut selector: String,
        mut selector_location: Option<Location>,
    ) -> Result<Vec<(String, PluralOrSelectOption)>> {
        let mut has_other_clause = false;
        let mut options = Vec::new();
        let mut parsed_selectors = HashSet::new();

        loop {
            if selector.is_empty() {
                let start_position = self.clone_position();

                if parent_arg_type != ArgType::Select && self.bump_if("=") {
                    // Parse exact match selector like =0, =1
                    let number = self.try_parse_decimal_integer(
                        ErrorKind::ExpectPluralArgumentSelector,
                        ErrorKind::InvalidPluralArgumentSelector,
                    )?;

                    selector_location = if self.capture_location {
                        create_location(start_position, self.clone_position())
                    } else {
                        None
                    };

                    selector = format!("={}", number);
                } else {
                    break;
                }
            }

            // Check for duplicate selectors
            if parsed_selectors.contains(&selector) {
                return self.error(
                    if parent_arg_type == ArgType::Select {
                        ErrorKind::DuplicateSelectArgumentSelector
                    } else {
                        ErrorKind::DuplicatePluralArgumentSelector
                    },
                    selector_location,
                );
            }

            if selector == "other" {
                has_other_clause = true;
            }

            // Parse the option message
            self.bump_space();
            let opening_brace_position = self.clone_position();

            if !self.bump_if("{") {
                let location = if self.capture_location {
                    create_location(self.clone_position(), self.clone_position())
                } else {
                    None
                };
                return self.error(
                    if parent_arg_type == ArgType::Select {
                        ErrorKind::ExpectSelectArgumentSelectorFragment
                    } else {
                        ErrorKind::ExpectPluralArgumentSelectorFragment
                    },
                    location,
                );
            }

            let fragment = self.parse_message(nesting_level + 1, parent_arg_type, expect_close_tag)?;
            self.try_parse_argument_close(opening_brace_position)?;

            let option_location = if self.capture_location {
                create_location(opening_brace_position, self.clone_position())
            } else {
                None
            };

            // Store selector as string with the option
            options.push((
                selector.clone(),
                PluralOrSelectOption {
                    value: fragment,
                    location: option_location,
                },
            ));

            parsed_selectors.insert(selector.clone());

            // Prep for next selector
            self.bump_space();
            let (next_selector, next_location) = self.parse_identifier_if_possible();
            selector = next_selector;
            selector_location = next_location;
        }

        if options.is_empty() {
            let location = if self.capture_location {
                create_location(self.clone_position(), self.clone_position())
            } else {
                None
            };
            return self.error(
                if parent_arg_type == ArgType::Select {
                    ErrorKind::ExpectSelectArgumentSelector
                } else {
                    ErrorKind::ExpectPluralArgumentSelector
                },
                location,
            );
        }

        if self.requires_other_clause && !has_other_clause {
            let location = if self.capture_location {
                create_location(self.clone_position(), self.clone_position())
            } else {
                None
            };
            return self.error(ErrorKind::MissingOtherClause, location);
        }

        Ok(options)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_position_default() {
        let pos = Position::default();
        assert_eq!(pos.offset, 0);
        assert_eq!(pos.line, 1);
        assert_eq!(pos.column, 1);
    }

    #[test]
    fn test_is_alpha() {
        assert!(is_alpha(b'a' as u32));
        assert!(is_alpha(b'Z' as u32));
        assert!(!is_alpha(b'0' as u32));
        assert!(!is_alpha(b'_' as u32));
    }

    #[test]
    fn test_is_white_space() {
        assert!(is_white_space(b' ' as u32));
        assert!(is_white_space(b'\t' as u32));
        assert!(is_white_space(b'\n' as u32));
        assert!(!is_white_space(b'a' as u32));
    }

    #[test]
    fn test_parser_creation() {
        let parser = Parser::new("Hello world", ParserOptions::default());
        assert_eq!(parser.message, "Hello world");
        assert_eq!(parser.offset(), 0);
    }

    #[test]
    fn test_parser_bump() {
        let mut parser = Parser::new("abc", ParserOptions::default());
        assert_eq!(parser.char(), b'a' as u32);

        parser.bump();
        assert_eq!(parser.char(), b'b' as u32);
        assert_eq!(parser.offset(), 1);

        parser.bump();
        assert_eq!(parser.char(), b'c' as u32);

        parser.bump();
        assert!(parser.is_eof());
    }

    #[test]
    fn test_parser_bump_if() {
        let mut parser = Parser::new("hello world", ParserOptions::default());

        assert!(parser.bump_if("hello"));
        assert_eq!(parser.offset(), 5);

        assert!(!parser.bump_if("goodbye"));
        assert_eq!(parser.offset(), 5);

        assert!(parser.bump_if(" world"));
        assert!(parser.is_eof());
    }

    #[test]
    fn test_parser_peek() {
        let parser = Parser::new("ab", ParserOptions::default());
        assert_eq!(parser.peek(), Some(b'b' as u32));
        assert_eq!(parser.offset(), 0); // peek doesn't advance
    }
}
