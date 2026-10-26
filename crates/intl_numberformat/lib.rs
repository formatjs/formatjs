//! Number locale records loaded by the embedding, independent of its ICU data.
mod data;
pub mod registry;

pub use data::LocaleData;

#[derive(Debug)]
pub enum Error {
    InvalidData(String),
    InvalidLocale,
    MissingLocale,
    Range(&'static str),
    Type(&'static str),
}

impl std::fmt::Display for Error {
    fn fmt(&self, output: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(output, "{self:?}")
    }
}
impl std::error::Error for Error {}
