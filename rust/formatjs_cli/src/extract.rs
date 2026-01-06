use anyhow::{Context, Result};
use glob::Pattern;
use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use crate::extractor::{MessageDescriptor, determine_source_type, extract_messages_from_source};
use crate::formatters::Formatter;
use crate::id_generator::generate_id;

/// Extract string messages from React components that use react-intl
#[allow(clippy::too_many_arguments)]
pub fn extract(
    files: &[PathBuf],
    format: Option<Formatter>,
    in_file: Option<&PathBuf>,
    out_file: Option<&PathBuf>,
    id_interpolation_pattern: &str,
    extract_source_location: bool,
    additional_component_names: &[String],
    additional_function_names: &[String],
    ignore: &[String],
    throws: bool,
    pragma: Option<&str>,
    preserve_whitespace: bool,
    flatten: bool,
) -> Result<()> {
    // Step 1: Resolve file list from glob patterns or in_file
    let file_list = if let Some(in_f) = in_file {
        read_file_list(in_f)?
    } else {
        resolve_files_from_globs(files, ignore)?
    };

    // Step 2: Extract messages from all files
    let mut all_messages: BTreeMap<String, MessageDescriptor> = BTreeMap::new();
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let component_names = build_component_names(additional_component_names);
    let function_names = build_function_names(additional_function_names);

    for file_path in &file_list {
        match extract_from_file(
            file_path,
            extract_source_location,
            &component_names,
            &function_names,
            pragma,
            preserve_whitespace,
            flatten,
            throws,
        ) {
            Ok(messages) => {
                for mut msg in messages {
                    // Generate ID if not present
                    let id = if let Some(id) = msg.id.clone() {
                        id
                    } else {
                        generate_id(
                            id_interpolation_pattern,
                            msg.default_message.as_deref(),
                            &msg.description,
                            file_path.to_str(),
                        )?
                    };

                    msg.id = Some(id.clone());

                    // Check for duplicate IDs with different messages
                    if let Some(existing) = all_messages.get(&id) {
                        if existing.default_message != msg.default_message {
                            let warning = format!("Duplicate message id: \"{}\"", id);
                            if throws {
                                anyhow::bail!(warning);
                            }
                            eprintln!("{}", warning);
                            warnings.push(warning);
                        }
                    }

                    all_messages.insert(id, msg);
                }
            }
            Err(e) => {
                let err_msg = format!("Error in {}: {}", file_path.display(), e);
                if throws {
                    anyhow::bail!(err_msg);
                }
                eprintln!("{}", err_msg);
                errors.push(err_msg);
            }
        }
    }

    // Step 3: Apply formatter if specified
    let output = if let Some(formatter) = format {
        // Apply formatter (returns HashMap<String, String>)
        let formatted = formatter.format(&all_messages, "extracted messages")?;

        // Convert HashMap to BTreeMap for sorted output
        let sorted_formatted: BTreeMap<String, String> = formatted.into_iter().collect();

        // Convert to JSON output
        serde_json::to_string_pretty(&sorted_formatted)?
    } else {
        // Default format: full MessageDescriptor objects (already sorted via BTreeMap)
        serde_json::to_string_pretty(&all_messages)?
    };

    // Step 4: Write output
    if let Some(out_f) = out_file {
        // Create parent directories if they don't exist
        if let Some(parent) = out_f.parent() {
            fs::create_dir_all(parent).with_context(|| {
                format!(
                    "Failed to create parent directories for {}",
                    out_f.display()
                )
            })?;
        }
        fs::write(out_f, output + "\n")
            .with_context(|| format!("Failed to write output to {}", out_f.display()))?;
    } else {
        io::stdout()
            .write_all(output.as_bytes())
            .context("Failed to write output to stdout")?;
    }

    if !errors.is_empty() && throws {
        anyhow::bail!("Extraction completed with {} errors", errors.len());
    }

    Ok(())
}

/// Read file list from a file (one path per line)
fn read_file_list(path: &Path) -> Result<Vec<PathBuf>> {
    let content = fs::read_to_string(path)
        .with_context(|| format!("Failed to read file list from {}", path.display()))?;

    Ok(content
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(PathBuf::from)
        .collect())
}

