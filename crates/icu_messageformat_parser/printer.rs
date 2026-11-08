//! Printer module for converting AST back to ICU MessageFormat strings
//!
//! This module provides functionality to serialize MessageFormat AST elements
//! back into their string representation, following the ICU MessageFormat syntax.

use crate::types::*;
use std::borrow::Cow;
use std::fmt::Write;

/// Prints a MessageFormat AST to its string representation.
///
/// This is the main entry point for converting a parsed AST back into
/// an ICU MessageFormat string.
///
/// # Arguments
///
/// * `ast` - A slice of MessageFormatElement nodes to print
///
/// # Returns
///
/// A string containing the ICU MessageFormat representation of the AST
///
/// # Example
///
/// ```
/// use icu_messageformat_parser::{print_ast, MessageFormatElement, LiteralElement};
///
/// let ast = vec![MessageFormatElement::Literal(LiteralElement::new("Hello".to_string()))];
/// assert_eq!(print_ast(&ast), "Hello");
/// ```
pub fn print_ast(ast: &[MessageFormatElement]) -> String {
    let mut result = String::new();
    write_ast(&mut result, ast, false, true);
    result
}

fn write_ast(
    out: &mut String,
    ast: &[MessageFormatElement],
    is_in_plural: bool,
    is_at_end_of_message: bool,
) {
    let mut elements = ast.iter().peekable();
    while let Some(el) = elements.next() {
        match el {
            MessageFormatElement::Literal(lit) => {
                let mut literal = Cow::Borrowed(lit);
                while let Some(MessageFormatElement::Literal(next)) = elements.peek() {
                    let merged = literal.to_mut();
                    let raw_value = merged
                        .raw_value
                        .as_ref()
                        .zip(next.raw_value.as_ref())
                        .map(|(left, right)| format!("{left}{right}"));
                    merged.value.push_str(&next.value);
                    merged.raw_value = raw_value;
                    elements.next();
                }
                write_literal_element(
                    out,
                    &literal,
                    is_in_plural,
                    is_at_end_of_message && elements.peek().is_none(),
                    is_at_end_of_message,
                )
            }
            MessageFormatElement::Argument(arg) => write_argument_element(out, arg),
            MessageFormatElement::Number(num) => write_number_element(out, num),
            MessageFormatElement::Date(date) => write_date_element(out, date),
            MessageFormatElement::Time(time) => write_time_element(out, time),
            MessageFormatElement::Plural(plural) => write_plural_element(out, plural),
            MessageFormatElement::Select(select) => write_select_element(out, select),
            MessageFormatElement::Pound(_) => out.push('#'),
            MessageFormatElement::Tag(tag) => write_tag_element(out, tag, is_in_plural),
        }
    }
}

/// Prints an XML-like tag element with its children.
///
/// Formats a tag as `<name>children</name>`.
///
/// # Arguments
///
/// * `el` - The tag element to print
/// * `is_in_plural` - Whether the tag is inside a plural submessage
///
/// # Returns
///
/// A string like `<b>text</b>`
fn write_tag_element(out: &mut String, el: &TagElement, is_in_plural: bool) {
    out.push('<');
    out.push_str(&el.value);
    out.push('>');
    write_ast(out, &el.children, is_in_plural, false);
    out.push_str("</");
    out.push_str(&el.value);
    out.push('>');
}

/// Wraps one ICU syntax token in apostrophe quotes.
fn write_quoted_syntax_token(out: &mut String, token: &str) {
    out.push('\'');
    for ch in token.chars() {
        if ch == '\'' {
            out.push_str("''");
        } else {
            out.push(ch);
        }
    }
    out.push('\'');
}

fn is_tag_syntax_start(bytes: &[u8], index: usize) -> bool {
    bytes[index] == b'<'
        && matches!(
            bytes.get(index + 1),
            Some(b'/') | Some(b'a'..=b'z') | Some(b'A'..=b'Z')
        )
}

fn find_tag_syntax_end(bytes: &[u8], index: usize) -> usize {
    let mut end = index + 1;
    while end < bytes.len() && bytes[end] != b'>' {
        end += 1;
    }
    if end < bytes.len() {
        end + 1
    } else {
        bytes.len()
    }
}

