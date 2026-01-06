//! Printer module for converting AST back to ICU MessageFormat strings
//!
//! This module provides functionality to serialize MessageFormat AST elements
//! back into their string representation, following the ICU MessageFormat syntax.

use crate::types::*;
use once_cell::sync::Lazy;
use regex::Regex;

/// Regex for escaping braces that could be interpreted as argument delimiters.
/// Matches curly braces that contain content.
static ESCAPE_BRACES_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"([{}](?:[\s\S]*[{}])?)").expect("Failed to compile ESCAPE_BRACES_REGEX")
});

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
    do_print_ast(ast, false)
}

/// Internal function to print AST with plural context tracking.
///
/// This function handles the recursive printing of AST nodes, keeping track
/// of whether we're currently inside a plural element (which affects how
/// the '#' character is escaped).
///
/// # Arguments
///
/// * `ast` - The AST nodes to print
/// * `is_in_plural` - Whether we're currently inside a plural element (affects '#' escaping)
///
/// # Returns
///
/// The printed string representation
fn do_print_ast(ast: &[MessageFormatElement], is_in_plural: bool) -> String {
    ast.iter()
        .enumerate()
        .filter_map(|(i, el)| {
            // Track position to handle special quote escaping at boundaries
            let is_first = i == 0;
            let is_last = i == ast.len() - 1;

            match el {
                MessageFormatElement::Literal(lit) => {
                    Some(print_literal_element(lit, is_in_plural, is_first, is_last))
                }
                MessageFormatElement::Argument(arg) => Some(print_argument_element(arg)),
                MessageFormatElement::Number(num) => Some(print_number_element(num)),
                MessageFormatElement::Date(date) => Some(print_date_element(date)),
                MessageFormatElement::Time(time) => Some(print_time_element(time)),
                MessageFormatElement::Plural(plural) => Some(print_plural_element(plural)),
                MessageFormatElement::Select(select) => Some(print_select_element(select)),
                MessageFormatElement::Pound(_) => Some("#".to_string()),
                MessageFormatElement::Tag(tag) => Some(print_tag_element(tag)),
            }
        })
        .collect::<Vec<_>>()
        .join("")
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
fn print_tag_element(el: &TagElement) -> String {
    format!("<{}>{}</{}>", el.value, print_ast(&el.children), el.value)
}

/// Escapes curly braces in a message string.
///
/// According to ICU MessageFormat syntax, curly braces that could be
/// interpreted as argument delimiters need to be quoted.
///
/// # Arguments
///
/// * `message` - The message string to escape
///
/// # Returns
///
/// The escaped message with braces wrapped in quotes where necessary
fn print_escaped_message(message: &str) -> String {
    // Replace braces that contain content with quoted versions using the static regex
    ESCAPE_BRACES_REGEX.replace_all(message, "'$1'").to_string()
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
fn print_literal_element(
    el: &LiteralElement,
    is_in_plural: bool,
    is_first_el: bool,
    is_last_el: bool,
) -> String {
    let mut escaped = el.value.clone();

    // If this literal starts with a ' and it's not the 1st node, this means the node before it is non-literal
    // and the `'` needs to be unescaped (doubled) to preserve it
    if !is_first_el && escaped.starts_with('\'') {
        escaped = format!("''{}", &escaped[1..]);
    }

    // Same logic but for the last element - preserve trailing quotes
    if !is_last_el && escaped.ends_with('\'') {
        escaped = format!("{}''", &escaped[..escaped.len() - 1]);
    }

    // Escape any curly braces in the message
    escaped = print_escaped_message(&escaped);

    // Inside plural elements, '#' represents the count and must be quoted to be literal
    if is_in_plural {
        escaped.replace('#', "'#'")
    } else {
        escaped
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
fn print_argument_element(el: &ArgumentElement) -> String {
    format!("{{{}}}", el.value)
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
fn print_number_element(el: &NumberElement) -> String {
    let style_str = match &el.style {
        Some(s) => format!(", {}", print_argument_style_number(s)),
        None => String::new(),
    };
    format!("{{{}, number{}}}", el.value, style_str)
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
fn print_date_element(el: &DateElement) -> String {
    let style_str = match &el.style {
        Some(s) => format!(", {}", print_argument_style_datetime(s)),
        None => String::new(),
    };
    format!("{{{}, date{}}}", el.value, style_str)
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
fn print_time_element(el: &TimeElement) -> String {
    let style_str = match &el.style {
        Some(s) => format!(", {}", print_argument_style_datetime(s)),
        None => String::new(),
    };
    format!("{{{}, time{}}}", el.value, style_str)
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
fn print_number_skeleton_token(token: &NumberSkeletonToken) -> String {
    if token.options.is_empty() {
        token.stem.clone()
    } else {
        format!(
            "{}{}",
            token.stem,
            token
                .options
                .iter()
                .map(|o| format!("/{}", o))
                .collect::<Vec<_>>()
                .join("")
        )
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
fn print_argument_style_number(style: &NumberSkeletonOrStyle) -> String {
    match style {
        NumberSkeletonOrStyle::String(s) => print_escaped_message(s),
        NumberSkeletonOrStyle::Skeleton(skeleton) => format!(
            "::{}",
            skeleton
                .tokens
                .iter()
                .map(print_number_skeleton_token)
                .collect::<Vec<_>>()
                .join(" ")
        ),
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
fn print_argument_style_datetime(style: &DateTimeSkeletonOrStyle) -> String {
    match style {
        DateTimeSkeletonOrStyle::String(s) => print_escaped_message(s),
        DateTimeSkeletonOrStyle::Skeleton(skeleton) => {
            format!("::{}", print_date_time_skeleton(skeleton))
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
fn print_select_element(el: &SelectElement) -> String {
    // Sort keys alphabetically for consistent output
    let mut keys: Vec<_> = el.options.keys().collect();
    keys.sort();

    let options_str = keys
        .iter()
        .map(|id| {
            let option = &el.options[id.as_str()];
            format!("{}{{{}}}", id, do_print_ast(&option.value, false))
        })
        .collect::<Vec<_>>()
        .join(" ");

    format!("{{{},select,{}}}", el.value, options_str)
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
fn print_plural_element(el: &PluralElement) -> String {
    // Determine the type keyword (plural vs selectordinal)
    let type_name = match el.plural_type {
        PluralType::Cardinal => "plural",
        PluralType::Ordinal => "selectordinal",
    };

    let mut parts = Vec::new();

    // Add offset if non-zero
    if el.offset != 0 {
        parts.push(format!("offset:{}", el.offset));
    }

    // Sort keys in LDML order: zero, one, two, few, many, other, then exact matches
    let mut keys: Vec<_> = el.options.keys().collect();
    keys.sort_by_key(|k| get_plural_rule_sort_order(k));

    // Add each option with its message in sorted order
    for id in keys {
        let option = &el.options[id];
        parts.push(format!(
            "{}{{{}}}",
            id.as_str(),
            do_print_ast(&option.value, true) // true = we're in a plural context
        ));
    }

    let options_str = parts.join(" ");

    format!("{{{},{},{}}}", el.value, type_name, options_str)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_print_literal() {
        let ast = vec![MessageFormatElement::Literal(LiteralElement::new(
            "Hello, world!".to_string(),
        ))];
        assert_eq!(print_ast(&ast), "Hello, world!");
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
                    "one item".to_string(),
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
        assert_eq!(result, "{count,plural,one{one item} other{'#' items}}");
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
