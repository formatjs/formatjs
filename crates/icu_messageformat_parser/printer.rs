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
            MessageFormatElement::Tag(tag) => write_tag_element(out, tag),
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
///
/// # Returns
///
/// A string like `<b>text</b>`
fn write_tag_element(out: &mut String, el: &TagElement) {
    out.push('<');
    out.push_str(&el.value);
    out.push('>');
    write_ast(out, &el.children, false);
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::{Parser, ParserOptions};

    fn parse_message(message: &str) -> Vec<MessageFormatElement> {
        Parser::new(message, ParserOptions::default())
            .parse()
            .expect("message should parse")
    }

    #[test]
    fn test_print_literal() {
        let ast = vec![MessageFormatElement::Literal(LiteralElement::new(
            "Hello, world!".to_string(),
        ))];
        assert_eq!(print_ast(&ast), "Hello, world!");
    }

    #[test]
    fn test_print_tag_like_literal() {
        let ast = vec![MessageFormatElement::Literal(LiteralElement::new(
            "The URL is defined as <Issuer URL>/.well-known/openid-configuration.".to_string(),
        ))];

        assert_eq!(
            print_ast(&ast),
            "The URL is defined as '<Issuer URL>'/.well-known/openid-configuration."
        );
    }

    #[test]
    fn test_print_quoted_literals_with_apostrophes() {
        let ast = vec![MessageFormatElement::Literal(LiteralElement::new(
            "This {isn't} obvious and <Bob's URL> works.".to_string(),
        ))];

        assert_eq!(
            print_ast(&ast),
            "This '{isn''t}' obvious and '<Bob''s URL>' works."
        );
    }

    #[test]
    fn test_print_tag_syntax_delimiters() {
        let ast = vec![MessageFormatElement::Literal(LiteralElement::new(
            "This is <b>HTML</b> and <i>XML</i>.".to_string(),
        ))];

        assert_eq!(
            print_ast(&ast),
            "This is '<b>'HTML'</b>' and '<i>'XML'</i>'."
        );
    }

    #[test]
    fn test_print_adjacent_syntax_as_one_quoted_span() {
        let ast = parse_message("Use }} to close");

        assert_eq!(print_ast(&ast), "Use '}}' to close");
    }

    #[test]
    fn test_print_literal_syntax_runs_round_trip() {
        for input in ["Use }} to close", "a }}< b", "}}}", "<}}", "'{a}{b}'"] {
            let ast = parse_message(input);
            let output = print_ast(&ast);

            assert_eq!(parse_message(&output), ast, "printed message: {output}");
        }
    }

    #[test]
    fn test_print_apostrophe_before_quoted_span_round_trip() {
        let ast = parse_message("a '''}' b");
        let output = print_ast(&ast);

        assert_eq!(parse_message(&output), ast);
    }

    #[test]
    fn test_print_argument() {
        let ast = vec![MessageFormatElement::Argument(ArgumentElement::new(
            "name".to_string(),
        ))];
        assert_eq!(print_ast(&ast), "{name}");
    }

    #[test]
    fn test_print_number() {
        let elem = NumberElement {
            value: "count".to_string(),
            style: Some(NumberSkeletonOrStyle::String("percent".to_string())),
            location: None,
        };
        let ast = vec![MessageFormatElement::Number(elem)];
        assert_eq!(print_ast(&ast), "{count, number, percent}");
    }

    #[test]
    fn test_print_date() {
        let elem = DateElement {
            value: "today".to_string(),
            style: Some(DateTimeSkeletonOrStyle::String("short".to_string())),
            location: None,
        };
        let ast = vec![MessageFormatElement::Date(elem)];
        assert_eq!(print_ast(&ast), "{today, date, short}");
    }

    #[test]
    fn test_print_pound() {
        let ast = vec![MessageFormatElement::Pound(PoundElement { location: None })];
        assert_eq!(print_ast(&ast), "#");
    }

    #[test]
    fn test_print_tag() {
        let tag = TagElement {
            value: "b".to_string(),
            children: vec![MessageFormatElement::Literal(LiteralElement::new(
                "bold".to_string(),
            ))],
            location: None,
        };
        let ast = vec![MessageFormatElement::Tag(tag)];
        assert_eq!(print_ast(&ast), "<b>bold</b>");
    }

    #[test]
    fn test_print_select() {
        use indexmap::IndexMap;

        let mut options = IndexMap::new();
        options.insert(
            "male".to_string(),
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "He".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            "female".to_string(),
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "She".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            "other".to_string(),
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "They".to_string(),
                ))],
                location: None,
            },
        );

        let select = SelectElement {
            value: "gender".to_string(),
            options,
            location: None,
        };

        let ast = vec![MessageFormatElement::Select(select)];
        let result = print_ast(&ast);

        // Keys are sorted alphabetically: female, male, other
        assert_eq!(result, "{gender,select,female{She} male{He} other{They}}");
    }

    #[test]
    fn test_print_plural() {
        use indexmap::IndexMap;

        let mut options = IndexMap::new();
        options.insert(
            ValidPluralRule::One,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "# item".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Other,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "# items".to_string(),
                ))],
                location: None,
            },
        );

        let plural = PluralElement {
            value: "count".to_string(),
            options,
            offset: 0,
            plural_type: PluralType::Cardinal,
            location: None,
        };

        let ast = vec![MessageFormatElement::Plural(plural)];
        let result = print_ast(&ast);

        // Keys are sorted in LDML order: one, other
        assert_eq!(result, "{count,plural,one{'#' item} other{'#' items}}");
    }

    #[test]
    fn test_print_plural_ldml_order() {
        use indexmap::IndexMap;

        // Test that plural rules are printed in LDML order
        let mut options = IndexMap::new();
        options.insert(
            ValidPluralRule::Other,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "other".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Zero,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "zero".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Two,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "two".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::One,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "one".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Exact("=5".to_string()),
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "exactly 5".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Exact("=0".to_string()),
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "exactly 0".to_string(),
                ))],
                location: None,
            },
        );

        let plural = PluralElement {
            value: "count".to_string(),
            options,
            offset: 0,
            plural_type: PluralType::Cardinal,
            location: None,
        };

        let ast = vec![MessageFormatElement::Plural(plural)];
        let result = print_ast(&ast);

        // LDML order: zero, one, two, (few, many skipped), other, then exact matches numerically
        assert_eq!(
            result,
            "{count,plural,zero{zero} one{one} two{two} other{other} =0{exactly 0} =5{exactly 5}}"
        );
    }

    #[test]
    fn test_print_mixed_elements() {
        // Test a message with multiple different element types
        let ast = vec![
            MessageFormatElement::Literal(LiteralElement::new("Hello ".to_string())),
            MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
            MessageFormatElement::Literal(LiteralElement::new(", you have ".to_string())),
            MessageFormatElement::Number(NumberElement {
                value: "count".to_string(),
                style: Some(NumberSkeletonOrStyle::String("integer".to_string())),
                location: None,
            }),
            MessageFormatElement::Literal(LiteralElement::new(" messages.".to_string())),
        ];

        assert_eq!(
            print_ast(&ast),
            "Hello {name}, you have {count, number, integer} messages."
        );
    }

    #[test]
    fn test_print_nested_plural_in_select() {
        use indexmap::IndexMap;

        // Create a plural element
        let mut plural_options = IndexMap::new();
        plural_options.insert(
            ValidPluralRule::One,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "1 file".to_string(),
                ))],
                location: None,
            },
        );
        plural_options.insert(
            ValidPluralRule::Other,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "# files".to_string(),
                ))],
                location: None,
            },
        );

        let plural = PluralElement {
            value: "fileCount".to_string(),
            options: plural_options,
            offset: 0,
            plural_type: PluralType::Cardinal,
            location: None,
        };

        // Create a select element with nested plural
        let mut select_options = IndexMap::new();
        select_options.insert(
            "download".to_string(),
            PluralOrSelectOption {
                value: vec![
                    MessageFormatElement::Literal(LiteralElement::new("Downloaded ".to_string())),
                    MessageFormatElement::Plural(plural.clone()),
                ],
                location: None,
            },
        );
        select_options.insert(
            "upload".to_string(),
            PluralOrSelectOption {
                value: vec![
                    MessageFormatElement::Literal(LiteralElement::new("Uploaded ".to_string())),
                    MessageFormatElement::Plural(plural),
                ],
                location: None,
            },
        );

        let select = SelectElement {
            value: "action".to_string(),
            options: select_options,
            location: None,
        };

        let ast = vec![MessageFormatElement::Select(select)];
        let result = print_ast(&ast);

        // Note: '#' inside plural gets quoted
        assert_eq!(
            result,
            "{action,select,download{Downloaded {fileCount,plural,one{1 file} other{'#' files}}} upload{Uploaded {fileCount,plural,one{1 file} other{'#' files}}}}"
        );
    }

    #[test]
    fn test_print_nested_tags_with_formatting() {
        let ast = vec![MessageFormatElement::Tag(TagElement {
            value: "bold".to_string(),
            children: vec![
                MessageFormatElement::Literal(LiteralElement::new("You have ".to_string())),
                MessageFormatElement::Number(NumberElement {
                    value: "count".to_string(),
                    style: None,
                    location: None,
                }),
                MessageFormatElement::Literal(LiteralElement::new(" new ".to_string())),
                MessageFormatElement::Tag(TagElement {
                    value: "em".to_string(),
                    children: vec![MessageFormatElement::Literal(LiteralElement::new(
                        "messages".to_string(),
                    ))],
                    location: None,
                }),
            ],
            location: None,
        })];

        assert_eq!(
            print_ast(&ast),
            "<bold>You have {count, number} new <em>messages</em></bold>"
        );
    }

    #[test]
    fn test_print_complex_plural_with_nested_elements() {
        use indexmap::IndexMap;

        let mut options = IndexMap::new();
        options.insert(
            ValidPluralRule::Zero,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "No items".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::One,
            PluralOrSelectOption {
                value: vec![
                    MessageFormatElement::Tag(TagElement {
                        value: "b".to_string(),
                        children: vec![MessageFormatElement::Literal(LiteralElement::new(
                            "1".to_string(),
                        ))],
                        location: None,
                    }),
                    MessageFormatElement::Literal(LiteralElement::new(" item".to_string())),
                ],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Other,
            PluralOrSelectOption {
                value: vec![
                    MessageFormatElement::Tag(TagElement {
                        value: "b".to_string(),
                        children: vec![MessageFormatElement::Pound(PoundElement {
                            location: None,
                        })],
                        location: None,
                    }),
                    MessageFormatElement::Literal(LiteralElement::new(" items".to_string())),
                ],
                location: None,
            },
        );

        let plural = PluralElement {
            value: "itemCount".to_string(),
            options,
            offset: 0,
            plural_type: PluralType::Cardinal,
            location: None,
        };

        let ast = vec![MessageFormatElement::Plural(plural)];
        let result = print_ast(&ast);

        assert_eq!(
            result,
            "{itemCount,plural,zero{No items} one{<b>1</b> item} other{<b>#</b> items}}"
        );
    }

    #[test]
    fn test_print_selectordinal() {
        use indexmap::IndexMap;

        let mut options = IndexMap::new();
        options.insert(
            ValidPluralRule::One,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "#st place".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Two,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "#nd place".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Few,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "#rd place".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Other,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "#th place".to_string(),
                ))],
                location: None,
            },
        );

        let plural = PluralElement {
            value: "position".to_string(),
            options,
            offset: 0,
            plural_type: PluralType::Ordinal,
            location: None,
        };

        let ast = vec![MessageFormatElement::Plural(plural)];
        let result = print_ast(&ast);

        // Note: '#' gets quoted inside plural
        assert_eq!(
            result,
            "{position,selectordinal,one{'#'st place} two{'#'nd place} few{'#'rd place} other{'#'th place}}"
        );
    }

    #[test]
    fn test_print_plural_with_offset() {
        use indexmap::IndexMap;

        let mut options = IndexMap::new();
        options.insert(
            ValidPluralRule::Exact("=0".to_string()),
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "Nobody is viewing".to_string(),
                ))],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Exact("=1".to_string()),
            PluralOrSelectOption {
                value: vec![
                    MessageFormatElement::Argument(ArgumentElement::new("p0".to_string())),
                    MessageFormatElement::Literal(LiteralElement::new(" is viewing".to_string())),
                ],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::One,
            PluralOrSelectOption {
                value: vec![
                    MessageFormatElement::Argument(ArgumentElement::new("p0".to_string())),
                    MessageFormatElement::Literal(LiteralElement::new(
                        " and 1 other are viewing".to_string(),
                    )),
                ],
                location: None,
            },
        );
        options.insert(
            ValidPluralRule::Other,
            PluralOrSelectOption {
                value: vec![
                    MessageFormatElement::Argument(ArgumentElement::new("p0".to_string())),
                    MessageFormatElement::Literal(LiteralElement::new(" and ".to_string())),
                    MessageFormatElement::Pound(PoundElement { location: None }),
                    MessageFormatElement::Literal(LiteralElement::new(
                        " others are viewing".to_string(),
                    )),
                ],
                location: None,
            },
        );

        let plural = PluralElement {
            value: "viewerCount".to_string(),
            options,
            offset: 1,
            plural_type: PluralType::Cardinal,
            location: None,
        };

        let ast = vec![MessageFormatElement::Plural(plural)];
        let result = print_ast(&ast);

        assert_eq!(
            result,
            "{viewerCount,plural,offset:1 one{{p0} and 1 other are viewing} other{{p0} and # others are viewing} =0{Nobody is viewing} =1{{p0} is viewing}}"
        );
    }

    #[test]
    fn test_print_date_and_time_with_skeletons() {
        let ast = vec![
            MessageFormatElement::Literal(LiteralElement::new(
                "Meeting scheduled for ".to_string(),
            )),
            MessageFormatElement::Date(DateElement {
                value: "meetingDate".to_string(),
                style: Some(DateTimeSkeletonOrStyle::Skeleton(DateTimeSkeleton {
                    pattern: "yMMMd".to_string(),
                    location: None,
                    parsed_options: DateTimeFormatOptions::default(),
                })),
                location: None,
            }),
            MessageFormatElement::Literal(LiteralElement::new(" at ".to_string())),
            MessageFormatElement::Time(TimeElement {
                value: "meetingTime".to_string(),
                style: Some(DateTimeSkeletonOrStyle::Skeleton(DateTimeSkeleton {
                    pattern: "jmm".to_string(),
                    location: None,
                    parsed_options: DateTimeFormatOptions::default(),
                })),
                location: None,
            }),
        ];

        assert_eq!(
            print_ast(&ast),
            "Meeting scheduled for {meetingDate, date, ::yMMMd} at {meetingTime, time, ::jmm}"
        );
    }
}