fn find_brace_syntax_end(bytes: &[u8], index: usize) -> usize {
    let mut end = index + 1;
    while end < bytes.len() && bytes[end] != b'}' {
        end += 1;
    }
    if end < bytes.len() {
        end + 1
    } else {
        index + 1
    }
}

fn flush_quoted_syntax_token(
    out: &mut String,
    message: &str,
    literal_start: &mut usize,
    quoted_start: &mut Option<usize>,
    quoted_end: usize,
    preserve_apostrophes: bool,
) {
    let Some(start) = *quoted_start else {
        return;
    };

    let literal = &message[*literal_start..start];
    write_plain_text(out, literal, preserve_apostrophes);
    if preserve_apostrophes && literal.ends_with('\'') {
        out.push('\'');
    }
    write_quoted_syntax_token(out, &message[start..quoted_end]);
    *literal_start = quoted_end;
    *quoted_start = None;
}

/// Escapes ICU syntax tokens in a literal message string.
fn write_escaped_message(out: &mut String, message: &str, is_in_plural: bool) {
    write_escaped_text(out, message, is_in_plural, false);
}

fn write_plain_text(out: &mut String, text: &str, preserve_apostrophes: bool) {
    if preserve_apostrophes {
        out.push_str(text);
    } else {
        for ch in text.chars() {
            out.push(ch);
            if ch == '\'' {
                out.push(ch);
            }
        }
    }
}

fn write_escaped_text(
    out: &mut String,
    message: &str,
    is_in_plural: bool,
    preserve_apostrophes: bool,
) {
    let bytes = message.as_bytes();
    let mut literal_start = 0;
    let mut quoted_start = None;
    let mut quoted_end = 0;
    let mut i = 0;

    while i < bytes.len() {
        let end = match bytes[i] {
            b'{' => Some(find_brace_syntax_end(bytes, i)),
            b'}' => Some(i + 1),
            b'<' if is_tag_syntax_start(bytes, i) => Some(find_tag_syntax_end(bytes, i)),
            b'#' if is_in_plural => Some(i + 1),
            _ => None,
        };

        if let Some(end) = end {
            if quoted_start.is_some()
                && (i == quoted_end
                    || (!preserve_apostrophes && bytes[quoted_end..i].iter().all(|b| *b == b'\'')))
            {
                quoted_end = end;
            } else {
                flush_quoted_syntax_token(
                    out,
                    message,
                    &mut literal_start,
                    &mut quoted_start,
                    quoted_end,
                    preserve_apostrophes,
                );
                quoted_start = Some(i);
                quoted_end = end;
            }
            i = end;
        } else {
            i += 1;
        }
    }

    flush_quoted_syntax_token(
        out,
        message,
        &mut literal_start,
        &mut quoted_start,
        quoted_end,
        preserve_apostrophes,
    );
    write_plain_text(out, &message[literal_start..], preserve_apostrophes);
}

fn validated_raw_value<'a>(
    raw_value: &'a str,
    value: &str,
    is_in_plural: bool,
    is_at_end_of_message: bool,
    is_top_level: bool,
) -> Option<Cow<'a, str>> {
    let mut decoded = String::new();
    let mut chars = raw_value.chars().peekable();
    let mut close_quote = false;
    while let Some(ch) = chars.next() {
        if ch == '\'' {
            let next = chars.peek().copied();
            if next == Some('\'') {
                decoded.push('\'');
                chars.next();
                continue;
            }
            if matches!(next, Some('{') | Some('}') | Some('<') | Some('>'))
                || (is_in_plural && next == Some('#'))
            {
                let mut closed = false;
                while let Some(quoted) = chars.next() {
                    if quoted == '\'' {
                        if chars.peek() == Some(&'\'') {
                            decoded.push('\'');
                            chars.next();
                        } else {
                            closed = true;
                            break;
                        }
                    } else {
                        decoded.push(quoted);
                    }
                }
                close_quote = !closed && !is_at_end_of_message;
                continue;
            }
            if chars.peek().is_none() && !is_at_end_of_message {
                close_quote = true;
            }
        }
        // Raw spelling must remain literal in the destination context.
        if ch == '{'
            || (!is_top_level && ch == '}')
            || (is_in_plural && ch == '#')
            || (ch == '<'
                && chars
                    .peek()
                    .is_some_and(|next| next.is_ascii_alphabetic() || *next == '/'))
        {
            return None;
        }
        decoded.push(ch);
    }
    if decoded != value {
        return None;
    }
    Some(if close_quote {
        Cow::Owned(format!("{raw_value}'"))
    } else {
        Cow::Borrowed(raw_value)
    })
}