/// Resolve files from glob patterns, excluding ignore patterns
fn resolve_files_from_globs(globs: &[PathBuf], ignore: &[String]) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    let ignore_patterns: Vec<Pattern> = ignore
        .iter()
        .map(|p| Pattern::new(p))
        .collect::<Result<Vec<_>, _>>()
        .context("Invalid ignore pattern")?;

    for glob_path in globs {
        let glob_str = glob_path
            .to_str()
            .context("Invalid UTF-8 in glob pattern")?;

        let entries =
            glob::glob(glob_str).with_context(|| format!("Invalid glob pattern: {}", glob_str))?;

        for entry in entries {
            let path = entry.context("Failed to read glob entry")?;

            // Skip if matches ignore pattern
            if should_ignore(&path, &ignore_patterns) {
                continue;
            }

            // Only process supported file types
            if is_supported_file(&path) {
                files.push(path);
            }
        }
    }

    Ok(files)
}

/// Check if a path should be ignored
fn should_ignore(path: &Path, patterns: &[Pattern]) -> bool {
    let path_str = path.to_string_lossy();
    patterns.iter().any(|p| p.matches(&path_str))
}

/// Check if file has supported extension
fn is_supported_file(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        matches!(
            ext.to_string_lossy().as_ref(),
            "ts" | "tsx" | "js" | "jsx" | "mjs" | "cjs"
        )
    } else {
        false
    }
}

/// Build list of component names to search for
fn build_component_names(additional: &[String]) -> Vec<String> {
    let mut names = vec!["FormattedMessage".to_string()];
    names.extend_from_slice(additional);
    names
}

/// Build list of function names to search for
fn build_function_names(additional: &[String]) -> Vec<String> {
    let mut names = vec![
        "defineMessages".to_string(),
        "defineMessage".to_string(),
        "formatMessage".to_string(),
    ];
    names.extend_from_slice(additional);
    names
}

/// Extract messages from a single file
fn extract_from_file(
    path: &Path,
    extract_source_location: bool,
    component_names: &[String],
    function_names: &[String],
    pragma: Option<&str>,
    preserve_whitespace: bool,
    flatten: bool,
    throws: bool,
) -> Result<Vec<MessageDescriptor>> {
    let source_text = fs::read_to_string(path)
        .with_context(|| format!("Failed to read file {}", path.display()))?;

    // Parse pragma metadata if specified
    let pragma_meta = if let Some(pragma_str) = pragma {
        extract_pragma(&source_text, pragma_str)
    } else {
        HashMap::new()
    };

    // Determine source type from extension
    let source_type = determine_source_type(path)?;

    // Use the extractor module to parse and extract messages
    extract_messages_from_source(
        &source_text,
        path,
        source_type,
        extract_source_location,
        component_names,
        function_names,
        pragma_meta,
        preserve_whitespace,
        flatten,
        throws,
    )
}

