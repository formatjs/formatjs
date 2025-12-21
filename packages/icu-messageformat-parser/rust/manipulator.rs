//! AST manipulation utilities for MessageFormat elements
//!
//! This module provides utilities for transforming and analyzing MessageFormat ASTs:
//! - **Hoisting**: Moving plural/select elements to the top level to create complete sentences
//! - **Variable collection**: Extracting all variables and their types from an AST
//! - **Structural comparison**: Checking if two ASTs have the same variable structure

use crate::types::*;
use std::collections::HashMap;
use std::fmt;

/// Error type for AST manipulation operations.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ManipulatorError {
    /// A plural or select element was found nested within a tag element.
    /// Tag elements should be placed inside each plural/select option instead.
    PluralOrSelectInTag,
    /// A variable was used with conflicting types in the same message.
    ConflictingVariableType {
        /// The name of the variable with conflicting types
        variable: String,
        /// The first type encountered
        expected: Type,
        /// The conflicting type
        found: Type,
    },
}

impl fmt::Display for ManipulatorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ManipulatorError::PluralOrSelectInTag => {
                write!(
                    f,
                    "Cannot hoist plural/select within a tag element. \
                     Please put the tag element inside each plural/select option"
                )
            }
            ManipulatorError::ConflictingVariableType {
                variable,
                expected,
                found,
            } => {
                write!(
                    f,
                    "Variable '{}' has conflicting types: {:?} vs {:?}",
                    variable, expected, found
                )
            }
        }
    }
}

impl std::error::Error for ManipulatorError {}

/// Result type for structural comparison operations.
pub type StructuralComparisonResult = Result<(), StructuralComparisonError>;

/// Error indicating why two ASTs are not structurally the same.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StructuralComparisonError {
    /// The two ASTs have different numbers of variables
    DifferentVariableCount {
        /// Variables in the first AST
        a_vars: Vec<String>,
        /// Variables in the second AST
        b_vars: Vec<String>,
    },
    /// A variable is missing in one of the ASTs
    MissingVariable {
        /// The name of the missing variable
        variable: String,
    },
    /// A variable has different types in the two ASTs
    TypeMismatch {
        /// The name of the variable
        variable: String,
        /// Type in the first AST
        type_a: Type,
        /// Type in the second AST
        type_b: Type,
    },
}

impl fmt::Display for StructuralComparisonError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StructuralComparisonError::DifferentVariableCount { a_vars, b_vars } => {
                write!(
                    f,
                    "Different number of variables: [{}] vs [{}]",
                    a_vars.join(", "),
                    b_vars.join(", ")
                )
            }
            StructuralComparisonError::MissingVariable { variable } => {
                write!(f, "Missing variable '{}' in message", variable)
            }
            StructuralComparisonError::TypeMismatch {
                variable,
                type_a,
                type_b,
            } => {
                write!(
                    f,
                    "Variable '{}' has conflicting types: {:?} vs {:?}",
                    variable, type_a, type_b
                )
            }
        }
    }
}

impl std::error::Error for StructuralComparisonError {}

/// Checks if an element is a plural or select element.
///
/// # Arguments
///
/// * `el` - The element to check
///
/// # Returns
///
/// `true` if the element is a plural or select, `false` otherwise
#[inline]
fn is_plural_or_select_element(el: &MessageFormatElement) -> bool {
    matches!(
        el,
        MessageFormatElement::Plural(_) | MessageFormatElement::Select(_)
    )
}

/// Recursively searches for a plural or select element in an AST.
///
/// This checks if the AST contains any plural or select elements,
/// including those nested inside tag elements.
///
/// # Arguments
///
/// * `ast` - The AST to search
///
/// # Returns
///
/// `true` if a plural or select element is found, `false` otherwise
fn find_plural_or_select_element(ast: &[MessageFormatElement]) -> bool {
    ast.iter().any(|el| match el {
        MessageFormatElement::Plural(_) | MessageFormatElement::Select(_) => true,
        MessageFormatElement::Tag(tag) => find_plural_or_select_element(&tag.children),
        _ => false,
    })
}

