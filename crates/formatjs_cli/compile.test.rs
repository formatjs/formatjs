use formatjs_cli::compile::*;
use formatjs_cli::formatters::Formatter;
use serde_json::{Value, json};
use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;
use tempfile::tempdir;

fn compile_message_to_ast(message: &str, pseudo_locale: PseudoLocale) -> Value {
    let mut messages = BTreeMap::new();
    messages.insert(
        "msg".to_string(),
        (message.to_string(), PathBuf::from("messages.json")),
    );

    let output =
        compile_messages_to_string(messages, true, false, Some(pseudo_locale), false).unwrap();

    serde_json::from_str::<Value>(&output).unwrap()["msg"].clone()
}

fn collect_literal_values(value: &Value, values: &mut Vec<String>) {
    match value {
        Value::Array(elements) => {
            for element in elements {
                collect_literal_values(element, values);
            }
        }
        Value::Object(map) => {
            if map.get("type").and_then(Value::as_u64) == Some(0) {
                values.push(
                    map.get("value")
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_string(),
                );
            }

            if let Some(children) = map.get("children") {
                collect_literal_values(children, values);
            }

            if let Some(options) = map.get("options").and_then(Value::as_object) {
                for option in options.values() {
                    if let Some(value) = option.get("value") {
                        collect_literal_values(value, values);
                    }
                }
            }
        }
        _ => {}
    }
}

fn literal_values(value: &Value) -> Vec<String> {
    let mut values = Vec::new();
    collect_literal_values(value, &mut values);
    values
}

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
        true,  // follow links
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
        true, // follow links
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
        true, // follow links
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
        true, // follow links
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
        true, // follow links
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
        true, // follow links
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
        true, // follow links
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
        true, // follow links
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
        true, // follow links
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
        true, // follow links
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
        true, // follow links
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
fn test_compile_pseudo_locale_transforms_literal_elements() {
    let ast = compile_message_to_ast(
        "foo {bar, plural, one {<b>a dog</b>} other {many dogs}}",
        PseudoLocale::XxAc,
    );

    assert_eq!(
        literal_values(&ast),
        vec![
            "FOO ".to_string(),
            "A DOG".to_string(),
            "MANY DOGS".to_string()
        ]
    );
}

#[test]
fn test_compile_pseudo_locale_top_level_insertions() {
    let xx_ls = compile_message_to_ast("my name is {name}", PseudoLocale::XxLs);
    assert_eq!(
        literal_values(&xx_ls),
        vec![
            "my name is ".to_string(),
            "SSSSSSSSSSSSSSSSSSSSSSSSS".to_string()
        ]
    );

    let xx_ha = compile_message_to_ast("{name} has help", PseudoLocale::XxHa);
    assert_eq!(
        literal_values(&xx_ha),
        vec!["[javascript]".to_string(), " has help".to_string()]
    );
}

