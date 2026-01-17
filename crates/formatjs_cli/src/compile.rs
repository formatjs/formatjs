use anyhow::{Context, Result};
use glob::glob;
use serde_json::{Map, Value, json};
use std::collections::BTreeMap;
use std::path::PathBuf;

use crate::formatters::Formatter;

/// Pseudo-locale variants for testing and expanding translations
#[derive(Clone, Copy, Debug)]
pub enum PseudoLocale {
    /// Expansion pseudo-locale
    XxLs,
    /// Accented pseudo-locale
    XxAc,
    /// HTML accented pseudo-locale
    XxHa,
    /// English expansion (west-to-east)
    EnXa,
    /// English expansion (east-to-west)
    EnXb,
}

/// Compile extracted translation files into react-intl consumable JSON.
///
/// This command reads translation JSON files, validates them as ICU MessageFormat messages,
/// and compiles them into a format suitable for react-intl. Optionally compiles to AST
/// representation and can generate pseudo-locales for testing.
///
/// # Arguments
///
/// * `translation_files` - Glob patterns for translation files (e.g., `foo/**/en.json`)
/// * `format` - Optional formatter to convert input to `Record<string, string>`
/// * `out_file` - Optional output file path (prints to stdout if not provided)
/// * `ast` - Whether to compile to AST instead of strings
/// * `skip_errors` - Whether to continue compiling after errors (excludes keys with errors from output)
/// * `pseudo_locale` - Optional pseudo-locale to generate for testing (requires `ast` to be true)
/// * `ignore_tag` - Whether to treat HTML/XML tags as string literals instead of parsing them
///
/// # Pseudo-Locales
///
/// * `XxLs` - Expansion pseudo-locale (adds ~30% length for layout testing)
/// * `XxAc` - Accented pseudo-locale (adds diacritics: à, é, ñ, etc.)
/// * `XxHa` - HTML-safe accented pseudo-locale
/// * `EnXa` - English expansion west-to-east
/// * `EnXb` - English expansion east-to-west
///
/// # Example
///
/// ```no_run
/// # use std::path::PathBuf;
/// # use formatjs_cli::compile::{compile, PseudoLocale};
/// let files = vec![PathBuf::from("lang/*.json")];
/// compile(
///     &files,
///     None,
///     Some(&PathBuf::from("compiled.json")),
///     true,
///     false,
///     Some(PseudoLocale::EnXa),
///     false,
/// ).unwrap();
/// ```
#[allow(clippy::too_many_arguments)]
pub fn compile(
    translation_files: &[PathBuf],
    format: Option<Formatter>,
    out_file: Option<&PathBuf>,
    ast: bool,
    skip_errors: bool,
    pseudo_locale: Option<PseudoLocale>,
    ignore_tag: bool,
) -> Result<()> {
    use formatjs_icu_messageformat_parser::{Parser, ParserOptions};

    // Validate pseudo-locale requires ast
    if pseudo_locale.is_some() && !ast {
        anyhow::bail!("Pseudo-locale generation requires --ast flag");
    }

    // Warn about unimplemented features
    if pseudo_locale.is_some() {
        eprintln!("Warning: Pseudo-locale transformations not yet implemented");
    }

    // Default to "default" formatter if none provided (matches TypeScript CLI)
    let formatter = format.unwrap_or(Formatter::Default);

    // Step 1: Expand glob patterns to actual file paths
    let mut expanded_files = Vec::new();
    for pattern in translation_files {
        let pattern_str = pattern
            .to_str()
            .context("Pattern path contains invalid UTF-8")?;

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
                eprintln!("Warning: Invalid glob pattern '{}': {}", pattern_str, e);
                expanded_files.push(pattern.clone());
            }
        }
    }

    if expanded_files.is_empty() {
        anyhow::bail!("No translation files found matching the patterns");
    }

    // Step 2: Load and aggregate all messages from files
    // Store both message and source file for better error reporting
    let mut messages: BTreeMap<String, (String, PathBuf)> = BTreeMap::new();

    for file in &expanded_files {
        let content = std::fs::read_to_string(file)
            .with_context(|| format!("Failed to read file: {}", file.display()))?;

        let json: Value = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse JSON in file: {}", file.display()))?;

        // Apply formatter to extract messages
        let file_path_str = file.to_str().unwrap_or("<invalid path>");
        let file_messages = formatter.apply(&json, file_path_str)?;

        // Merge messages, checking for conflicts
        // Convert to BTreeMap for sorted iteration
        for (key, message_str) in file_messages {
            // Check for conflicts - same ID with different message
            if let Some((existing, existing_file)) = messages.get(&key) {
                if existing != &message_str {
                    anyhow::bail!(
                        "Conflicting ID \"{}\" with different translation found in these 2 files:\n  {}\n  {}",
                        key,
                        existing_file.display(),
                        file.display()
                    );
                }
            }
            messages.insert(key, (message_str, file.clone()));
        }
    }

    if messages.is_empty() {
        eprintln!("Warning: No messages found in translation files");
    }

    // Step 3: Parse and validate ICU MessageFormat, compile to output format
    let mut compiled_messages: Map<String, Value> = Map::new();
    let mut error_count = 0;

    let parser_options = ParserOptions {
        ignore_tag,
        should_parse_skeletons: true,
        requires_other_clause: true,
        ..Default::default()
    };

    for (id, (message, source_file)) in &messages {
        let parser = Parser::new(message.as_str(), parser_options.clone());
        match parser.parse() {
            Ok(msg_ast) => {
                // TODO: Apply pseudo-locale transformations to AST if specified
                // This would modify literal elements in the AST

                if ast {
                    // Serialize AST to JSON for output
                    let ast_json = serde_json::to_value(&msg_ast)
                        .with_context(|| format!("Failed to serialize AST for message '{}'", id))?;
                    compiled_messages.insert(id.clone(), ast_json);
                } else {
                    // Keep as validated string
                    compiled_messages.insert(id.clone(), json!(message));
                }
            }
            Err(e) => {
                error_count += 1;
                if skip_errors {
                    eprintln!(
                        "[@formatjs/cli] [WARN] Error validating message \"{}\" with ID \"{}\" in file {}",
                        message,
                        id,
                        source_file.display()
                    );
                } else {
                    // Match TypeScript error format: "SyntaxError: ERROR_KIND"
                    anyhow::bail!("SyntaxError: {}", e);
                }
            }
        }
    }

    if error_count > 0 {
        eprintln!("\nSkipped {} message(s) with parsing errors", error_count);
    }

    // Step 4: Serialize and write output
    let output_json = Value::Object(compiled_messages);
    let output = serde_json::to_string_pretty(&output_json)
        .context("Failed to serialize compiled messages to JSON")?;

    if let Some(out_path) = out_file {
        // Create parent directories if they don't exist
        if let Some(parent) = out_path.parent() {
            std::fs::create_dir_all(parent).with_context(|| {
                format!(
                    "Failed to create parent directories for {}",
                    out_path.display()
                )
            })?;
        }
        // Write to file with trailing newline
        std::fs::write(out_path, format!("{}\n", output))
            .with_context(|| format!("Failed to write output to {}", out_path.display()))?;
        // Silently succeed (matches TypeScript CLI behavior)
    } else {
        // Print to stdout (no trailing newline for piping)
        println!("{}", output);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_compile_simple_messages() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        // Write input file with simple string format (for Simple formatter)
        fs::write(
            &input_file,
            json!({
                "greeting": "Hello {name}!",
                "farewell": "Goodbye!"
            })
            .to_string(),
        )
        .unwrap();

        // Compile with Simple formatter explicitly (accepts simple strings)
        compile(
            &[input_file],
            Some(Formatter::Simple),
            Some(&output_file),
            false, // not AST
            false, // don't skip errors
            None,  // no pseudo-locale
            false, // don't ignore tags
        )
        .unwrap();

        // Verify output
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        assert_eq!(output_json["greeting"], "Hello {name}!");
        assert_eq!(output_json["farewell"], "Goodbye!");
    }

    #[test]
    fn test_compile_with_default_formatter() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        // Write input file with MessageDescriptor format
        fs::write(
            &input_file,
            json!({
                "greeting": {
                    "defaultMessage": "Hello {name}!",
                    "description": "Greeting message"
                }
            })
            .to_string(),
        )
        .unwrap();

        // Compile with default formatter
        compile(
            &[input_file],
            Some(Formatter::Default),
            Some(&output_file),
            false,
            false,
            None,
            false,
        )
        .unwrap();

        // Verify output
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        assert_eq!(output_json["greeting"], "Hello {name}!");
    }

    #[test]
    fn test_compile_to_ast() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        // Write input file with message descriptor format
        fs::write(
            &input_file,
            json!({
                "greeting": {
                    "defaultMessage": "Hello {name}!"
                }
            })
            .to_string(),
        )
        .unwrap();

        // Compile to AST
        compile(
            &[input_file],
            None,
            Some(&output_file),
            true, // AST output
            false,
            None,
            false,
        )
        .unwrap();

        // Verify output is AST
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        // AST should be an array
        assert!(output_json["greeting"].is_array());
    }

    #[test]
    fn test_compile_invalid_icu_message() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        // Write input file with invalid ICU syntax
        fs::write(
            &input_file,
            json!({
                "invalid": {
                    "defaultMessage": "Hello {name"  // Missing closing brace
                }
            })
            .to_string(),
        )
        .unwrap();

        // Should fail without skip_errors
        let result = compile(
            &[input_file.clone()],
            None,
            Some(&output_file),
            false,
            false, // don't skip errors
            None,
            false,
        );

        assert!(result.is_err());
    }

    #[test]
    fn test_compile_skip_errors() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        // Write input file with one valid and one invalid message
        fs::write(
            &input_file,
            json!({
                "valid": {
                    "defaultMessage": "Hello {name}!"
                },
                "invalid": {
                    "defaultMessage": "Hello {name"  // Missing closing brace
                }
            })
            .to_string(),
        )
        .unwrap();

        // Should succeed with skip_errors
        compile(
            &[input_file],
            None,
            Some(&output_file),
            false,
            true, // skip errors
            None,
            false,
        )
        .unwrap();

        // Verify only valid message is in output
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        assert_eq!(output_json["valid"], "Hello {name}!");
        assert!(output_json.get("invalid").is_none());
    }

    #[test]
    fn test_compile_multiple_files() {
        let dir = tempdir().unwrap();
        let input_file1 = dir.path().join("messages1.json");
        let input_file2 = dir.path().join("messages2.json");
        let output_file = dir.path().join("compiled.json");

        // Write input files with message descriptor format
        fs::write(
            &input_file1,
            json!({"greeting": {"defaultMessage": "Hello!"}}).to_string(),
        )
        .unwrap();
        fs::write(
            &input_file2,
            json!({"farewell": {"defaultMessage": "Goodbye!"}}).to_string(),
        )
        .unwrap();

        // Compile
        compile(
            &[input_file1, input_file2],
            None,
            Some(&output_file),
            false,
            false,
            None,
            false,
        )
        .unwrap();

        // Verify output contains both messages
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        assert_eq!(output_json["greeting"], "Hello!");
        assert_eq!(output_json["farewell"], "Goodbye!");
    }

    #[test]
    fn test_compile_conflict_detection() {
        let dir = tempdir().unwrap();
        let input_file1 = dir.path().join("messages1.json");
        let input_file2 = dir.path().join("messages2.json");
        let output_file = dir.path().join("compiled.json");

        // Write input files with conflicting message IDs (different defaultMessage values)
        fs::write(
            &input_file1,
            json!({"greeting": {"defaultMessage": "Hello!"}}).to_string(),
        )
        .unwrap();
        fs::write(
            &input_file2,
            json!({"greeting": {"defaultMessage": "Bonjour!"}}).to_string(),
        )
        .unwrap();

        // Should fail due to conflict
        let result = compile(
            &[input_file1, input_file2],
            None,
            Some(&output_file),
            false,
            false,
            None,
            false,
        );

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Conflict"));
    }

    #[test]
    fn test_compile_with_glob_pattern() {
        let dir = tempdir().unwrap();

        // Create multiple JSON files with message descriptor format
        fs::write(
            dir.path().join("en.json"),
            json!({"greeting": {"defaultMessage": "Hello!"}}).to_string(),
        )
        .unwrap();
        fs::write(
            dir.path().join("fr.json"),
            json!({"farewell": {"defaultMessage": "Au revoir!"}}).to_string(),
        )
        .unwrap();

        let output_file = dir.path().join("compiled.json");
        let pattern = dir.path().join("*.json");

        // Compile using glob pattern
        compile(
            &[pattern],
            None,
            Some(&output_file),
            false,
            false,
            None,
            false,
        )
        .unwrap();

        // Verify output contains messages from both files
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        assert_eq!(output_json["greeting"], "Hello!");
        assert_eq!(output_json["farewell"], "Au revoir!");
    }

    #[test]
    fn test_compile_icu_plural() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        // Write input file with ICU plural
        fs::write(
            &input_file,
            json!({
                "items": {
                    "defaultMessage": "{count, plural, one {# item} other {# items}}"
                }
            })
            .to_string(),
        )
        .unwrap();

        // Compile
        compile(
            &[input_file],
            None,
            Some(&output_file),
            false,
            false,
            None,
            false,
        )
        .unwrap();

        // Verify output
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        assert_eq!(
            output_json["items"],
            "{count, plural, one {# item} other {# items}}"
        );
    }

    #[test]
    fn test_compile_with_transifex_formatter() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        // Write input file in Transifex format
        fs::write(
            &input_file,
            json!({
                "greeting": {
                    "string": "Hello {name}!",
                    "developer_comment": "Greeting"
                }
            })
            .to_string(),
        )
        .unwrap();

        // Compile with Transifex formatter
        compile(
            &[input_file],
            Some(Formatter::Transifex),
            Some(&output_file),
            false,
            false,
            None,
            false,
        )
        .unwrap();

        // Verify output
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        assert_eq!(output_json["greeting"], "Hello {name}!");
    }

    #[test]
    fn test_compile_pseudo_locale_requires_ast() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        fs::write(&input_file, json!({"msg": "Hello!"}).to_string()).unwrap();

        // Should fail when pseudo_locale is specified without ast
        let result = compile(
            &[input_file],
            None,
            Some(&output_file),
            false, // not AST
            false,
            Some(PseudoLocale::EnXa), // pseudo-locale specified
            false,
        );

        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("requires --ast flag")
        );
    }

    #[test]
    fn test_compile_sorted_keys() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        // Write input file with messages in unsorted order
        fs::write(
            &input_file,
            json!({
                "zebra": {
                    "defaultMessage": "Zebra message"
                },
                "apple": {
                    "defaultMessage": "Apple message"
                },
                "mango": {
                    "defaultMessage": "Mango message"
                },
                "banana": {
                    "defaultMessage": "Banana message"
                }
            })
            .to_string(),
        )
        .unwrap();

        // Compile
        compile(
            &[input_file],
            None,
            Some(&output_file),
            false,
            false,
            None,
            false,
        )
        .unwrap();

        // Verify output has sorted keys
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        // Get the keys and verify they are sorted
        let keys: Vec<&str> = output_json
            .as_object()
            .unwrap()
            .keys()
            .map(|s| s.as_str())
            .collect();
        let mut sorted_keys = keys.clone();
        sorted_keys.sort();

        // Keys should be in alphabetical order
        assert_eq!(keys, sorted_keys, "Keys should be sorted alphabetically");
        assert_eq!(keys, vec!["apple", "banana", "mango", "zebra"]);
    }

    #[test]
    fn test_compile_sorted_keys_multiple_files() {
        let dir = tempdir().unwrap();
        let input_file1 = dir.path().join("messages1.json");
        let input_file2 = dir.path().join("messages2.json");
        let output_file = dir.path().join("compiled.json");

        // Write input files with messages that would be unsorted when merged
        fs::write(
            &input_file1,
            json!({
                "zebra": {"defaultMessage": "Zebra!"},
                "delta": {"defaultMessage": "Delta!"}
            })
            .to_string(),
        )
        .unwrap();
        fs::write(
            &input_file2,
            json!({
                "alpha": {"defaultMessage": "Alpha!"},
                "charlie": {"defaultMessage": "Charlie!"}
            })
            .to_string(),
        )
        .unwrap();

        // Compile
        compile(
            &[input_file1, input_file2],
            None,
            Some(&output_file),
            false,
            false,
            None,
            false,
        )
        .unwrap();

        // Verify output contains sorted keys from both files
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        // Get the keys and verify they are sorted
        let keys: Vec<&str> = output_json
            .as_object()
            .unwrap()
            .keys()
            .map(|s| s.as_str())
            .collect();

        assert_eq!(keys, vec!["alpha", "charlie", "delta", "zebra"]);
    }

    #[test]
    fn test_compile_sorted_keys_with_ast() {
        let dir = tempdir().unwrap();
        let input_file = dir.path().join("messages.json");
        let output_file = dir.path().join("compiled.json");

        // Write input file with messages in unsorted order
        fs::write(
            &input_file,
            json!({
                "zulu": {
                    "defaultMessage": "Zulu {name}!"
                },
                "bravo": {
                    "defaultMessage": "Bravo {count}!"
                }
            })
            .to_string(),
        )
        .unwrap();

        // Compile to AST
        compile(
            &[input_file],
            None,
            Some(&output_file),
            true, // AST output
            false,
            None,
            false,
        )
        .unwrap();

        // Verify output has sorted keys
        let output_content = fs::read_to_string(&output_file).unwrap();
        let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        // Get the keys and verify they are sorted
        let keys: Vec<&str> = output_json
            .as_object()
            .unwrap()
            .keys()
            .map(|s| s.as_str())
            .collect();

        // Keys should be in alphabetical order even with AST output
        assert_eq!(keys, vec!["bravo", "zulu"]);
    }
}
