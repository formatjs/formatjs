use anyhow::{Context, Result};
use rayon::prelude::*;
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Clone, Copy, Debug, Default)]
pub enum MessageSyntax {
    #[default]
    Icu,
    JavaPrintf,
    ApplePrintf,
}

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
    follow_links: bool,
) -> Result<()> {
    verify_with_syntax(
        translation_files,
        source_locale,
        ignore,
        missing_keys,
        extra_keys,
        structural_equality,
        follow_links,
        MessageSyntax::Icu,
    )
}

pub fn verify_with_syntax(
    translation_files: &[PathBuf],
    source_locale: Option<&str>,
    ignore: &[String],
    missing_keys: bool,
    extra_keys: bool,
    structural_equality: bool,
    follow_links: bool,
    message_syntax: MessageSyntax,
) -> Result<()> {
    // Ensure source locale is provided
    let source_locale = source_locale.context("--source-locale is required for verify command")?;

    // Expand glob patterns to actual file paths
    let mut expanded_files = Vec::new();
    for pattern in translation_files {
        let pattern_str = pattern
            .to_str()
            .context("Pattern path contains invalid UTF-8")?;

        let base_dir = crate::extract::extract_base_dir(pattern_str);
        if base_dir.exists() {
            for entry in WalkDir::new(&base_dir)
                .follow_links(follow_links)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if entry.path().is_file() {
                    let path_str = entry.path().to_string_lossy();
                    if fast_glob::glob_match(pattern_str, path_str.as_ref()) {
                        expanded_files.push(entry.path().to_path_buf());
                    }
                }
            }
        }
    }

    // Load all translation files
    let mut locales: HashMap<String, Value> = HashMap::new();

    let files_to_load: Vec<_> = expanded_files
        .iter()
        .enumerate()
        .filter(|(_, file)| !should_ignore(file, ignore))
        .map(|(index, file)| Ok((index, file.clone(), extract_locale_from_path(file)?)))
        .collect::<Result<_>>()?;

    let mut loaded_files: Vec<_> = files_to_load
        .par_iter()
        .map(|(index, file, locale)| {
            let result = (|| -> Result<_> {
                let content = std::fs::read_to_string(file)
                    .with_context(|| format!("Failed to read file: {}", file.display()))?;

                serde_json::from_str(&content)
                    .with_context(|| format!("Failed to parse JSON in file: {}", file.display()))
            })();

            (*index, locale.clone(), result)
        })
        .collect();
    loaded_files.sort_by_key(|(index, _, _)| *index);

    for (_, locale, result) in loaded_files {
        let json = result?;
        locales.insert(locale, json);
    }

    // Verify source locale exists
    if !locales.contains_key(source_locale) {
        anyhow::bail!(" Missing source {}.json file", source_locale);
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
        let passed = match message_syntax {
            MessageSyntax::Icu => check_structural_equality(&locales, source_locale),
            MessageSyntax::JavaPrintf | MessageSyntax::ApplePrintf => {
                let issues = match message_syntax {
                    MessageSyntax::JavaPrintf => {
                        crate::java_printf::verify_catalogs(&locales, source_locale)?
                    }
                    MessageSyntax::ApplePrintf => {
                        crate::apple_printf::verify_catalogs(&locales, source_locale)?
                    }
                    MessageSyntax::Icu => unreachable!(),
                };
                for issue in &issues {
                    eprintln!("{}: {}: {}", issue.locale, issue.message_id, issue.error);
                }
                issues.is_empty()
            }
        };
        if !passed {
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
    ignore_patterns
        .iter()
        .any(|pattern| fast_glob::glob_match(pattern, file_str.as_ref()))
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
        let mut missing: Vec<_> = source_key_set.difference(&target_key_set).collect();

        // Sort missing keys: parent keys before nested keys (shorter keys first, then alphabetically)
        missing.sort_by(|a, b| {
            let a_len = a.len();
            let b_len = b.len();
            a_len.cmp(&b_len).then_with(|| a.cmp(b))
        });

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
        let mut errors: Vec<_> = source_messages
            .par_iter()
            .filter_map(|(key, source_msg)| {
                // Skip if key doesn't exist in target (that's covered by missing keys check)
                let target_msg = target_messages.get(key)?;

                // Parse both messages and compare structure with message ID as context
                match compare_message_structure(source_msg, target_msg, Some(key)) {
                    Ok((true, _)) => None,
                    Ok((false, Some(detail))) => Some((key.clone(), format_error_message(&detail))),
                    Ok((false, None)) => Some((
                        key.clone(),
                        "Messages are structurally different".to_string(),
                    )),
                    Err(e) => {
                        // Extract parse error code from error message
                        let error_msg = format!("{:#}", e); // Use alternate display to get root cause
                        // Check if the error message contains a parse error code
                        let formatted_error = if error_msg.contains("EXPECT_ARGUMENT_CLOSING_BRACE")
                        {
                            "EXPECT_ARGUMENT_CLOSING_BRACE".to_string()
                        } else if let Some(code) = extract_parse_error_code(&error_msg) {
                            code
                        } else {
                            format_error_message(&error_msg)
                        };
                        Some((key.clone(), formatted_error))
                    }
                }
            })
            .collect();

        if !errors.is_empty() {
            all_passed = false;
            eprintln!("---------------------------------");
            eprintln!(
                "These translation keys for locale {} are structurally different from {}:",
                locale, source_locale
            );
            // Sort errors by key (numeric if possible, otherwise lexicographic)
            errors.sort_by(|a, b| {
                // Try to parse as numbers first
                match (a.0.parse::<i32>(), b.0.parse::<i32>()) {
                    (Ok(a_num), Ok(b_num)) => a_num.cmp(&b_num),
                    _ => a.0.cmp(&b.0),
                }
            });
            for (key, error) in errors {
                eprintln!("{}: {}", key, error);
            }
            eprintln!();
        }
    }

    all_passed
}