fn write_literal_element(
    out: &mut String,
    el: &LiteralElement,
    is_in_plural: bool,
    is_at_end_of_message: bool,
    is_top_level: bool,
) {
    if let Some(raw_value) = el.raw_value.as_deref().and_then(|raw_value| {
        validated_raw_value(
            raw_value,
            &el.value,
            is_in_plural,
            is_at_end_of_message,
            is_top_level,
        )
    }) {
        out.push_str(&raw_value);
    } else {
        write_escaped_message(out, &el.value, is_in_plural);
    }
}

/// Prints a simple argument reference.
///
/// Formats as `{name}`.
///
/// # Arguments
///
/// * `el` - The argument element to print
///
/// # Returns
///
/// A string like `{count}`
fn write_argument_element(out: &mut String, el: &ArgumentElement) {
    let _ = write!(out, "{{{}}}", el.value);
}

/// Prints a number format element.
///
/// Formats as `{name, number}` or `{name, number, style}`.
///
/// # Arguments
///
/// * `el` - The number element to print
///
/// # Returns
///
/// A string like `{count, number, percent}`
fn write_number_element(out: &mut String, el: &NumberElement) {
    let _ = write!(out, "{{{}, number", el.value);
    if let Some(style) = &el.style {
        out.push_str(", ");
        write_argument_style_number(out, style);
    }
    out.push('}');
}

/// Prints a date format element.
///
/// Formats as `{name, date}` or `{name, date, style}`.
///
/// # Arguments
///
/// * `el` - The date element to print
///
/// # Returns
///
/// A string like `{today, date, short}`
fn write_date_element(out: &mut String, el: &DateElement) {
    let _ = write!(out, "{{{}, date", el.value);
    if let Some(style) = &el.style {
        out.push_str(", ");
        write_argument_style_datetime(out, style);
    }
    out.push('}');
}

/// Prints a time format element.
///
/// Formats as `{name, time}` or `{name, time, style}`.
///
/// # Arguments
///
/// * `el` - The time element to print
///
/// # Returns
///
/// A string like `{now, time, ::jmm}`
fn write_time_element(out: &mut String, el: &TimeElement) {
    let _ = write!(out, "{{{}, time", el.value);
    if let Some(style) = &el.style {
        out.push_str(", ");
        write_argument_style_datetime(out, style);
    }
    out.push('}');
}

/// Prints a number skeleton token.
///
/// Number skeleton tokens consist of a stem and optional options.
/// Options are printed with slash separators.
///
/// # Arguments
///
/// * `token` - The number skeleton token to print
///
/// # Returns
///
/// A string like `currency/USD` or `percent`
fn write_number_skeleton_token(out: &mut String, token: &NumberSkeletonToken) {
    out.push_str(&token.stem);
    for option in &token.options {
        out.push('/');
        out.push_str(option);
    }
}

/// Prints a number argument style (either string or skeleton).
///
/// Styles can be either simple strings like "percent" or complex
/// number skeletons prefixed with "::".
///
/// # Arguments
///
/// * `style` - The number style to print
///
/// # Returns
///
/// A string like `percent` or `::currency/USD`
fn write_argument_style_number(out: &mut String, style: &NumberSkeletonOrStyle) {
    match style {
        NumberSkeletonOrStyle::String(s) => write_escaped_text(out, s, false, true),
        NumberSkeletonOrStyle::Skeleton(skeleton) => {
            out.push_str("::");
            for (index, token) in skeleton.tokens.iter().enumerate() {
                if index > 0 {
                    out.push(' ');
                }
                write_number_skeleton_token(out, token);
            }
        }
    }
}

/// Prints a date/time argument style (either string or skeleton).
///
/// Styles can be either simple strings like "short" or complex
/// date/time skeletons prefixed with "::".
///
/// # Arguments
///
/// * `style` - The date/time style to print
///
/// # Returns
///
/// A string like `short` or `::yMMMd`
fn write_argument_style_datetime(out: &mut String, style: &DateTimeSkeletonOrStyle) {
    match style {
        DateTimeSkeletonOrStyle::String(s) => write_escaped_text(out, s, false, true),
        DateTimeSkeletonOrStyle::Skeleton(skeleton) => {
            out.push_str("::");
            out.push_str(&skeleton.pattern);
        }
    }
}

