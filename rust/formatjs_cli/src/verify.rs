use anyhow::{Context, Result};
use glob::glob;
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

/// Run a series of checks on translation files to validate correctness and consistency.
///
/// This command loads translation files and runs various validation checks comparing
/// target locales against a source locale to ensure translations are complete,
/// don't have extra keys, and maintain structural equivalence with the source.
///
/// # Arguments
///
/// * `translation_files` - Glob patterns for translation files (e.g., `foo/**/en.json`)
/// * `source_locale` - Source locale identifier (e.g., `en`). **Required** for checks to work.
/// * `ignore` - Glob patterns to exclude from verification
/// * `missing_keys` - Whether to check for missing keys in target locales compared to source
/// * `extra_keys` - Whether to check that target locales don't have extra keys not in source
/// * `structural_equality` - Whether to check for structural equality of messages between source and targets
///
/// # Checks
///
/// ## Missing Keys Check
/// Flattens nested objects in both source and target locales, then verifies that all keys
/// present in the source locale exist in each target locale. This guarantees no untranslated messages.
///
/// ## Extra Keys Check
/// Flattens nested objects and checks if target locales have keys that don't exist in the
/// source locale. Helps identify obsolete or mistakenly added translations.
///
/// ## Structural Equality Check
/// Parses both source and target messages as ICU MessageFormat and compares the AST structure.
/// This ensures that translations maintain the same structure (placeholders, plurals, selects)
/// as the source, guaranteeing they can be properly formatted at runtime.
///
/// # Exit Codes
///
/// * `0` - All checks passed
/// * `1` - At least one check failed
///
/// # Example
///
/// ```no_run
/// # use std::path::PathBuf;
/// # use formatjs_cli::verify::verify;
/// let files = vec![PathBuf::from("lang/*.json")];
/// verify(
///     &files,
///     Some("en"),
///     &[],
///     true,  // Check missing keys
///     true,  // Check extra keys
///     true,  // Check structural equality
/// ).unwrap();
/// ```
pub fn verify(
    translation_files: &[PathBuf],
    source_locale: Option<&str>,
    ignore: &[String],
    missing_keys: bool,
    extra_keys: bool,
    structural_equality: bool,
) -> Result<()> {
    // Ensure source locale is provided
    let source_locale = source_locale.context("--source-locale is required for verify command")?;

    // Expand glob patterns to actual file paths
    let mut expanded_files = Vec::new();
    for pattern in translation_files {
        let pattern_str = pattern
            .to_str()
            .context("Pattern path contains invalid UTF-8")?;

        // Try to expand as glob pattern
        match glob(pattern_str) {
            Ok(paths) => {
                for entry in paths {
                    match entry {
                        Ok(path) => expanded_files.push(path),
                        Err(e) => eprintln!("Warning: Failed to read glob entry: {}", e),
                    }
                }
            }
            Err(e) => {
                // If glob pattern is invalid, treat as literal path
                eprintln!("Warning: Invalid glob pattern '{}': {}", pattern_str, e);
                expanded_files.push(pattern.clone());
            }
        }
    }

    // Load all translation files
    let mut locales: HashMap<String, Value> = HashMap::new();

    for file in &expanded_files {
        // Skip ignored patterns
        if should_ignore(file, ignore) {
            continue;
        }

        // Extract locale from filename (e.g., "en.json" -> "en")
        let locale = extract_locale_from_path(file)?;

        // Read and parse JSON
        let content = std::fs::read_to_string(file)
            .with_context(|| format!("Failed to read file: {}", file.display()))?;

        let json: Value = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse JSON in file: {}", file.display()))?;

        locales.insert(locale, json);
    }

    // Verify source locale exists
    if !locales.contains_key(source_locale) {
        anyhow::bail!("Source locale '{}' not found in translation files", source_locale);
    }

    eprintln!("Loaded {} locales", locales.len());
    eprintln!("Source locale: {}", source_locale);
    eprintln!();

    let mut exit_code = 0;

    // Run checks
    if missing_keys {
        if !check_missing_keys(&locales, source_locale) {
            exit_code = 1;
        }
    }

    if extra_keys {
        if !check_extra_keys(&locales, source_locale) {
            exit_code = 1;
        }
    }

    if structural_equality {
        if !check_structural_equality(&locales, source_locale) {
            exit_code = 1;
        }
    }

    if exit_code == 0 {
        eprintln!("✓ All checks passed!");
    } else {
        eprintln!("✗ Some checks failed");
        std::process::exit(exit_code);
    }

    Ok(())
}