/// Extract parse error code from error message
/// Returns the error code if found (e.g., "EXPECT_ARGUMENT_CLOSING_BRACE")
fn extract_parse_error_code(msg: &str) -> Option<String> {
    // List of known parse error codes
    let error_codes = [
        "EXPECT_ARGUMENT_CLOSING_BRACE",
        "EMPTY_ARGUMENT",
        "MALFORMED_ARGUMENT",
        "EXPECT_ARGUMENT_TYPE",
        "INVALID_ARGUMENT_TYPE",
        "EXPECT_SELECT_ARGUMENT_OPTIONS",
        "EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE",
        "INVALID_PLURAL_ARGUMENT_OFFSET_VALUE",
        "EXPECT_SELECT_ARGUMENT_SELECTOR",
        "EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT",
        "UNMATCHED_CLOSING_BRACE",
        "UNCLOSED_QUOTE_IN_ARGUMENT_STYLE",
    ];

    for code in &error_codes {
        if msg.contains(code) {
            return Some(code.to_string());
        }
    }

    None
}

/// Format error message to match TypeScript CLI output
fn format_error_message(msg: &str) -> String {
    // Remove quotes around variable names
    let msg = msg.replace("'", "");

    // Normalize type names to lowercase (Number -> number, Date -> date, Time -> time)
    let msg = msg.replace("Number", "number");
    let msg = msg.replace("Date", "date");
    let msg = msg.replace("Time", "time");

    // Handle "Different number of variables" messages
    // The Rust ICU parser doesn't preserve variable order, so we need to extract and sort them
    if msg.contains("Different number of variables:") {
        if let Some((_prefix, lists)) = msg.split_once("Different number of variables:") {
            if let Some((list1, rest)) = lists.split_once("] vs [") {
                let list1_str = list1.trim_start_matches(&[' ', '['][..]);
                let list2_str = rest.trim_end_matches(&[']'][..]);

                // Parse variables
                let mut vars1: Vec<&str> = list1_str.split(", ").collect();
                let mut vars2: Vec<&str> = list2_str.split(", ").collect();

                // Sort alphabetically, but move single-letter variables to the end
                // This matches the TypeScript CLI behavior where tag variables appear last
                vars1.sort_by(|a, b| {
                    let a_single = a.len() == 1;
                    let b_single = b.len() == 1;
                    match (a_single, b_single) {
                        (true, false) => std::cmp::Ordering::Greater, // a is single, move to end
                        (false, true) => std::cmp::Ordering::Less,    // b is single, move to end
                        _ => a.cmp(b), // both single or both not, sort normally
                    }
                });
                vars2.sort();

                return format!(
                    "Different number of variables: [{}] vs [{}]",
                    vars1.join(", "),
                    vars2.join(", ")
                );
            }
        }
    }

    msg
}

/// Compare the structure of two ICU MessageFormat messages
/// Returns Ok((true, None)) if structures match, Ok((false, Some(detail))) if they don't, Err if parsing fails
fn compare_message_structure(
    source: &str,
    target: &str,
    message_id: Option<&str>,
) -> Result<(bool, Option<String>)> {
    use formatjs_icu_messageformat_parser::{Parser, ParserOptions, is_structurally_same};

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

    // Compare AST structures with message ID as context
    let context = message_id.unwrap_or("unknown");
    match is_structurally_same(&source_ast, &target_ast, context.to_string()) {
        Ok(()) => Ok((true, None)),
        Err(e) => Ok((false, Some(e.to_string()))),
    }
}
