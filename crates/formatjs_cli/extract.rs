use anyhow::{Context, Result};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

use crate::extractor::{
    MessageDescriptor, determine_source_type, extract_messages_from_source,
    extract_messages_from_source_with_diagnostics,
};
use crate::formatters::Formatter;
use crate::id_generator::IdGenerator;
use crate::python_extractor::{
    extract_messages_from_python_source, extract_messages_from_python_source_with_diagnostics,
};
use crate::rust_extractor::{
    extract_messages_from_rust_source, extract_messages_from_rust_source_with_diagnostics,
};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractSourceInput {
    pub filename: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractSourceResult {
    pub filename: String,
    pub messages: Vec<MessageDescriptor>,
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    pub meta: HashMap<String, String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractSourcesResult {
    pub files: Vec<ExtractSourceResult>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub warnings: Vec<String>,
}

#[allow(clippy::too_many_arguments)]
pub fn extract_sources(
    sources: &[ExtractSourceInput],
    id_interpolation_pattern: Option<&str>,
    extract_source_location: bool,
    additional_component_names: &[String],
    additional_function_names: &[String],
    throws: bool,
    pragma: Option<&str>,
    preserve_whitespace: bool,
    flatten: bool,
) -> Result<ExtractSourcesResult> {
    let component_names = build_component_names(additional_component_names);
    let function_names = build_function_names(additional_function_names);
    let id_generator = id_interpolation_pattern.map(IdGenerator::new).transpose()?;

    let files = sources
        .par_iter()
        .map(|input| {
            let path = Path::new(&input.filename);
            let meta = pragma
                .map(|pragma| extract_pragma(&input.source, pragma))
                .unwrap_or_default();
            let result = match path.extension().and_then(|extension| extension.to_str()) {
                Some("rs") => extract_messages_from_rust_source_with_diagnostics(
                    &input.source,
                    path,
                    extract_source_location,
                    preserve_whitespace,
                    flatten,
                    throws,
                )
                .map(|extraction| (extraction.messages, extraction.errors)),
                Some("py") => extract_messages_from_python_source_with_diagnostics(
                    &input.source,
                    path,
                    extract_source_location,
                    preserve_whitespace,
                    flatten,
                    throws,
                )
                .map(|extraction| (extraction.messages, extraction.errors)),
                _ => determine_source_type(path).and_then(|source_type| {
                    extract_messages_from_source_with_diagnostics(
                        &input.source,
                        path,
                        source_type,
                        extract_source_location,
                        &component_names,
                        &function_names,
                        meta.clone(),
                        preserve_whitespace,
                        flatten,
                        throws,
                    )
                    .map(|extraction| (extraction.messages, extraction.errors))
                }),
            };

            match result {
                Ok((mut messages, errors)) => {
                    if let Some(id_generator) = &id_generator {
                        for message in &mut messages {
                            if message.id.is_none() {
                                message.id = Some(id_generator.generate(
                                    message.default_message.as_deref(),
                                    &message.description,
                                    Some(path),
                                )?);
                            }
                        }
                    }
                    Ok(ExtractSourceResult {
                        filename: input.filename.clone(),
                        messages,
                        meta,
                        errors,
                    })
                }
                Err(error) if throws => Err(error),
                Err(error) => Ok(ExtractSourceResult {
                    filename: input.filename.clone(),
                    messages: Vec::new(),
                    meta,
                    errors: vec![error.to_string()],
                }),
            }
        })
        .collect::<Result<Vec<_>>>()?;

    Ok(ExtractSourcesResult {
        files,
        warnings: Vec::new(),
    })
}

/// Extract messages from JavaScript, TypeScript, Rust, and Python source files.
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
    follow_links: bool,
) -> Result<()> {
    let output = extract_to_string(
        files,
        format,
        in_file,
        id_interpolation_pattern,
        extract_source_location,
        additional_component_names,
        additional_function_names,
        ignore,
        throws,
        pragma,
        preserve_whitespace,
        flatten,
        follow_links,
    )?;

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

    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub fn extract_to_string(
    files: &[PathBuf],
    format: Option<Formatter>,
    in_file: Option<&PathBuf>,
    id_interpolation_pattern: &str,
    extract_source_location: bool,
    additional_component_names: &[String],
    additional_function_names: &[String],
    ignore: &[String],
    throws: bool,
    pragma: Option<&str>,
    preserve_whitespace: bool,
    flatten: bool,
    follow_links: bool,
) -> Result<String> {
    // Step 1: Resolve file list from glob patterns or in_file
    let input_files = if let Some(in_f) = in_file {
        read_file_list(in_f)?
    } else {
        files.to_vec()
    };
    let file_list = resolve_files_from_globs(&input_files, ignore, follow_links, throws)?;

    // Step 2: Extract messages from all files
    let mut all_messages: BTreeMap<String, MessageDescriptor> = BTreeMap::new();
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let component_names = build_component_names(additional_component_names);
    let function_names = build_function_names(additional_function_names);
    let id_generator = IdGenerator::new(id_interpolation_pattern)?;

    let mut extracted_files: Vec<_> = file_list
        .par_iter()
        .enumerate()
        .map(|(index, file_path)| {
            (
                index,
                file_path.clone(),
                extract_from_file(
                    file_path,
                    extract_source_location,
                    &component_names,
                    &function_names,
                    pragma,
                    preserve_whitespace,
                    flatten,
                    throws,
                ),
            )
        })
        .collect();
    extracted_files.sort_by_key(|(index, _, _)| *index);

    for (_, file_path, result) in extracted_files {
        // To match TypeScript CLI behavior, we hash the message AFTER flattening
        match result {
            Ok(messages) => {
                for mut msg in messages.into_iter() {
                    // Generate ID if not present
                    let id = if let Some(id) = msg.id.clone() {
                        id
                    } else {
                        // Hash the (possibly flattened) message
                        id_generator.generate(
                            msg.default_message.as_deref(),
                            &msg.description,
                            Some(file_path.as_path()),
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
                // A failed read makes the catalog incomplete, even in best-effort mode.
                if throws || e.is::<io::Error>() {
                    return Err(e).with_context(|| format!("Error in {}", file_path.display()));
                }
                let err_msg = format!("Error in {}: {}", file_path.display(), e);
                eprintln!("{}", err_msg);
                errors.push(err_msg);
            }
        }
    }

    // Step 3: Apply formatter if specified
    let output = if let Some(formatter) = format {
        // Apply formatter to convert MessageDescriptor to vendor-specific format
        // This outputs the vendor format directly (e.g., for crowdin: {id: {message, description}})
        let vendor_json = formatter.format_to_vendor_json(&all_messages);

        // Convert to JSON output
        serde_json::to_string_pretty(&vendor_json)?
    } else {
        // Default format: MessageDescriptor objects without the 'id' field (matches TypeScript CLI)
        // TypeScript CLI does: for (const {id, ...msg} of messages) { results[id] = msg }
        let mut output_map = serde_json::Map::new();
        for (id, mut msg) in all_messages {
            // Remove the 'id' field from the message descriptor before serialization
            msg.id = None;
            let msg_json = serde_json::to_value(msg)?;
            output_map.insert(id, msg_json);
        }
        serde_json::to_string_pretty(&output_map)?
    };

    if !errors.is_empty() && throws {
        anyhow::bail!("Extraction completed with {} errors", errors.len());
    }

    Ok(output)
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

/// Extract the base directory from a glob pattern (the prefix before the first wildcard).
/// For example, `src/components/**/*.ts` returns `src/components`.
/// If the pattern starts with a wildcard, returns `.` (current directory).
pub fn extract_base_dir(pattern: &str) -> PathBuf {
    // Find the first wildcard character (*, ?, [, {)
    let wildcard_pos = pattern
        .find(|c: char| c == '*' || c == '?' || c == '[' || c == '{')
        .unwrap_or(pattern.len());

    let prefix = &pattern[..wildcard_pos];

    // Find the last path separator in the prefix. Windows accepts both `\` and
    // `/`, and native callers pass real Windows paths through this helper.
    if let Some(sep_pos) = prefix.rfind(|c| c == '/' || c == '\\') {
        let dir = if sep_pos == 2 && prefix.as_bytes().get(1) == Some(&b':') {
            &pattern[..=sep_pos]
        } else {
            &pattern[..sep_pos]
        };
        if dir.is_empty() {
            PathBuf::from(&pattern[..=sep_pos])
        } else {
            PathBuf::from(dir)
        }
    } else {
        PathBuf::from(".")
    }
}

/// Resolve files from glob patterns, excluding ignore patterns.
/// Uses `walkdir` for filesystem traversal and `fast_glob::glob_match` for pattern matching.
fn resolve_files_from_globs(
    globs: &[PathBuf],
    ignore: &[String],
    follow_links: bool,
    throws: bool,
) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();

    for glob_path in globs {
        let glob_str = glob_path
            .to_str()
            .context("Invalid UTF-8 in glob pattern")?;
        let is_glob = glob_str.contains(|c| matches!(c, '*' | '?' | '[' | '{'));

        match fs::metadata(glob_path) {
            Ok(metadata) if metadata.is_file() => {
                if should_ignore(glob_path, ignore) {
                    continue;
                }
                if is_supported_file(glob_path) {
                    files.push(glob_path.to_path_buf());
                    continue;
                }

                let message = format!("Unsupported input file type: {}", glob_path.display());
                if throws {
                    anyhow::bail!(message);
                }
                eprintln!("{message}");
                continue;
            }
            Ok(_) if !is_glob => {
                let message = format!("Input path is not a file: {}", glob_path.display());
                if throws {
                    anyhow::bail!(message);
                }
                eprintln!("{message}");
                continue;
            }
            Err(error) if !is_glob => {
                let message = format!(
                    "Failed to resolve input file {}: {error}",
                    glob_path.display()
                );
                if throws {
                    anyhow::bail!(message);
                }
                eprintln!("{message}");
                continue;
            }
            _ => {}
        }

        let base_dir = extract_base_dir(glob_str);

        match base_dir.try_exists() {
            Ok(true) => {}
            Ok(false) => {
                if throws {
                    anyhow::bail!(
                        "Failed to resolve glob pattern {glob_str}: base directory {} does not exist",
                        base_dir.display()
                    );
                }
                // A glob matching nothing is valid in best-effort mode.
                continue;
            }
            Err(error) => {
                let message = format!(
                    "Failed to access base directory {} for glob pattern {glob_str}: {error}",
                    base_dir.display()
                );
                if throws {
                    anyhow::bail!(message);
                }
                eprintln!("{message}");
                continue;
            }
        }

        for entry in WalkDir::new(&base_dir).follow_links(follow_links) {
            let entry = match entry {
                Ok(entry) => entry,
                Err(error) => {
                    let message =
                        format!("Failed to traverse files for glob pattern {glob_str}: {error}");
                    if throws {
                        anyhow::bail!(message);
                    }
                    eprintln!("{message}");
                    continue;
                }
            };
            let path = entry.path();

            // Skip directories
            if path.is_dir() {
                continue;
            }

            let path_str = path.to_string_lossy();

            // Match against the glob pattern
            if !fast_glob::glob_match(glob_str, path_str.as_ref()) {
                continue;
            }

            // Skip if matches any ignore pattern
            if should_ignore(path, ignore) {
                continue;
            }

            // Only process supported file types
            if is_supported_file(path) {
                files.push(path.to_path_buf());
            }
        }
    }

    Ok(files)
}

/// Check if a path should be ignored
fn should_ignore(path: &Path, patterns: &[String]) -> bool {
    let path_str = path.to_string_lossy();
    patterns
        .iter()
        .any(|p| fast_glob::glob_match(p, path_str.as_ref()))
}

/// Check if file has supported extension
fn is_supported_file(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        matches!(
            ext.to_string_lossy().as_ref(),
            "ts" | "tsx" | "mts" | "cts" | "js" | "jsx" | "mjs" | "cjs" | "rs" | "py"
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
        "$formatMessage".to_string(),
        "$t".to_string(),
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

    if path.extension().and_then(|extension| extension.to_str()) == Some("rs") {
        return extract_messages_from_rust_source(
            &source_text,
            path,
            extract_source_location,
            preserve_whitespace,
            flatten,
            throws,
        );
    }

    if path.extension().and_then(|extension| extension.to_str()) == Some("py") {
        return extract_messages_from_python_source(
            &source_text,
            path,
            extract_source_location,
            preserve_whitespace,
            flatten,
            throws,
        );
    }

    let source_type = determine_source_type(path)?;
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
