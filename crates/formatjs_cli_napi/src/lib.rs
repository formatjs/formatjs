use formatjs_cli::formatters::Formatter;
use napi_derive::napi;

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
