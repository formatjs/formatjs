//! Printer module for converting AST back to ICU MessageFormat strings
//!
//! This module provides functionality to serialize MessageFormat AST elements
//! back into their string representation, following the ICU MessageFormat syntax.

use crate::types::*;
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
    write_ast(&mut result, ast, false);
    result
}

fn write_ast(out: &mut String, ast: &[MessageFormatElement], is_in_plural: bool) {
    for (i, el) in ast.iter().enumerate() {
        // Track position to handle special quote escaping at boundaries
        let is_first = i == 0;
        let is_last = i == ast.len() - 1;

        match el {
            MessageFormatElement::Literal(lit) => {
                write_literal_element(out, lit, is_in_plural, is_first, is_last)
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
    write_ast(out, &el.children, is_in_plural);
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
) {
    let Some(start) = *quoted_start else {
        return;
    };

    let literal = &message[*literal_start..start];
    out.push_str(literal);
    if literal.ends_with('\'') {
        out.push('\'');
    }
    write_quoted_syntax_token(out, &message[start..quoted_end]);
    *literal_start = quoted_end;
    *quoted_start = None;
}

/// Escapes ICU syntax tokens in a literal message string.
fn write_escaped_message(out: &mut String, message: &str, is_in_plural: bool) {
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
            if quoted_start.is_some() && i == quoted_end {
                quoted_end = end;
            } else {
                flush_quoted_syntax_token(
                    out,
                    message,
                    &mut literal_start,
                    &mut quoted_start,
                    quoted_end,
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
    );
    out.push_str(&message[literal_start..]);
}

/// Prints a literal text element with appropriate escaping.
///
/// This handles special cases for quote escaping at element boundaries
/// and '#' escaping inside plural elements.
///
/// # Arguments
///
/// * `el` - The literal element to print
/// * `is_in_plural` - Whether this literal is inside a plural (affects '#' escaping)
/// * `is_first_el` - Whether this is the first element in the sequence
/// * `is_last_el` - Whether this is the last element in the sequence
///
/// # Returns
///
/// The properly escaped literal text
fn write_literal_element(
    out: &mut String,
    el: &LiteralElement,
    is_in_plural: bool,
    is_first_el: bool,
    is_last_el: bool,
) {
    // If this literal starts with a ' and it's not the 1st node, this means the node before it is non-literal
    // and the `'` needs to be unescaped (doubled) to preserve it
    let needs_leading_quote_escape = !is_first_el && el.value.starts_with('\'');
    let needs_trailing_quote_escape = !is_last_el && el.value.ends_with('\'');

    if needs_leading_quote_escape || needs_trailing_quote_escape {
        let mut escaped = el.value.clone();
        if needs_leading_quote_escape {
            escaped = format!("''{}", &escaped[1..]);
        }

        // Same logic but for the last element - preserve trailing quotes
        if !is_last_el && escaped.ends_with('\'') {
            escaped = format!("{}''", &escaped[..escaped.len() - 1]);
        }

        write_escaped_message(out, &escaped, is_in_plural);
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
        NumberSkeletonOrStyle::String(s) => write_escaped_message(out, s, false),
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
        DateTimeSkeletonOrStyle::String(s) => write_escaped_message(out, s, false),
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
        write_ast(out, &option.value, false);
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
        write_ast(out, &option.value, true); // true = we're in a plural context
        out.push('}');
    }

    out.push('}');
}