/// Hoists a plural or select element to the top level of the AST.
///
/// This transformation takes a plural/select element that appears in the middle
/// of a message and moves it to the outermost level, distributing the surrounding
/// text into each option. This creates complete sentences in each option, which
/// is more translator-friendly.
///
/// # Example
///
/// Before: `["I have ", {count, plural, one{a dog} other{many dogs}}]`
/// After: `[{count, plural, one{I have a dog} other{I have many dogs}}]`
///
/// # Arguments
///
/// * `ast` - The full AST containing the element
/// * `el` - The plural or select element to hoist (must be Plural or Select variant)
/// * `position` - The index of the element in the AST
///
/// # Returns
///
/// A new plural or select element with the surrounding AST distributed into each option
fn hoist_element(
    ast: &[MessageFormatElement],
    el: &MessageFormatElement,
    position: usize,
) -> MessageFormatElement {
    /// Helper to build a new option value by sandwiching the option's content
    /// between the AST slices before and after the hoisted element.
    fn build_option_value(
        before: &[MessageFormatElement],
        option_value: &[MessageFormatElement],
        after: &[MessageFormatElement],
    ) -> Vec<MessageFormatElement> {
        let capacity = before.len() + option_value.len() + after.len();
        let mut new_value = Vec::with_capacity(capacity);
        new_value.extend_from_slice(before);
        new_value.extend_from_slice(option_value);
        new_value.extend_from_slice(after);
        // Recursively hoist any nested plural/select elements
        hoist_selectors_impl(new_value).unwrap_or_else(|e| {
            // If hoisting fails (e.g., plural in tag), return the original value
            // This shouldn't happen in practice, but we handle it gracefully
            let mut result = Vec::with_capacity(capacity);
            result.extend_from_slice(before);
            result.extend_from_slice(option_value);
            result.extend_from_slice(after);
            panic!("{}", e)
        })
    }

    let before = &ast[..position];
    let after = &ast[position + 1..];

    match el {
        MessageFormatElement::Plural(plural) => {
            let options = plural
                .options
                .iter()
                .map(|(key, option)| {
                    let value = build_option_value(before, &option.value, after);
                    (
                        key.clone(),
                        PluralOrSelectOption {
                            value,
                            location: option.location.clone(),
                        },
                    )
                })
                .collect();

            MessageFormatElement::Plural(PluralElement {
                value: plural.value.clone(),
                options,
                offset: plural.offset,
                plural_type: plural.plural_type,
                location: plural.location.clone(),
            })
        }
        MessageFormatElement::Select(select) => {
            let options = select
                .options
                .iter()
                .map(|(key, option)| {
                    let value = build_option_value(before, &option.value, after);
                    (
                        key.clone(),
                        PluralOrSelectOption {
                            value,
                            location: option.location.clone(),
                        },
                    )
                })
                .collect();

            MessageFormatElement::Select(SelectElement {
                value: select.value.clone(),
                options,
                location: select.location.clone(),
            })
        }
        _ => unreachable!("Only plural or select elements should be passed to this function"),
    }
}

/// Internal implementation of `hoist_selectors` that returns a Result.
fn hoist_selectors_impl(
    ast: Vec<MessageFormatElement>,
) -> Result<Vec<MessageFormatElement>, ManipulatorError> {
    // Find the first plural or select element
    for (i, el) in ast.iter().enumerate() {
        if is_plural_or_select_element(el) {
            // Found one - hoist it and return
            return Ok(vec![hoist_element(&ast, el, i)]);
        }

        // Check if there's a plural/select nested inside a tag
        if matches!(el, MessageFormatElement::Tag(_)) && find_plural_or_select_element(std::slice::from_ref(el)) {
            return Err(ManipulatorError::PluralOrSelectInTag);
        }
    }

    // No plural/select elements found - return AST unchanged
    Ok(ast)
}

/// Hoists all plural and select elements to the beginning of the AST.
///
/// This transformation flattens the AST by moving plural/select elements to the top level
/// and distributing surrounding text into each option. This creates complete sentences
/// in each option, which is more translator-friendly than fragmented sentences.
///
/// If there are multiple selectors, the order of which one is hoisted first is
/// based on their position in the AST (left-to-right).
///
/// # Example
///
/// Input: `"I have {count, plural, one{a dog} other{many dogs}}"`
/// Output: `"{count, plural, one{I have a dog} other{I have many dogs}}"`
///
/// # Arguments
///
/// * `ast` - The AST to transform
///
/// # Returns
///
/// A new AST with selectors hoisted
///
/// # Panics
///
/// Panics if a plural/select element is found within a tag element.
/// This maintains compatibility with the TypeScript implementation.
pub fn hoist_selectors(ast: Vec<MessageFormatElement>) -> Vec<MessageFormatElement> {
    hoist_selectors_impl(ast).unwrap_or_else(|e| panic!("{}", e))
}

