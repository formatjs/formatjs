use anyhow::{Context, Result};
use base64::Engine;
use glob::Pattern;
use sha2::{Digest, Sha512};
use std::collections::HashMap;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use crate::extractor::{determine_source_type, extract_messages_from_source, MessageDescriptor};
use crate::formatters::Formatter;
use serde_json::Value;

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
    let mut all_messages: HashMap<String, MessageDescriptor> = HashMap::new();
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
        // Convert messages to JSON for formatter
        let messages_json = serde_json::to_value(&all_messages)?;

        // Apply formatter (returns HashMap<String, String>)
        let formatted = formatter.apply(&messages_json, "extracted messages")?;

        // Convert to JSON output
        serde_json::to_string_pretty(&formatted)?
    } else {
        // Default format: full MessageDescriptor objects
        serde_json::to_string_pretty(&all_messages)?
    };

    // Step 4: Write output
    if let Some(out_f) = out_file {
        // Create parent directories if they don't exist
        if let Some(parent) = out_f.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create parent directories for {}", out_f.display()))?;
        }
        fs::write(out_f, output)
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

        let entries = glob::glob(glob_str)
            .with_context(|| format!("Invalid glob pattern: {}", glob_str))?;

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

/// Generate message ID using interpolation pattern
fn generate_id(
    pattern: &str,
    default_message: Option<&str>,
    description: &Option<Value>,
    _file_path: Option<&str>,
) -> Result<String> {
    // Parse pattern: [hash:digest:encoding:length]
    // Default: [sha512:contenthash:base64:6]

    if !pattern.starts_with('[') || !pattern.ends_with(']') {
        anyhow::bail!("Invalid ID interpolation pattern: {}", pattern);
    }

    let inner = &pattern[1..pattern.len() - 1];
    let parts: Vec<&str> = inner.split(':').collect();

    if parts.len() < 4 {
        anyhow::bail!(
            "Invalid ID interpolation pattern format: {}. Expected [hash:digest:encoding:length]",
            pattern
        );
    }

    let hash_algo = parts[0];
    let digest_type = parts[1];
    let encoding = parts[2];
    let length: usize = parts[3]
        .parse()
        .context("Invalid length in ID interpolation pattern")?;

    // Build content hash input
    let mut content = String::new();
    if let Some(msg) = default_message {
        content.push_str(msg);
    }
    if let Some(desc) = description {
        content.push('#');
        content.push_str(&desc.to_string());
    }

    // Generate hash
    let hash = match (hash_algo, digest_type) {
        ("sha512", "contenthash") => {
            let mut hasher = Sha512::new();
            hasher.update(content.as_bytes());
            let result = hasher.finalize();
            match encoding {
                "base64" => {
                    let encoded = base64::engine::general_purpose::STANDARD.encode(&result);
                    // base64 URL-safe: replace + with - and / with _
                    encoded.replace('+', "-").replace('/', "_")
                }
                "hex" => hex::encode(result),
                _ => anyhow::bail!("Unsupported encoding: {}", encoding),
            }
        }
        _ => anyhow::bail!(
            "Unsupported hash algorithm or digest type: {}:{}",
            hash_algo,
            digest_type
        ),
    };

    // Truncate to specified length
    Ok(hash.chars().take(length).collect())
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
    fn test_generate_id_sha512_base64() {
        let id = generate_id(
            "[sha512:contenthash:base64:6]",
            Some("Hello World"),
            &None,
            None,
        )
        .unwrap();
        assert_eq!(id.len(), 6);
        // Should be URL-safe base64
        assert!(!id.contains('+'));
        assert!(!id.contains('/'));
    }

    #[test]
    fn test_generate_id_with_description() {
        let desc = serde_json::Value::String("A greeting".to_string());
        let id = generate_id(
            "[sha512:contenthash:base64:8]",
            Some("Hello"),
            &Some(desc),
            None,
        )
        .unwrap();
        assert_eq!(id.len(), 8);
    }

    #[test]
    fn test_generate_id_hex() {
        let id = generate_id(
            "[sha512:contenthash:hex:10]",
            Some("Test"),
            &None,
            None,
        )
        .unwrap();
        assert_eq!(id.len(), 10);
        // Should be hex characters
        assert!(id.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_generate_id_invalid_pattern() {
        let result = generate_id("invalid", Some("Test"), &None, None);
        assert!(result.is_err());
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
}