/// Parse pragma metadata from source comments
fn extract_pragma(source: &str, pragma: &str) -> HashMap<String, String> {
    let mut meta = HashMap::new();
    let pragma_pattern = format!("// {}", pragma);

    for line in source.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix(&pragma_pattern) {
            // Parse key:value pairs
            for pair in rest.split_whitespace() {
                if let Some((key, value)) = pair.split_once(':') {
                    meta.insert(key.to_string(), value.to_string());
                }
            }
        }
    }

    meta
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;

    #[test]
    fn test_read_file_list() {
        let mut temp_file = NamedTempFile::new().unwrap();
        use std::io::Write;
        writeln!(temp_file, "file1.ts").unwrap();
        writeln!(temp_file, "file2.tsx").unwrap();
        writeln!(temp_file, "").unwrap(); // Empty line
        writeln!(temp_file, "file3.js").unwrap();

        let result = read_file_list(temp_file.path()).unwrap();
        assert_eq!(result.len(), 3);
        assert_eq!(result[0], PathBuf::from("file1.ts"));
        assert_eq!(result[1], PathBuf::from("file2.tsx"));
        assert_eq!(result[2], PathBuf::from("file3.js"));
    }

    #[test]
    fn test_is_supported_file() {
        assert!(is_supported_file(&PathBuf::from("test.ts")));
        assert!(is_supported_file(&PathBuf::from("test.tsx")));
        assert!(is_supported_file(&PathBuf::from("test.js")));
        assert!(is_supported_file(&PathBuf::from("test.jsx")));
        assert!(is_supported_file(&PathBuf::from("test.mjs")));
        assert!(is_supported_file(&PathBuf::from("test.cjs")));
        assert!(!is_supported_file(&PathBuf::from("test.py")));
        assert!(!is_supported_file(&PathBuf::from("test.txt")));
    }

    #[test]
    fn test_build_component_names() {
        let additional = vec!["CustomMessage".to_string(), "T".to_string()];
        let names = build_component_names(&additional);
        assert_eq!(names.len(), 3);
        assert_eq!(names[0], "FormattedMessage");
        assert_eq!(names[1], "CustomMessage");
        assert_eq!(names[2], "T");
    }

    #[test]
    fn test_build_function_names() {
        let additional = vec!["$t".to_string()];
        let names = build_function_names(&additional);
        assert_eq!(names.len(), 4);
        assert!(names.contains(&"defineMessages".to_string()));
        assert!(names.contains(&"defineMessage".to_string()));
        assert!(names.contains(&"formatMessage".to_string()));
        assert!(names.contains(&"$t".to_string()));
    }

    #[test]
    fn test_extract_pragma() {
        let source = r#"
// @formatjs project:my-app locale:en-US
import { FormattedMessage } from 'react-intl';
// @formatjs region:header
"#;

        let meta = extract_pragma(source, "@formatjs");
        assert_eq!(meta.len(), 3);
        assert_eq!(meta.get("project"), Some(&"my-app".to_string()));
        assert_eq!(meta.get("locale"), Some(&"en-US".to_string()));
        assert_eq!(meta.get("region"), Some(&"header".to_string()));
    }

    #[test]
    fn test_should_ignore() {
        let patterns = vec![
            Pattern::new("**/node_modules/**").unwrap(),
            Pattern::new("**/*.test.ts").unwrap(),
        ];

        assert!(should_ignore(
            &PathBuf::from("src/node_modules/foo.ts"),
            &patterns
        ));
        assert!(should_ignore(&PathBuf::from("src/app.test.ts"), &patterns));
        assert!(!should_ignore(&PathBuf::from("src/app.ts"), &patterns));
    }

    #[test]
    fn test_extract_sorted_keys() {
        // Create a temporary test file with multiple messages in unsorted order
        let temp_dir = tempfile::tempdir().unwrap();
        let test_file = temp_dir.path().join("test.tsx");
        let output_file = temp_dir.path().join("output.json");

        // Write test file with messages that would naturally be in unsorted order
        let test_content = r#"
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  zebra: {
    id: 'zebra',
    defaultMessage: 'Zebra message',
  },
  apple: {
    id: 'apple',
    defaultMessage: 'Apple message',
  },
  mango: {
    id: 'mango',
    defaultMessage: 'Mango message',
  },
  banana: {
    id: 'banana',
    defaultMessage: 'Banana message',
  },
});
"#;
        std::fs::write(&test_file, test_content).unwrap();

        // Extract messages
        extract(
            &[test_file],
            None,
            None,
            Some(&output_file),
            "[sha512:contenthash:base64:6]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        // Read the output file and verify exact content
        let output_content = std::fs::read_to_string(&output_file).unwrap();

        // Verify the entire output matches expected sorted JSON with newline
        let expected = r#"{
  "apple": {
    "id": "apple",
    "defaultMessage": "Apple message"
  },
  "banana": {
    "id": "banana",
    "defaultMessage": "Banana message"
  },
  "mango": {
    "id": "mango",
    "defaultMessage": "Mango message"
  },
  "zebra": {
    "id": "zebra",
    "defaultMessage": "Zebra message"
  }
}
"#;
        assert_eq!(
            output_content, expected,
            "Output should be sorted with trailing newline"
        );
    }

    #[test]
    fn test_extract_sorted_keys_with_default_formatter() {
        // Create a temporary test file
        let temp_dir = tempfile::tempdir().unwrap();
        let test_file = temp_dir.path().join("test.tsx");
        let output_file = temp_dir.path().join("output.json");

        // Write test file with messages in unsorted order
        let test_content = r#"
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  zulu: {
    id: 'zulu',
    defaultMessage: 'Zulu message',
  },
  alpha: {
    id: 'alpha',
    defaultMessage: 'Alpha message',
  },
  charlie: {
    id: 'charlie',
    defaultMessage: 'Charlie message',
  },
});
"#;
        std::fs::write(&test_file, test_content).unwrap();

        // Extract messages with Default formatter (extracts defaultMessage field)
        extract(
            &[test_file],
            Some(Formatter::Default),
            None,
            Some(&output_file),
            "[sha512:contenthash:base64:6]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        // Read the output file and verify exact content
        let output_content = std::fs::read_to_string(&output_file).unwrap();

        // Verify the entire output matches expected sorted JSON with newline
        let expected = r#"{
  "alpha": "Alpha message",
  "charlie": "Charlie message",
  "zulu": "Zulu message"
}
"#;
        assert_eq!(
            output_content, expected,
            "Output should be sorted with trailing newline when using formatter"
        );
    }

    #[test]
    fn test_extract_with_custom_id_interpolation_pattern() {
        // Test extraction with custom ID pattern for messages without explicit IDs
        let temp_dir = tempfile::tempdir().unwrap();
        let test_file = temp_dir.path().join("test.tsx");
        let output_file = temp_dir.path().join("output.json");

        // Write test file with messages that don't have explicit IDs
        let test_content = r#"
import { defineMessage } from 'react-intl';

const greeting = defineMessage({
  defaultMessage: 'Hello World',
});
"#;
        std::fs::write(&test_file, test_content).unwrap();

        // Extract with custom pattern: shorter ID with hex encoding
        extract(
            &[test_file],
            None,
            None,
            Some(&output_file),
            "[sha512:contenthash:hex:8]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        // Read and verify output
        let output_content = std::fs::read_to_string(&output_file).unwrap();
        let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        // Should have one message with generated ID
        assert_eq!(json.as_object().unwrap().len(), 1);

        // Get the generated ID
        let (id, message) = json.as_object().unwrap().iter().next().unwrap();

        // Verify ID is 8 characters of hex
        assert_eq!(id.len(), 8, "Generated ID should be 8 characters");
        assert!(
            id.chars().all(|c| c.is_ascii_hexdigit()),
            "Generated ID should be hexadecimal"
        );

        // Verify message content
        assert_eq!(message["defaultMessage"].as_str().unwrap(), "Hello World");
    }

    #[test]
    fn test_extract_with_different_id_patterns() {
        // Test that different patterns produce different IDs for the same message
        let temp_dir = tempfile::tempdir().unwrap();
        let test_file = temp_dir.path().join("test.tsx");

        let test_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  defaultMessage: 'Test Message',
});
"#;
        std::fs::write(&test_file, test_content).unwrap();

        // Test with base64 pattern
        let output_file1 = temp_dir.path().join("output1.json");
        extract(
            &[test_file.clone()],
            None,
            None,
            Some(&output_file1),
            "[sha512:contenthash:base64:10]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        // Test with hex pattern
        let output_file2 = temp_dir.path().join("output2.json");
        extract(
            &[test_file],
            None,
            None,
            Some(&output_file2),
            "[sha512:contenthash:hex:10]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        // Read both outputs
        let json1: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&output_file1).unwrap()).unwrap();
        let json2: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&output_file2).unwrap()).unwrap();

        // Get the generated IDs
        let id1 = json1.as_object().unwrap().keys().next().unwrap();
        let id2 = json2.as_object().unwrap().keys().next().unwrap();

        // IDs should be different due to different encoding
        assert_ne!(id1, id2, "Different patterns should produce different IDs");

        // Both should be 10 characters
        assert_eq!(id1.len(), 10);
        assert_eq!(id2.len(), 10);
    }

    #[test]
    fn test_extract_messages_without_id_use_pattern() {
        // Test that messages without explicit IDs get auto-generated IDs
        let temp_dir = tempfile::tempdir().unwrap();
        let test_file = temp_dir.path().join("test.tsx");
        let output_file = temp_dir.path().join("output.json");

        let test_content = r#"
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  withId: {
    id: 'explicit.id',
    defaultMessage: 'Message with explicit ID',
  },
  withoutId: {
    defaultMessage: 'Message without ID',
  },
});
"#;
        std::fs::write(&test_file, test_content).unwrap();

        extract(
            &[test_file],
            None,
            None,
            Some(&output_file),
            "[sha512:contenthash:base64:6]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        let output_content = std::fs::read_to_string(&output_file).unwrap();
        let json: serde_json::Value = serde_json::from_str(&output_content).unwrap();

        // Should have two messages
        assert_eq!(json.as_object().unwrap().len(), 2);

        // One should have the explicit ID
        assert!(json.as_object().unwrap().contains_key("explicit.id"));

        // The other should have a generated ID (6 characters)
        let generated_id = json
            .as_object()
            .unwrap()
            .keys()
            .find(|k| *k != "explicit.id")
            .unwrap();
        assert_eq!(generated_id.len(), 6);
    }

    #[test]
    fn test_extract_with_description_affects_generated_id() {
        // Test that description affects the generated ID
        let temp_dir = tempfile::tempdir().unwrap();

        // File 1: Message with description
        let test_file1 = temp_dir.path().join("test1.tsx");
        let test_content1 = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  defaultMessage: 'Hello',
  description: 'A greeting',
});
"#;
        std::fs::write(&test_file1, test_content1).unwrap();

        // File 2: Same message without description
        let test_file2 = temp_dir.path().join("test2.tsx");
        let test_content2 = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  defaultMessage: 'Hello',
});
"#;
        std::fs::write(&test_file2, test_content2).unwrap();

        // Extract both
        let output_file1 = temp_dir.path().join("output1.json");
        extract(
            &[test_file1],
            None,
            None,
            Some(&output_file1),
            "[sha512:contenthash:base64:10]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        let output_file2 = temp_dir.path().join("output2.json");
        extract(
            &[test_file2],
            None,
            None,
            Some(&output_file2),
            "[sha512:contenthash:base64:10]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        // Read outputs
        let json1: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&output_file1).unwrap()).unwrap();
        let json2: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&output_file2).unwrap()).unwrap();

        // Get the generated IDs
        let id1 = json1.as_object().unwrap().keys().next().unwrap();
        let id2 = json2.as_object().unwrap().keys().next().unwrap();

        // IDs should be different because description affects the hash
        assert_ne!(id1, id2, "Description should affect the generated ID");
    }

    #[test]
    fn test_extract_deterministic_id_generation() {
        // Test that extracting the same file twice produces the same IDs
        let temp_dir = tempfile::tempdir().unwrap();
        let test_file = temp_dir.path().join("test.tsx");

        let test_content = r#"
import { defineMessage } from 'react-intl';

const msg = defineMessage({
  defaultMessage: 'Consistent Message',
});
"#;
        std::fs::write(&test_file, test_content).unwrap();

        // Extract first time
        let output_file1 = temp_dir.path().join("output1.json");
        extract(
            &[test_file.clone()],
            None,
            None,
            Some(&output_file1),
            "[sha512:contenthash:base64:10]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        // Extract second time
        let output_file2 = temp_dir.path().join("output2.json");
        extract(
            &[test_file],
            None,
            None,
            Some(&output_file2),
            "[sha512:contenthash:base64:10]",
            false,
            &[],
            &[],
            &[],
            false,
            None,
            false,
            false,
        )
        .unwrap();

        // Read both outputs
        let content1 = std::fs::read_to_string(&output_file1).unwrap();
        let content2 = std::fs::read_to_string(&output_file2).unwrap();

        // Outputs should be identical
        assert_eq!(
            content1, content2,
            "Extracting the same file twice should produce identical output"
        );
    }
}
