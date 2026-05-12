use std::path::PathBuf;

use formatjs_cli::compile::{self as cli_compile, PseudoLocale};
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
pub fn compile(translation_files: Vec<String>, opts: Option<CompileOptions>) -> napi::Result<String> {
    let opts = opts.unwrap_or_default();
    let files = translation_files.into_iter().map(PathBuf::from).collect::<Vec<_>>();

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