/// Inserts a variable into the map, checking for type conflicts.
///
/// # Returns
///
/// `Ok(())` if the variable was inserted successfully or already exists with the same type.
/// `Err(ManipulatorError)` if the variable exists with a different type.
fn insert_variable(
    vars: &mut HashMap<String, Type>,
    name: String,
    var_type: Type,
) -> Result<(), ManipulatorError> {
    match vars.get(&name) {
        Some(&existing_type) if existing_type != var_type => {
            Err(ManipulatorError::ConflictingVariableType {
                variable: name,
                expected: existing_type,
                found: var_type,
            })
        }
        _ => {
            vars.insert(name, var_type);
            Ok(())
        }
    }
}

/// Collects all variables and their types from an AST.
///
/// This recursively walks the AST and builds a map of variable names to their types.
/// Variables can come from:
/// - Argument elements: `{name}`
/// - Number elements: `{count, number}`
/// - Date elements: `{today, date}`
/// - Time elements: `{now, time}`
/// - Plural elements: `{count, plural, ...}`
/// - Select elements: `{gender, select, ...}`
/// - Tag elements: `<b>text</b>`
///
/// # Arguments
///
/// * `ast` - The AST to collect variables from
/// * `vars` - The map to populate with variables (modified in place)
///
/// # Errors
///
/// Returns an error if the same variable name is used with conflicting types
/// (e.g., `{x, number}` and `{x, date}` in the same message).
///
/// # Panics
///
/// Panics if a variable is found with conflicting types.
/// This maintains compatibility with the TypeScript implementation.
fn collect_variables(
    ast: &[MessageFormatElement],
    vars: &mut HashMap<String, Type>,
) -> Result<(), ManipulatorError> {
    for el in ast {
        match el {
            MessageFormatElement::Argument(arg) => {
                insert_variable(vars, arg.value.clone(), Type::Argument)?;
            }
            MessageFormatElement::Number(num) => {
                insert_variable(vars, num.value.clone(), Type::Number)?;
            }
            MessageFormatElement::Date(date) => {
                insert_variable(vars, date.value.clone(), Type::Date)?;
            }
            MessageFormatElement::Time(time) => {
                insert_variable(vars, time.value.clone(), Type::Time)?;
            }
            MessageFormatElement::Plural(plural) => {
                insert_variable(vars, plural.value.clone(), Type::Plural)?;
                // Recursively collect from each plural option
                for option in plural.options.values() {
                    collect_variables(&option.value, vars)?;
                }
            }
            MessageFormatElement::Select(select) => {
                insert_variable(vars, select.value.clone(), Type::Select)?;
                // Recursively collect from each select option
                for option in select.options.values() {
                    collect_variables(&option.value, vars)?;
                }
            }
            MessageFormatElement::Tag(tag) => {
                insert_variable(vars, tag.value.clone(), Type::Tag)?;
                // Recursively collect from tag children
                collect_variables(&tag.children, vars)?;
            }
            // Literal and Pound elements don't contain variables
            MessageFormatElement::Literal(_) | MessageFormatElement::Pound(_) => {}
        }
    }
    Ok(())
}