/// Extract locale identifier from file path
/// e.g., "/path/to/en.json" -> "en"
fn extract_locale_from_path(path: &Path) -> Result<String> {
    let filename = path
        .file_stem()
        .context("Failed to get filename")?
        .to_str()
        .context("Filename is not valid UTF-8")?;

    Ok(filename.to_string())
}

/// Check if a file should be ignored based on ignore patterns
fn should_ignore(file: &Path, ignore_patterns: &[String]) -> bool {
    let file_str = file.to_string_lossy();
    ignore_patterns.iter().any(|pattern| {
        // Simple glob matching - just check if pattern is substring
        // TODO: Implement proper glob matching
        file_str.contains(pattern)
    })
}

/// Extract all keys from a JSON value recursively with dot notation
/// Returns nested keys like: ["a", "a.b", "a.b.c"]
fn extract_keys(value: &Value, parent_key: &str) -> Vec<String> {
    let mut keys = Vec::new();

    match value {
        Value::Object(map) => {
            for (key, val) in map {
                let full_key = if parent_key.is_empty() {
                    key.clone()
                } else {
                    format!("{}.{}", parent_key, key)
                };

                keys.push(full_key.clone());

                // Recursively extract nested keys
                if val.is_object() {
                    keys.extend(extract_keys(val, &full_key));
                }
            }
        }
        _ => {}
    }

    keys
}

/// Flatten a JSON value to leaf key-value pairs
/// Only includes string values at leaf nodes
fn flatten(value: &Value, parent_key: &str) -> HashMap<String, String> {
    let mut result = HashMap::new();

    match value {
        Value::Object(map) => {
            for (key, val) in map {
                let full_key = if parent_key.is_empty() {
                    key.clone()
                } else {
                    format!("{}.{}", parent_key, key)
                };

                match val {
                    Value::String(s) => {
                        result.insert(full_key, s.clone());
                    }
                    Value::Object(_) => {
                        result.extend(flatten(val, &full_key));
                    }
                    _ => {
                        // Ignore arrays and other types
                    }
                }
            }
        }
        _ => {}
    }

    result
}

/// Check for missing keys in target locales compared to source
fn check_missing_keys(locales: &HashMap<String, Value>, source_locale: &str) -> bool {
    let source = locales.get(source_locale).unwrap();
    let source_keys = extract_keys(source, "");
    let source_key_set: HashSet<_> = source_keys.iter().collect();

    let mut all_passed = true;

    for (locale, content) in locales {
        // Skip source locale
        if locale == source_locale {
            continue;
        }

        let target_keys = extract_keys(content, "");
        let target_key_set: HashSet<_> = target_keys.iter().collect();

        // Find keys in source that are missing in target
        let missing: Vec<_> = source_key_set.difference(&target_key_set).collect();

        if !missing.is_empty() {
            all_passed = false;
            eprintln!("---------------------------------");
            eprintln!("Missing translation keys for locale {}:", locale);
            for key in missing {
                eprintln!("{}", key);
            }
            eprintln!();
        }
    }

    all_passed
}

/// Check for extra keys in target locales not present in source
fn check_extra_keys(locales: &HashMap<String, Value>, source_locale: &str) -> bool {
    let source = locales.get(source_locale).unwrap();
    let source_keys = extract_keys(source, "");
    let source_key_set: HashSet<_> = source_keys.iter().collect();

    let mut all_passed = true;

    for (locale, content) in locales {
        // Skip source locale
        if locale == source_locale {
            continue;
        }

        let target_keys = extract_keys(content, "");
        let target_key_set: HashSet<_> = target_keys.iter().collect();

        // Find keys in target that are not in source
        let extra: Vec<_> = target_key_set.difference(&source_key_set).collect();

        if !extra.is_empty() {
            all_passed = false;
            eprintln!("---------------------------------");
            eprintln!("Extra translation keys for locale {}:", locale);
            for key in extra {
                eprintln!("{}", key);
            }
            eprintln!();
        }
    }

    all_passed
}