/// Prints a date/time skeleton pattern.
///
/// The skeleton pattern defines the format for date/time display
/// using ICU skeleton syntax (e.g., "yMMMd" for year, abbreviated month, day).
///
/// # Arguments
///
/// * `style` - The date/time skeleton to print
///
/// # Returns
///
/// The skeleton pattern string
pub fn print_date_time_skeleton(style: &DateTimeSkeleton) -> String {
    style.pattern.clone()
}

/// Prints a select element with its options.
///
/// Select elements choose text based on a value, like:
/// `{gender, select, male {He} female {She} other {They}}`
///
/// Options are sorted alphabetically by key for consistent output.
///
/// # Arguments
///
/// * `el` - The select element to print
///
/// # Returns
///
/// A string like `{gender,select,female{She} male{He} other{They}}`
fn write_select_element(out: &mut String, el: &SelectElement) {
    // Sort keys alphabetically for consistent output
    let mut keys: Vec<_> = el.options.keys().collect();
    keys.sort();

    let _ = write!(out, "{{{},select,", el.value);
    for (index, id) in keys.iter().enumerate() {
        if index > 0 {
            out.push(' ');
        }
        let option = el.options.get(*id).expect("select key should exist");
        out.push_str(id);
        out.push('{');
        write_ast(out, &option.value, false, false);
        out.push('}');
    }
    out.push('}');
}

/// Returns the LDML sort order for a plural rule.
///
/// LDML order is: zero, one, two, few, many, other, then =N exact matches sorted numerically.
///
/// # Arguments
///
/// * `rule` - The plural rule to get the sort order for
///
/// # Returns
///
/// A tuple of (primary_order, secondary_order) for sorting
fn get_plural_rule_sort_order(rule: &ValidPluralRule) -> (u8, i32) {
    match rule {
        ValidPluralRule::Zero => (0, 0),
        ValidPluralRule::One => (1, 0),
        ValidPluralRule::Two => (2, 0),
        ValidPluralRule::Few => (3, 0),
        ValidPluralRule::Many => (4, 0),
        ValidPluralRule::Other => (5, 0),
        ValidPluralRule::Exact(s) => {
            // Extract the numeric value from exact matches like "=0", "=1"
            let num = s.trim_start_matches('=').parse::<i32>().unwrap_or(0);
            (6, num) // Exact matches come after 'other', sorted numerically
        }
    }
}

/// Prints a plural element with its options and optional offset.
///
/// Plural elements choose text based on quantity, supporting both
/// cardinal (`plural`) and ordinal (`selectordinal`) forms.
/// Example: `{count, plural, one {1 item} other {# items}}`
///
/// Options are sorted in LDML order: zero, one, two, few, many, other,
/// then exact matches (=N) sorted numerically.
///
/// # Arguments
///
/// * `el` - The plural element to print
///
/// # Returns
///
/// A string like `{count,plural,offset:1 one{# item} other{# items}}`
fn write_plural_element(out: &mut String, el: &PluralElement) {
    // Determine the type keyword (plural vs selectordinal)
    let type_name = match el.plural_type {
        PluralType::Cardinal => "plural",
        PluralType::Ordinal => "selectordinal",
    };

    let _ = write!(out, "{{{},{},", el.value, type_name);
    let mut wrote_part = false;

    // Add offset if non-zero
    if el.offset != 0 {
        let _ = write!(out, "offset:{}", el.offset);
        wrote_part = true;
    }

    // Sort keys in LDML order: zero, one, two, few, many, other, then exact matches
    let mut keys: Vec<_> = el.options.keys().collect();
    keys.sort_by_key(|k| get_plural_rule_sort_order(k));

    // Add each option with its message in sorted order
    for id in keys {
        if wrote_part {
            out.push(' ');
        }
        wrote_part = true;
        let option = &el.options[id];
        out.push_str(id.as_str());
        out.push('{');
        write_ast(out, &option.value, true, false);
        out.push('}');
    }

    out.push('}');
}
