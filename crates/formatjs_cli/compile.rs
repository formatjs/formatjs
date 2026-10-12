use anyhow::{Context, Result};
use formatjs_icu_messageformat_parser::MessageFormatElement;
use rayon::prelude::*;
use serde_json::{Map, Value, json};
use std::collections::BTreeMap;
use std::path::PathBuf;
use walkdir::WalkDir;

use crate::formatters::Formatter;

pub type CompiledInputMessages = BTreeMap<String, (String, PathBuf)>;

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

const XX_LS_SUFFIX: &str = "SSSSSSSSSSSSSSSSSSSSSSSSS";
const XX_HA_PREFIX: &str = "[javascript]";
const EN_XA_PREFIX: &str = "[";
const EN_XA_SUFFIX: &str = "]";
const EN_XB_PREFIX: &str = "\u{202e}";
const EN_XB_SUFFIX: &str = "\u{202c}";

const ACCENTED_CAPS: [u32; 26] = [
    550, 385, 391, 7698, 7702, 401, 403, 294, 298, 308, 310, 319, 7742, 544, 510, 420, 586, 344,
    350, 358, 364, 7804, 7814, 7818, 7822, 7824,
];

const ACCENTED_SMALL: [u32; 26] = [
    551, 384, 392, 7699, 7703, 402, 608, 295, 299, 309, 311, 320, 7743, 414, 511, 421, 587, 345,
    351, 359, 365, 7805, 7815, 7819, 7823, 7825,
];

const FLIPPED_CAPS: [u32; 26] = [
    8704, 1296, 8579, 5601, 398, 8498, 8513, 72, 73, 383, 1276, 8514, 87, 78, 79, 1280, 210, 7450,
    83, 8869, 8745, 581, 77, 88, 8516, 90,
];