/// Check for structural equality between source and target messages
fn check_structural_equality(locales: &HashMap<String, Value>, source_locale: &str) -> bool {
    let source = locales.get(source_locale).unwrap();
    let source_messages = flatten(source, "");

    let mut all_passed = true;

    for (locale, content) in locales {
        // Skip source locale
        if locale == source_locale {
            continue;
        }

        let target_messages = flatten(content, "");
        let mut errors = Vec::new();

        // Check each source message
        for (key, source_msg) in &source_messages {
            // Skip if key doesn't exist in target (that's covered by missing keys check)
            if let Some(target_msg) = target_messages.get(key) {
                // Parse both messages and compare structure
                match compare_message_structure(source_msg, target_msg) {
                    Ok((true, _)) => {
                        // Structures match, all good
                    }
                    Ok((false, Some(detail))) => {
                        errors.push((key.clone(), detail));
                    }
                    Ok((false, None)) => {
                        errors.push((key.clone(), "Messages are structurally different".to_string()));
                    }
                    Err(e) => {
                        errors.push((key.clone(), format!("Parse error: {}", e)));
                    }
                }
            }
        }

        if !errors.is_empty() {
            all_passed = false;
            eprintln!("---------------------------------");
            eprintln!("These translation keys for locale {} are structurally different from {}:", locale, source_locale);
            for (key, error) in errors {
                eprintln!("{}: {}", key, error);
            }
            eprintln!();
        }
    }

    all_passed
}

