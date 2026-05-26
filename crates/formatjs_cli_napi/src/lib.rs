use std::collections::BTreeMap;
use std::path::PathBuf;

use formatjs_cli::compile::{self as cli_compile, PseudoLocale};
use formatjs_cli::extract as cli_extract;
use formatjs_cli::formatters::Formatter;
use napi::Error;
use napi_derive::napi;

#[napi(object)]
pub struct CompileOptions {
    pub format: Option<String>,
    pub ast: Option<bool>,
    pub skip_errors: Option<bool>,
    pub pseudo_locale: Option<String>,
    pub ignore_tag: Option<bool>,
    pub follow_links: Option<bool>,
}

#[napi(object)]
pub struct CompileMessage {
    pub id: String,
    pub message: String,
    pub source_file: String,
}

#[napi(object)]
#[derive(Default)]
pub struct ExtractOptions {
    pub format: Option<String>,
    pub in_file: Option<String>,
    pub id_interpolation_pattern: Option<String>,
    pub extract_source_location: Option<bool>,
    pub additional_component_names: Option<Vec<String>>,
    pub additional_function_names: Option<Vec<String>>,
    pub ignore: Option<Vec<String>>,
    pub throws: Option<bool>,
    pub pragma: Option<String>,
    pub preserve_whitespace: Option<bool>,
    pub flatten: Option<bool>,
    pub follow_links: Option<bool>,
}

#[napi]
pub fn supported_builtin_formatters() -> Vec<String> {
    [
        Formatter::Default,
        Formatter::Simple,
        Formatter::Transifex,
        Formatter::Smartling,
        Formatter::Lokalise,
        Formatter::Crowdin,
    ]
    .into_iter()
    .map(|formatter| formatter.as_str().to_string())
    .collect()
}

#[napi]
pub fn compile(
    translation_files: Vec<String>,
    opts: Option<CompileOptions>,
) -> napi::Result<String> {
    let opts = opts.unwrap_or_default();
    let files = translation_files
        .into_iter()
        .map(PathBuf::from)
        .collect::<Vec<_>>();

    cli_compile::compile_to_string(
        &files,
        parse_formatter(opts.format)?,
        opts.ast.unwrap_or(false),
        opts.skip_errors.unwrap_or(false),
        parse_pseudo_locale(opts.pseudo_locale)?,
        opts.ignore_tag.unwrap_or(false),
        opts.follow_links.unwrap_or(true),
    )
    .map_err(to_napi_error)
}

#[napi]
pub fn compile_messages(
    messages: Vec<CompileMessage>,
    opts: Option<CompileOptions>,
) -> napi::Result<String> {
    let opts = opts.unwrap_or_default();
    let mut compiled_messages: cli_compile::CompiledInputMessages = BTreeMap::new();

    for message in messages {
        if let Some((existing, existing_file)) = compiled_messages.get(&message.id) {
            if existing != &message.message {
                return Err(Error::from_reason(format!(
                    "Conflicting ID \"{}\" with different translation found in these 2 files:\n  {}\n  {}",
                    message.id, existing_file.display(), message.source_file
                )));
            }
        }
        compiled_messages.insert(
            message.id,
            (message.message, PathBuf::from(message.source_file)),
        );
    }

    if compiled_messages.is_empty() {
        eprintln!("Warning: No messages found in translation files");
    }

    cli_compile::compile_messages_to_string(
        compiled_messages,
        opts.ast.unwrap_or(false),
        opts.skip_errors.unwrap_or(false),
        parse_pseudo_locale(opts.pseudo_locale)?,
        opts.ignore_tag.unwrap_or(false),
    )
    .map_err(to_napi_error)
}

#[napi]
pub fn extract(files: Vec<String>, opts: Option<ExtractOptions>) -> napi::Result<String> {
    let opts = opts.unwrap_or_default();
    let files = files.into_iter().map(PathBuf::from).collect::<Vec<_>>();
    let in_file = opts.in_file.map(PathBuf::from);
    let additional_component_names = opts.additional_component_names.unwrap_or_default();
    let additional_function_names = opts.additional_function_names.unwrap_or_default();
    let ignore = opts.ignore.unwrap_or_default();
    let id_interpolation_pattern = opts
        .id_interpolation_pattern
        .as_deref()
        .unwrap_or("[sha512:contenthash:base64:6]");

    cli_extract::extract_to_string(
        &files,
        parse_formatter(opts.format)?,
        in_file.as_ref(),
        id_interpolation_pattern,
        opts.extract_source_location.unwrap_or(false),
        &additional_component_names,
        &additional_function_names,
        &ignore,
        opts.throws.unwrap_or(false),
        opts.pragma.as_deref(),
        opts.preserve_whitespace.unwrap_or(false),
        opts.flatten.unwrap_or(false),
        opts.follow_links.unwrap_or(true),
    )
    .map_err(to_napi_error)
}

impl Default for CompileOptions {
    fn default() -> Self {
        Self {
            format: None,
            ast: None,
            skip_errors: None,
            pseudo_locale: None,
            ignore_tag: None,
            follow_links: None,
        }
    }
}

fn parse_formatter(format: Option<String>) -> napi::Result<Option<Formatter>> {
    format
        .map(|name| Formatter::from_str(&name).map_err(to_napi_error))
        .transpose()
}

fn parse_pseudo_locale(pseudo_locale: Option<String>) -> napi::Result<Option<PseudoLocale>> {
    pseudo_locale
        .map(|locale| match locale.as_str() {
            "xx-LS" => Ok(PseudoLocale::XxLs),
            "xx-AC" => Ok(PseudoLocale::XxAc),
            "xx-HA" => Ok(PseudoLocale::XxHa),
            "en-XA" => Ok(PseudoLocale::EnXa),
            "en-XB" => Ok(PseudoLocale::EnXb),
            _ => Err(Error::from_reason(format!(
                "Unknown pseudo locale '{}'. Available pseudo locales: xx-LS, xx-AC, xx-HA, en-XA, en-XB",
                locale
            ))),
        })
        .transpose()
}

fn to_napi_error(error: impl std::fmt::Display) -> Error {
    Error::from_reason(error.to_string())
}