const FLIPPED_SMALL: [u32; 26] = [
    592, 113, 596, 112, 477, 607, 387, 613, 305, 638, 670, 645, 623, 117, 111, 100, 98, 633, 115,
    647, 110, 652, 653, 120, 654, 122,
];

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
///     true,
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
    follow_links: bool,
) -> Result<()> {
    let output = compile_to_string(
        translation_files,
        format,
        ast,
        skip_errors,
        pseudo_locale,
        ignore_tag,
        follow_links,
    )?;

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

#[allow(clippy::too_many_arguments)]
pub fn compile_to_string(
    translation_files: &[PathBuf],
    format: Option<Formatter>,
    ast: bool,
    skip_errors: bool,
    pseudo_locale: Option<PseudoLocale>,
    ignore_tag: bool,
    follow_links: bool,
) -> Result<String> {
    // Default to "default" formatter if none provided (matches TypeScript CLI)
    let formatter = format.unwrap_or(Formatter::Default);

    // Step 1: Expand glob patterns to actual file paths
    let mut expanded_files = Vec::new();
    for pattern in translation_files {
        if pattern.is_file() {
            expanded_files.push(pattern.clone());
            continue;
        }

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

    if expanded_files.is_empty() {
        anyhow::bail!("No translation files found matching the patterns");
    }

    // Step 2: Load and aggregate all messages from files
    // Store both message and source file for better error reporting
    let mut messages: BTreeMap<String, (String, PathBuf)> = BTreeMap::new();

    let mut loaded_files: Vec<_> = expanded_files
        .par_iter()
        .enumerate()
        .map(|(index, file)| {
            let result = (|| -> Result<_> {
                let content = std::fs::read_to_string(file)
                    .with_context(|| format!("Failed to read file: {}", file.display()))?;

                let json: Value = serde_json::from_str(&content)
                    .with_context(|| format!("Failed to parse JSON in file: {}", file.display()))?;

                // Apply formatter to extract messages
                let file_path_str = file.to_str().unwrap_or("<invalid path>");
                formatter.apply(&json, file_path_str)
            })();

            (index, file.clone(), result)
        })
        .collect();
    loaded_files.sort_by_key(|(index, _, _)| *index);

    for (_, file, result) in loaded_files {
        let file_messages = result?;

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

    compile_messages_to_string(messages, ast, skip_errors, pseudo_locale, ignore_tag)
}

pub fn compile_messages_to_string(
    messages: CompiledInputMessages,
    ast: bool,
    skip_errors: bool,
    pseudo_locale: Option<PseudoLocale>,
    ignore_tag: bool,
) -> Result<String> {
    use formatjs_icu_messageformat_parser::{Parser, ParserOptions};

    enum CompileMessageResult {
        Parsed {
            index: usize,
            id: String,
            value: Value,
        },
        ParseError {
            index: usize,
            warning: String,
            syntax_error: String,
        },
        Fatal {
            index: usize,
            error: anyhow::Error,
        },
    }

    impl CompileMessageResult {
        fn index(&self) -> usize {
            match self {
                Self::Parsed { index, .. }
                | Self::ParseError { index, .. }
                | Self::Fatal { index, .. } => *index,
            }
        }
    }

    // Validate pseudo-locale requires ast
    if pseudo_locale.is_some() && !ast {
        anyhow::bail!("Pseudo-locale generation requires --ast flag");
    }

    // Parse and validate ICU MessageFormat, compile to output format
    let mut compiled_messages: Map<String, Value> = Map::new();
    let mut error_count = 0;

    let parser_options = ParserOptions {
        ignore_tag,
        should_parse_skeletons: true,
        requires_other_clause: true,
        ..Default::default()
    };

    let message_entries: Vec<_> = messages.iter().collect();
    let mut parsed_messages: Vec<_> = message_entries
        .into_par_iter()
        .enumerate()
        .map(|(index, (id, message_data))| {
            let (message, source_file) = (&message_data.0, &message_data.1);
            let parser_options = parser_options.clone();
            let parser = Parser::new(message.as_str(), parser_options);
            match parser.parse() {
                Ok(mut msg_ast) => {
                    let value = if ast {
                        if let Some(locale) = pseudo_locale {
                            msg_ast = apply_pseudo_locale(msg_ast, locale);
                        }

                        match serde_json::to_value(&msg_ast).with_context(|| {
                            format!("Failed to serialize AST for message '{}'", id)
                        }) {
                            Ok(ast_json) => ast_json,
                            Err(error) => return CompileMessageResult::Fatal { index, error },
                        }
                    } else {
                        json!(message)
                    };

                    CompileMessageResult::Parsed {
                        index,
                        id: (*id).clone(),
                        value,
                    }
                }
                Err(e) => CompileMessageResult::ParseError {
                    index,
                    warning: format!(
                        "[@formatjs/cli] [WARN] Error validating message \"{}\" with ID \"{}\" in file {}",
                        message,
                        id,
                        source_file.display()
                    ),
                    syntax_error: format!("SyntaxError: {}", e),
                },
            }
        })
        .collect();
    parsed_messages.sort_by_key(CompileMessageResult::index);

    for result in parsed_messages {
        match result {
            CompileMessageResult::Parsed { id, value, .. } => {
                compiled_messages.insert(id, value);
            }
            CompileMessageResult::ParseError {
                warning,
                syntax_error,
                ..
            } => {
                error_count += 1;
                if skip_errors {
                    eprintln!("{}", warning);
                } else {
                    anyhow::bail!(syntax_error);
                }
            }
            CompileMessageResult::Fatal { error, .. } => return Err(error),
        }
    }

    if error_count > 0 {
        eprintln!("\nSkipped {} message(s) with parsing errors", error_count);
    }

    // Step 4: Serialize and write output
    let output_json = Value::Object(compiled_messages);
    let output = serde_json::to_string_pretty(&output_json)
        .context("Failed to serialize compiled messages to JSON")?;

    Ok(output)
}

fn apply_pseudo_locale(
    mut ast: Vec<MessageFormatElement>,
    pseudo_locale: PseudoLocale,
) -> Vec<MessageFormatElement> {
    match pseudo_locale {
        PseudoLocale::XxLs => {
            if let Some(MessageFormatElement::Literal(last)) = ast.last_mut() {
                last.value.push_str(XX_LS_SUFFIX);
            } else {
                ast.push(MessageFormatElement::literal(XX_LS_SUFFIX.to_string()));
            }
            ast
        }
        PseudoLocale::XxAc => {
            transform_literal_elements(&mut ast, &|value| value.to_uppercase());
            ast
        }
        PseudoLocale::XxHa => {
            if let Some(MessageFormatElement::Literal(first)) = ast.first_mut() {
                first.value.insert_str(0, XX_HA_PREFIX);
            } else {
                ast.insert(0, MessageFormatElement::literal(XX_HA_PREFIX.to_string()));
            }
            ast
        }
        PseudoLocale::EnXa => {
            transform_literal_elements(&mut ast, &|value| {
                transform_ascii(value, &ACCENTED_SMALL, &ACCENTED_CAPS, true)
            });

            let mut wrapped = Vec::with_capacity(ast.len() + 2);
            wrapped.push(MessageFormatElement::literal(EN_XA_PREFIX.to_string()));
            wrapped.extend(ast);
            wrapped.push(MessageFormatElement::literal(EN_XA_SUFFIX.to_string()));
            wrapped
        }
        PseudoLocale::EnXb => {
            transform_literal_elements(&mut ast, &|value| {
                transform_ascii(value, &FLIPPED_SMALL, &FLIPPED_CAPS, false)
            });

            let mut wrapped = Vec::with_capacity(ast.len() + 2);
            wrapped.push(MessageFormatElement::literal(EN_XB_PREFIX.to_string()));
            wrapped.extend(ast);
            wrapped.push(MessageFormatElement::literal(EN_XB_SUFFIX.to_string()));
            wrapped
        }
    }
}

fn transform_literal_elements(
    ast: &mut [MessageFormatElement],
    transform: &impl Fn(&str) -> String,
) {
    for element in ast {
        match element {
            MessageFormatElement::Literal(literal) => {
                literal.value = transform(&literal.value);
            }
            MessageFormatElement::Plural(plural) => {
                for option in plural.options.values_mut() {
                    transform_literal_elements(&mut option.value, transform);
                }
            }
            MessageFormatElement::Select(select) => {
                for option in select.options.values_mut() {
                    transform_literal_elements(&mut option.value, transform);
                }
            }
            MessageFormatElement::Tag(tag) => {
                transform_literal_elements(&mut tag.children, transform);
            }
            _ => {}
        }
    }
}

fn transform_ascii(
    message: &str,
    small_map: &[u32; 26],
    caps_map: &[u32; 26],
    elongate: bool,
) -> String {
    let mut result = String::with_capacity(message.len());

    for ch in message.chars() {
        if ch.is_ascii_lowercase() {
            let index = (ch as u8 - b'a') as usize;
            let mapped = char::from_u32(small_map[index]).expect("valid pseudo-locale codepoint");
            result.push(mapped);
            if elongate && matches!(ch, 'a' | 'e' | 'o' | 'u') {
                result.push(mapped);
            }
        } else if ch.is_ascii_uppercase() {
            let index = (ch as u8 - b'A') as usize;
            result.push(char::from_u32(caps_map[index]).expect("valid pseudo-locale codepoint"));
        } else {
            result.push(ch);
        }
    }

    result
}