/// Compare the structure of two ICU MessageFormat messages
/// Returns Ok((true, None)) if structures match, Ok((false, Some(detail))) if they don't, Err if parsing fails
fn compare_message_structure(source: &str, target: &str) -> Result<(bool, Option<String>)> {
    use formatjs_icu_messageformat_parser::{is_structurally_same, Parser, ParserOptions};

    // Parse source message
    let parser_options = ParserOptions::default();
    let source_parser = Parser::new(source, parser_options.clone());
    let source_ast = source_parser
        .parse()
        .with_context(|| format!("Failed to parse source message: {}", source))?;

    // Parse target message
    let target_parser = Parser::new(target, parser_options);
    let target_ast = target_parser
        .parse()
        .with_context(|| format!("Failed to parse target message: {}", target))?;

    // Compare AST structures
    match is_structurally_same(&source_ast, &target_ast) {
        Ok(()) => Ok((true, None)),
        Err(e) => Ok((false, Some(e.to_string()))),
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_extract_keys() {
        let value = json!({
            "a": "value",
            "b": {
                "c": "value2",
                "d": {
                    "e": "value3"
                }
            }
        });

        let keys = extract_keys(&value, "");
        assert!(keys.contains(&"a".to_string()));
        assert!(keys.contains(&"b".to_string()));
        assert!(keys.contains(&"b.c".to_string()));
        assert!(keys.contains(&"b.d".to_string()));
        assert!(keys.contains(&"b.d.e".to_string()));
    }

    #[test]
    fn test_extract_keys_empty_object() {
        let value = json!({});
        let keys = extract_keys(&value, "");
        assert_eq!(keys.len(), 0);
    }

    #[test]
    fn test_extract_keys_flat_object() {
        let value = json!({
            "key1": "value1",
            "key2": "value2",
            "key3": "value3"
        });

        let keys = extract_keys(&value, "");
        assert_eq!(keys.len(), 3);
        assert!(keys.contains(&"key1".to_string()));
        assert!(keys.contains(&"key2".to_string()));
        assert!(keys.contains(&"key3".to_string()));
    }

    #[test]
    fn test_flatten() {
        let value = json!({
            "a": "value1",
            "b": {
                "c": "value2",
                "d": {
                    "e": "value3"
                }
            }
        });

        let flattened = flatten(&value, "");
        assert_eq!(flattened.get("a"), Some(&"value1".to_string()));
        assert_eq!(flattened.get("b.c"), Some(&"value2".to_string()));
        assert_eq!(flattened.get("b.d.e"), Some(&"value3".to_string()));
        assert_eq!(flattened.len(), 3);
    }

    #[test]
    fn test_flatten_ignores_non_string_values() {
        let value = json!({
            "string": "value",
            "number": 42,
            "array": [1, 2, 3],
            "null": null,
            "bool": true,
            "nested": {
                "valid": "nested_value",
                "invalid": 123
            }
        });

        let flattened = flatten(&value, "");
        assert_eq!(flattened.len(), 2);
        assert_eq!(flattened.get("string"), Some(&"value".to_string()));
        assert_eq!(flattened.get("nested.valid"), Some(&"nested_value".to_string()));
        assert!(!flattened.contains_key("number"));
        assert!(!flattened.contains_key("array"));
        assert!(!flattened.contains_key("nested.invalid"));
    }

    #[test]
    fn test_flatten_empty_object() {
        let value = json!({});
        let flattened = flatten(&value, "");
        assert_eq!(flattened.len(), 0);
    }

    #[test]
    fn test_extract_locale_from_path() {
        let path = Path::new("/path/to/en.json");
        assert_eq!(extract_locale_from_path(path).unwrap(), "en");

        let path = Path::new("fr-FR.json");
        assert_eq!(extract_locale_from_path(path).unwrap(), "fr-FR");
    }

    #[test]
    fn test_extract_locale_from_path_complex() {
        let path = Path::new("/deep/nested/path/to/locales/zh-Hans-CN.json");
        assert_eq!(extract_locale_from_path(path).unwrap(), "zh-Hans-CN");

        let path = Path::new("pt-BR.json");
        assert_eq!(extract_locale_from_path(path).unwrap(), "pt-BR");
    }

    #[test]
    fn test_should_ignore() {
        let file = Path::new("/path/to/file.json");
        let ignore_patterns = vec!["node_modules".to_string(), "test".to_string()];
        assert!(!should_ignore(file, &ignore_patterns));

        let file = Path::new("/path/node_modules/file.json");
        assert!(should_ignore(file, &ignore_patterns));

        let file = Path::new("/path/test/file.json");
        assert!(should_ignore(file, &ignore_patterns));

        let file = Path::new("/path/to/test_file.json");
        assert!(should_ignore(file, &ignore_patterns));
    }

    #[test]
    fn test_should_ignore_empty_patterns() {
        let file = Path::new("/path/to/file.json");
        let ignore_patterns: Vec<String> = vec![];
        assert!(!should_ignore(file, &ignore_patterns));
    }

    #[test]
    fn test_check_missing_keys() {
        let mut locales = HashMap::new();
        locales.insert(
            "en".to_string(),
            json!({
                "greeting": "Hello",
                "farewell": "Goodbye",
                "nested": {
                    "key": "value"
                }
            }),
        );
        locales.insert(
            "es".to_string(),
            json!({
                "greeting": "Hola",
                "farewell": "Adiós",
                "nested": {
                    "key": "valor"
                }
            }),
        );

        assert!(check_missing_keys(&locales, "en"));
    }

    #[test]
    fn test_check_missing_keys_with_missing() {
        let mut locales = HashMap::new();
        locales.insert(
            "en".to_string(),
            json!({
                "greeting": "Hello",
                "farewell": "Goodbye",
                "extra": "Extra key"
            }),
        );
        locales.insert(
            "es".to_string(),
            json!({
                "greeting": "Hola"
            }),
        );

        assert!(!check_missing_keys(&locales, "en"));
    }

    #[test]
    fn test_check_extra_keys() {
        let mut locales = HashMap::new();
        locales.insert(
            "en".to_string(),
            json!({
                "greeting": "Hello",
                "farewell": "Goodbye"
            }),
        );
        locales.insert(
            "es".to_string(),
            json!({
                "greeting": "Hola",
                "farewell": "Adiós"
            }),
        );

        assert!(check_extra_keys(&locales, "en"));
    }

    #[test]
    fn test_check_extra_keys_with_extra() {
        let mut locales = HashMap::new();
        locales.insert(
            "en".to_string(),
            json!({
                "greeting": "Hello"
            }),
        );
        locales.insert(
            "es".to_string(),
            json!({
                "greeting": "Hola",
                "extra_key": "Extra value",
                "another_extra": "Another"
            }),
        );

        assert!(!check_extra_keys(&locales, "en"));
    }

    #[test]
    fn test_compare_message_structure_identical() {
        let source = "Hello {name}!";
        let target = "Hola {name}!";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, true);
        assert_eq!(result.1, None);
    }

    #[test]
    fn test_compare_message_structure_same_structure_different_text() {
        let source = "You have {count} items";
        let target = "Tienes {count} artículos";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, true);
    }

    #[test]
    fn test_compare_message_structure_plural() {
        let source = "You have {count, plural, one {# item} other {# items}}";
        let target = "Tienes {count, plural, one {# artículo} other {# artículos}}";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, true);
    }

    #[test]
    fn test_compare_message_structure_missing_variable() {
        let source = "Hello {name}!";
        let target = "Hello!";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, false);
        assert!(result.1.is_some());
        assert!(result.1.unwrap().contains("name"));
    }

    #[test]
    fn test_compare_message_structure_different_variable_name() {
        let source = "Hello {name}!";
        let target = "Hello {username}!";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, false);
        assert!(result.1.is_some());
    }

    #[test]
    fn test_compare_message_structure_type_mismatch() {
        let source = "{count, plural, one {# item} other {# items}}";
        let target = "{count} items";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, false);
        assert!(result.1.is_some());
        let error_msg = result.1.unwrap();
        assert!(error_msg.contains("count"));
        assert!(error_msg.contains("type"));
    }

    #[test]
    fn test_compare_message_structure_date_format() {
        let source = "Today is {date, date, short}";
        let target = "Hoy es {date, date, short}";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, true);
    }

    #[test]
    fn test_compare_message_structure_date_type_mismatch() {
        let source = "Today is {date, date, short}";
        let target = "Today is {date}";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, false);
        assert!(result.1.is_some());
    }

    #[test]
    fn test_compare_message_structure_number_format() {
        let source = "Price: {price, number, ::currency/USD}";
        let target = "Precio: {price, number, ::currency/USD}";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, true);
    }

    #[test]
    fn test_compare_message_structure_select() {
        let source = "{gender, select, male {He} female {She} other {They}}";
        let target = "{gender, select, male {Él} female {Ella} other {Ellos}}";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, true);
    }

    #[test]
    fn test_compare_message_structure_multiple_variables() {
        let source = "Hello {firstName} {lastName}! You have {count} messages.";
        let target = "Hola {firstName} {lastName}! Tienes {count} mensajes.";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, true);
    }

    #[test]
    fn test_compare_message_structure_multiple_variables_missing_one() {
        let source = "Hello {firstName} {lastName}! You have {count} messages.";
        let target = "Hola {firstName}! Tienes {count} mensajes.";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, false);
        assert!(result.1.is_some());
    }

    #[test]
    fn test_compare_message_structure_complex_nested() {
        // Use # instead of {count} inside plural branches
        let source = "{count, plural, one {You have # {itemType, select, photo {photo} video {video} other {item}}} other {You have # {itemType, select, photo {photos} video {videos} other {items}}}}";
        let target = "{count, plural, one {Tienes # {itemType, select, photo {foto} video {video} other {artículo}}} other {Tienes # {itemType, select, photo {fotos} video {videos} other {artículos}}}}";
        let result = compare_message_structure(source, target).unwrap();
        assert_eq!(result.0, true);
    }

    #[test]
    fn test_compare_message_structure_invalid_source() {
        let source = "Hello {name";
        let target = "Hola {name}";
        let result = compare_message_structure(source, target);
        assert!(result.is_err());
    }

    #[test]
    fn test_compare_message_structure_invalid_target() {
        let source = "Hello {name}";
        let target = "Hola {name";
        let result = compare_message_structure(source, target);
        assert!(result.is_err());
    }

    #[test]
    fn test_check_structural_equality() {
        let mut locales = HashMap::new();
        locales.insert(
            "en".to_string(),
            json!({
                "greeting": "Hello {name}!",
                "count": "You have {count, plural, one {# item} other {# items}}"
            }),
        );
        locales.insert(
            "es".to_string(),
            json!({
                "greeting": "Hola {name}!",
                "count": "Tienes {count, plural, one {# artículo} other {# artículos}}"
            }),
        );

        assert!(check_structural_equality(&locales, "en"));
    }

    #[test]
    fn test_check_structural_equality_with_errors() {
        let mut locales = HashMap::new();
        locales.insert(
            "en".to_string(),
            json!({
                "greeting": "Hello {name}!",
                "count": "You have {count, plural, one {# item} other {# items}}"
            }),
        );
        locales.insert(
            "fr".to_string(),
            json!({
                "greeting": "Bonjour {username}!",
                "count": "Vous avez {count} articles"
            }),
        );

        assert!(!check_structural_equality(&locales, "en"));
    }
}