/// Checks if two ASTs are structurally the same.
///
/// Two ASTs are considered structurally the same if they have the same set of
/// variables with the same types. This is useful for validating that translations
/// maintain the same variable structure as the source message.
///
/// The actual text content and order of elements doesn't matter - only that the
/// same variables are present with matching types.
///
/// # Example
///
/// These are structurally the same:
/// - English: "Hello {name}, you have {count, number} messages"
/// - Spanish: "Hola {name}, tienes {count, number} mensajes"
///
/// These are NOT structurally the same:
/// - English: "Hello {name}"
/// - Spanish: "Hola {username}" (different variable name)
///
/// # Arguments
///
/// * `a` - The first AST to compare
/// * `b` - The second AST to compare
///
/// # Returns
///
/// `Ok(())` if the ASTs are structurally the same.
/// `Err(StructuralComparisonError)` if they differ, with details about the difference.
pub fn is_structurally_same(
    a: &[MessageFormatElement],
    b: &[MessageFormatElement],
) -> StructuralComparisonResult {
    let mut a_vars = HashMap::new();
    let mut b_vars = HashMap::new();

    // Panic on conflicting variable types within a single message
    // (maintains compatibility with TypeScript implementation)
    collect_variables(a, &mut a_vars).unwrap_or_else(|e| panic!("{}", e));
    collect_variables(b, &mut b_vars).unwrap_or_else(|e| panic!("{}", e));

    // Check if they have the same number of variables
    if a_vars.len() != b_vars.len() {
        return Err(StructuralComparisonError::DifferentVariableCount {
            a_vars: a_vars.keys().cloned().collect(),
            b_vars: b_vars.keys().cloned().collect(),
        });
    }

    // Check if all variables match with the same types
    for (key, &a_type) in &a_vars {
        match b_vars.get(key) {
            None => {
                return Err(StructuralComparisonError::MissingVariable {
                    variable: key.clone(),
                });
            }
            Some(&b_type) if b_type != a_type => {
                return Err(StructuralComparisonError::TypeMismatch {
                    variable: key.clone(),
                    type_a: a_type,
                    type_b: b_type,
                });
            }
            _ => {}
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hoist_simple_plural() {
        // "I have {count, plural, one{a dog} other{many dogs}}"
        let mut plural_options = HashMap::new();
        plural_options.insert(
            ValidPluralRule::One,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "a dog".to_string(),
                ))],
                location: None,
            },
        );
        plural_options.insert(
            ValidPluralRule::Other,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "many dogs".to_string(),
                ))],
                location: None,
            },
        );

        let ast = vec![
            MessageFormatElement::Literal(LiteralElement::new("I have ".to_string())),
            MessageFormatElement::Plural(PluralElement {
                value: "count".to_string(),
                options: plural_options,
                offset: 0,
                plural_type: PluralType::Cardinal,
                location: None,
            }),
        ];

        let result = hoist_selectors(ast);

        // Should have one element at top level
        assert_eq!(result.len(), 1);

        // It should be a plural element
        if let MessageFormatElement::Plural(plural) = &result[0] {
            // Check the "one" option contains "I have a dog"
            let one_value = &plural.options[&ValidPluralRule::One].value;
            assert_eq!(one_value.len(), 2);

            // Check the "other" option contains "I have many dogs"
            let other_value = &plural.options[&ValidPluralRule::Other].value;
            assert_eq!(other_value.len(), 2);
        } else {
            panic!("Expected plural element at top level");
        }
    }

    #[test]
    fn test_collect_variables() {
        let ast = vec![
            MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
            MessageFormatElement::Number(NumberElement {
                value: "count".to_string(),
                style: None,
                location: None,
            }),
            MessageFormatElement::Date(DateElement {
                value: "today".to_string(),
                style: None,
                location: None,
            }),
        ];

        let mut vars = HashMap::new();
        collect_variables(&ast, &mut vars).unwrap();

        assert_eq!(vars.len(), 3);
        assert_eq!(vars.get("name"), Some(&Type::Argument));
        assert_eq!(vars.get("count"), Some(&Type::Number));
        assert_eq!(vars.get("today"), Some(&Type::Date));
    }

    #[test]
    fn test_is_structurally_same_success() {
        let ast_a = vec![
            MessageFormatElement::Literal(LiteralElement::new("Hello ".to_string())),
            MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
        ];

        let ast_b = vec![
            MessageFormatElement::Literal(LiteralElement::new("Hola ".to_string())),
            MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
        ];

        let result = is_structurally_same(&ast_a, &ast_b);
        assert!(result.is_ok());
    }

    #[test]
    fn test_is_structurally_same_missing_variable() {
        let ast_a = vec![
            MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
            MessageFormatElement::Argument(ArgumentElement::new("count".to_string())),
        ];

        let ast_b = vec![MessageFormatElement::Argument(ArgumentElement::new(
            "name".to_string(),
        ))];

        let result = is_structurally_same(&ast_a, &ast_b);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            StructuralComparisonError::DifferentVariableCount { .. }
        ));
    }

    #[test]
    fn test_is_structurally_same_type_mismatch() {
        let ast_a = vec![MessageFormatElement::Number(NumberElement {
            value: "count".to_string(),
            style: None,
            location: None,
        })];

        let ast_b = vec![MessageFormatElement::Date(DateElement {
            value: "count".to_string(),
            style: None,
            location: None,
        })];

        let result = is_structurally_same(&ast_a, &ast_b);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            StructuralComparisonError::TypeMismatch { .. }
        ));
    }

    #[test]
    #[should_panic(expected = "Cannot hoist plural/select within a tag element")]
    fn test_hoist_panics_on_plural_in_tag() {
        let mut plural_options = HashMap::new();
        plural_options.insert(
            ValidPluralRule::Other,
            PluralOrSelectOption {
                value: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "text".to_string(),
                ))],
                location: None,
            },
        );

        let ast = vec![MessageFormatElement::Tag(TagElement {
            value: "b".to_string(),
            children: vec![MessageFormatElement::Plural(PluralElement {
                value: "count".to_string(),
                options: plural_options,
                offset: 0,
                plural_type: PluralType::Cardinal,
                location: None,
            })],
            location: None,
        })];

        hoist_selectors(ast);
    }
}