#[test]
fn test_compile_pseudo_locale_en_xa_and_en_xb_wrappers() {
    let en_xa_values = literal_values(&compile_message_to_ast(
        "my name is {name}",
        PseudoLocale::EnXa,
    ));
    assert_eq!(en_xa_values.first().unwrap(), "[");
    assert_eq!(en_xa_values.last().unwrap(), "]");
    assert_ne!(en_xa_values[1], "my name is ");
    assert!(en_xa_values[1].contains('\u{1e3f}'));

    let en_xb_values = literal_values(&compile_message_to_ast(
        "my name is {name}",
        PseudoLocale::EnXb,
    ));
    assert_eq!(en_xb_values.first().unwrap(), "\u{202e}");
    assert_eq!(en_xb_values.last().unwrap(), "\u{202c}");
    assert_ne!(en_xb_values[1], "my name is ");
    assert!(en_xb_values[1].contains('\u{026f}'));
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
        true, // follow links
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
        true, // follow links
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
        true, // follow links
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

#[test]
fn test_compile_with_crowdin_formatter() {
    let dir = tempdir().unwrap();
    let input_file = dir.path().join("messages.json");
    let output_file = dir.path().join("compiled.json");

    // Write input file in Crowdin format: { id: { message, description } }
    fs::write(
        &input_file,
        json!({
            "greeting": {
                "message": "Hello {name}!",
                "description": "Greeting message shown to users"
            },
            "farewell": {
                "message": "Goodbye {name}!",
                "description": "Farewell message"
            }
        })
        .to_string(),
    )
    .unwrap();

    // Compile with Crowdin formatter
    compile(
        &[input_file],
        Some(Formatter::Crowdin),
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    // Verify output extracts message field correctly
    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert_eq!(output_json["greeting"], "Hello {name}!");
    assert_eq!(output_json["farewell"], "Goodbye {name}!");
}

#[test]
fn test_compile_with_crowdin_formatter_icu_plural() {
    let dir = tempdir().unwrap();
    let input_file = dir.path().join("messages.json");
    let output_file = dir.path().join("compiled.json");

    // Write input file in Crowdin format with ICU plural message
    fs::write(
        &input_file,
        json!({
            "items_count": {
                "message": "{count, plural, one {# item} other {# items}}",
                "description": "Shows the number of items"
            }
        })
        .to_string(),
    )
    .unwrap();

    // Compile with Crowdin formatter
    compile(
        &[input_file],
        Some(Formatter::Crowdin),
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    // Verify output
    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert_eq!(
        output_json["items_count"],
        "{count, plural, one {# item} other {# items}}"
    );
}

#[test]
fn test_compile_with_crowdin_formatter_skips_smartling_key() {
    let dir = tempdir().unwrap();
    let input_file = dir.path().join("messages.json");
    let output_file = dir.path().join("compiled.json");

    // Write input file in Crowdin format with smartling metadata key
    // (Crowdin format should skip the "smartling" key for compatibility)
    fs::write(
        &input_file,
        json!({
            "smartling": {
                "message": "This should be skipped",
                "description": "Smartling metadata"
            },
            "greeting": {
                "message": "Hello!",
                "description": "Greeting"
            }
        })
        .to_string(),
    )
    .unwrap();

    // Compile with Crowdin formatter
    compile(
        &[input_file],
        Some(Formatter::Crowdin),
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    // Verify output skips smartling key
    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert!(output_json.get("smartling").is_none());
    assert_eq!(output_json["greeting"], "Hello!");
}

#[test]
fn test_compile_with_crowdin_formatter_to_ast() {
    let dir = tempdir().unwrap();
    let input_file = dir.path().join("messages.json");
    let output_file = dir.path().join("compiled.json");

    // Write input file in Crowdin format
    fs::write(
        &input_file,
        json!({
            "greeting": {
                "message": "Hello {name}!",
                "description": "Greeting message"
            }
        })
        .to_string(),
    )
    .unwrap();

    // Compile with Crowdin formatter to AST
    compile(
        &[input_file],
        Some(Formatter::Crowdin),
        Some(&output_file),
        true, // AST output
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    // Verify output is AST
    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    // AST should be an array
    assert!(output_json["greeting"].is_array());
    // Should contain the literal "Hello " and argument "name"
    let ast = output_json["greeting"].as_array().unwrap();
    assert!(!ast.is_empty());
}

#[test]
fn test_compile_with_crowdin_formatter_missing_message_field() {
    let dir = tempdir().unwrap();
    let input_file = dir.path().join("messages.json");
    let output_file = dir.path().join("compiled.json");

    // Write input file in Crowdin format but missing "message" field
    fs::write(
        &input_file,
        json!({
            "greeting": {
                "description": "This entry has no message field"
            }
        })
        .to_string(),
    )
    .unwrap();

    // Compile with Crowdin formatter - should succeed but skip entries without message
    compile(
        &[input_file],
        Some(Formatter::Crowdin),
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    // Verify output is empty (no messages extracted)
    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert!(output_json.as_object().unwrap().is_empty());
}

#[test]
fn test_compile_with_crowdin_formatter_multiple_files() {
    let dir = tempdir().unwrap();
    let input_file1 = dir.path().join("messages1.json");
    let input_file2 = dir.path().join("messages2.json");
    let output_file = dir.path().join("compiled.json");

    // Write input files in Crowdin format
    fs::write(
        &input_file1,
        json!({
            "greeting": {
                "message": "Hello!",
                "description": "Greeting"
            }
        })
        .to_string(),
    )
    .unwrap();
    fs::write(
        &input_file2,
        json!({
            "farewell": {
                "message": "Goodbye!",
                "description": "Farewell"
            }
        })
        .to_string(),
    )
    .unwrap();

    // Compile with Crowdin formatter
    compile(
        &[input_file1, input_file2],
        Some(Formatter::Crowdin),
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    // Verify output contains both messages
    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert_eq!(output_json["greeting"], "Hello!");
    assert_eq!(output_json["farewell"], "Goodbye!");
}

#[test]
fn test_compile_with_brace_expansion_glob() {
    let dir = tempdir().unwrap();
    let sub = dir.path().join("lang");
    fs::create_dir_all(&sub).unwrap();

    // Create .json and .jsonc files
    fs::write(
        sub.join("en.json"),
        json!({"greeting": {"defaultMessage": "Hello!"}}).to_string(),
    )
    .unwrap();
    fs::write(
        sub.join("fr.json"),
        json!({"farewell": {"defaultMessage": "Au revoir!"}}).to_string(),
    )
    .unwrap();
    fs::write(sub.join("readme.txt"), "not a json file").unwrap();

    let output_file = dir.path().join("compiled.json");
    // Use brace expansion to match only .json files
    let pattern = PathBuf::from(format!("{}/**/*.{{json}}", dir.path().display()));

    compile(
        &[pattern],
        None,
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert_eq!(output_json["greeting"], "Hello!");
    assert_eq!(output_json["farewell"], "Au revoir!");
}

#[test]
fn test_compile_with_nested_directory_glob() {
    let dir = tempdir().unwrap();

    // Create nested directories
    let nested = dir.path().join("a/b/c");
    fs::create_dir_all(&nested).unwrap();

    fs::write(
        dir.path().join("a/top.json"),
        json!({"top": {"defaultMessage": "Top level"}}).to_string(),
    )
    .unwrap();
    fs::write(
        nested.join("deep.json"),
        json!({"deep": {"defaultMessage": "Deep nested"}}).to_string(),
    )
    .unwrap();

    let output_file = dir.path().join("compiled.json");
    let pattern = PathBuf::from(format!("{}/**/*.json", dir.path().display()));

    compile(
        &[pattern],
        None,
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert_eq!(output_json["top"], "Top level");
    assert_eq!(output_json["deep"], "Deep nested");
}

#[test]
fn test_compile_with_literal_file_path() {
    // Ensure literal (non-glob) paths still work
    let dir = tempdir().unwrap();
    let input_file = dir.path().join("messages.json");
    let output_file = dir.path().join("compiled.json");

    fs::write(
        &input_file,
        json!({"msg": {"defaultMessage": "Literal path"}}).to_string(),
    )
    .unwrap();

    compile(
        &[input_file],
        None,
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert_eq!(output_json["msg"], "Literal path");
}

#[test]
fn test_compile_with_literal_file_path_containing_glob_metacharacters() {
    let dir = tempdir().unwrap();
    let subdir = dir.path().join("messages[prod]");
    fs::create_dir_all(&subdir).unwrap();

    let input_file = subdir.join("primary.json");
    let output_file = dir.path().join("compiled.json");

    fs::write(
        &input_file,
        json!({"msg": {"defaultMessage": "Literal path"}}).to_string(),
    )
    .unwrap();

    compile(
        &[input_file],
        None,
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert_eq!(output_json["msg"], "Literal path");
}

#[test]
fn test_compile_with_node_modules_glob() {
    // Regression test for #6173: glob patterns with node_modules-like structure
    let dir = tempdir().unwrap();

    // Create node_modules/some-pkg/dist/lang/en.json
    let pkg_lang = dir.path().join("node_modules/some-pkg/dist/lang");
    fs::create_dir_all(&pkg_lang).unwrap();
    fs::write(
        pkg_lang.join("en.json"),
        json!({"greeting": {"defaultMessage": "Hello from package!"}}).to_string(),
    )
    .unwrap();

    let output_file = dir.path().join("compiled.json");
    let pattern = PathBuf::from(format!(
        "{}/node_modules/**/dist/lang/en.json",
        dir.path().display()
    ));

    compile(
        &[pattern],
        None,
        Some(&output_file),
        false,
        false,
        None,
        false,
        true, // follow links
    )
    .unwrap();

    let output_content = fs::read_to_string(&output_file).unwrap();
    let output_json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

    assert_eq!(output_json["greeting"], "Hello from package!");
}
